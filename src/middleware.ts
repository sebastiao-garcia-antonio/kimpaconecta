import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decode } from "next-auth/jwt";

async function decodificarPapeis(rawToken: string, isSecure: boolean): Promise<string[]> {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "kimpa_secret_key_super_segura_2026_vercel_production";

  const salts = isSecure
    ? ["__Secure-authjs.session-token", "__Secure-next-auth.session-token"]
    : ["authjs.session-token", "next-auth.session-token"];

  for (const salt of salts) {
    try {
      const decoded = await decode({ token: rawToken, secret, salt });
      if (decoded?.roles && Array.isArray(decoded.roles)) {
        return decoded.roles as string[];
      }
    } catch {
      // continua para o próximo salt
    }
  }
  return [];
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
    ["/", "/login", "/registro", "/auth-error"].includes(pathname) ||
    pathname.startsWith("/perfil/") ||
    pathname.startsWith("/publicacao/");

  // Redirecionar para login se tentar aceder a áreas privadas sem sessão
  if (!rawToken && !isPublicRoute) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirecionar utilizadores com sessão no /login para o respetivo dashboard
  if (rawToken && pathname === "/login") {
    const roles = await decodificarPapeis(rawToken, isSecure);
    const destino = obterDestinoPorPapel(roles);
    return NextResponse.redirect(new URL(destino, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
