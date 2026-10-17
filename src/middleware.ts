import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decode } from "next-auth/jwt";

const DEFAULT_AUTH_SECRET = "f63c87e834bd31b6727289b4f9d45e73ef9b12bb1de29b93abde65fa1a2b1660";

function obterSegredosPossiveis(): string[] {
  const segredos: string[] = [];
  const s1 = process.env.AUTH_SECRET;
  const s2 = process.env.NEXTAUTH_SECRET;

  if (s1 && !s1.includes("http") && s1.trim().length >= 16) {
    segredos.push(s1.trim());
  }
  if (s2 && !s2.includes("http") && s2.trim().length >= 16 && !segredos.includes(s2.trim())) {
    segredos.push(s2.trim());
  }
  if (!segredos.includes(DEFAULT_AUTH_SECRET)) {
    segredos.push(DEFAULT_AUTH_SECRET);
  }
  return segredos;
}

async function descodificarSessao(
  rawToken: string,
  isSecure: boolean
): Promise<{ roles: string[] } | null> {
  const segredos = obterSegredosPossiveis();

  // Testar todas as combinações de salt do NextAuth / Auth.js
  const salts = isSecure
    ? [
        "__Secure-authjs.session-token",
        "authjs.session-token",
        "__Secure-next-auth.session-token",
        "next-auth.session-token",
        ""
      ]
    : [
        "authjs.session-token",
        "__Secure-authjs.session-token",
        "next-auth.session-token",
        "__Secure-next-auth.session-token",
        ""
      ];

  for (const secret of segredos) {
    for (const salt of salts) {
      try {
        const decoded = await decode({ token: rawToken, secret, salt });
        if (decoded) {
          const roles = Array.isArray(decoded.roles)
            ? (decoded.roles as string[])
            : (decoded as any).role
            ? [String((decoded as any).role)]
            : [];
          return { roles };
        }
      } catch {
        // Tenta a próxima combinação
      }
    }
  }
  return null;
}

function limparCookiesDeSessao(response: NextResponse): NextResponse {
  for (const nome of [
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
  ]) {
    response.cookies.delete(nome);
  }
  return response;
}

function obterDestinoPorPapel(roles: string[]): string {
  if (roles.includes("admin")) return "/admin";
  if (roles.includes("coordenador")) return "/coordenador";
  if (roles.includes("professor")) return "/professor";
  return "/estudante";
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isApiRoute = pathname.startsWith("/api");
  const isStaticFile = /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$/i.test(pathname);

  if (isApiRoute || isStaticFile) {
    return NextResponse.next();
  }

  const isSecure =
    req.cookies.has("__Secure-authjs.session-token") ||
    req.cookies.has("__Secure-next-auth.session-token") ||
    req.nextUrl.protocol === "https:";

  const rawToken =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("next-auth.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value;

  const isPublicRoute =
    ["/", "/login", "/registro", "/reset-password", "/auth-error"].includes(pathname) ||
    pathname.startsWith("/perfil/") ||
    pathname.startsWith("/publicacao/");

  // Valida a sessão a partir do token (não basta o cookie existir)
  const sessao = rawToken ? await descodificarSessao(rawToken, isSecure) : null;

  // Cookie presente mas inválido/expirado → tratar como visitante e limpá-lo
  if (rawToken && !sessao) {
    if (isPublicRoute) {
      return limparCookiesDeSessao(NextResponse.next());
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return limparCookiesDeSessao(NextResponse.redirect(loginUrl));
  }

  // Redirecionar para login se tentar aceder a áreas privadas sem sessão válida
  if (!sessao && !isPublicRoute) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirecionar utilizadores com sessão válida no /login para o respetivo dashboard
  if (sessao && pathname === "/login") {
    const destino = obterDestinoPorPapel(sessao.roles);
    return NextResponse.redirect(new URL(destino, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
