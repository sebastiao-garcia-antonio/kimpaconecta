import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decode } from "next-auth/jwt";

async function descodificarSessao(
  rawToken: string,
  isSecure: boolean
): Promise<{ roles: string[] } | null> {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "f63c87e834bd31b6727289b4f9d45e73ef9b12bb1de29b93abde65fa1a2b1660";

  const salts = isSecure
    ? ["__Secure-authjs.session-token", "__Secure-next-auth.session-token"]
    : ["authjs.session-token", "next-auth.session-token"];

  for (const salt of salts) {
    try {
      const decoded = await decode({ token: rawToken, secret, salt });
      if (decoded) {
        return {
          roles: Array.isArray(decoded.roles) ? (decoded.roles as string[]) : [],
        };
      }
    } catch {
      // token inválido para este salt, tenta o próximo
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
    req.cookies.has("__Secure-next-auth.session-token");

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
