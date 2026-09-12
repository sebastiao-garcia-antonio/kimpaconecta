import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Verificar existência de token de sessão de forma leve no Edge Runtime
  const token =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("next-auth.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value;

  const isPublicRoute = ["/", "/login", "/registro", "/auth-error"].includes(pathname);
  const isApiRoute = pathname.startsWith("/api");
  const isStaticFile = /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$/i.test(pathname);

  if (isApiRoute || isStaticFile) {
    return NextResponse.next();
  }

  // Redirecionar para login se tentar aceder a áreas privadas sem sessão
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Redirecionar utilizadores com sessão no /login para a página inicial
  if (token && pathname === "/login") {
    return NextResponse.redirect(new URL("/estudante", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
