import { NextResponse } from "next/server";
import { authConfig } from "./features/auth/auth.config";
import NextAuth from "next-auth";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  try {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;
    const userRoles: string[] = (req.auth?.user as any)?.roles || [];

    const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
    const isPublicRoute = ["/", "/login", "/registro", "/auth-error"].includes(nextUrl.pathname);

    if (isApiAuthRoute) return NextResponse.next();

    // 1. Redirecionar utilizadores não autenticados a tentar aceder a áreas protegidas
    if (!isLoggedIn && !isPublicRoute) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }

    // 2. Redirecionar utilizadores autenticados que naveguem para login/registo
    if (isLoggedIn && isPublicRoute && nextUrl.pathname !== "/") {
      return NextResponse.redirect(new URL(getPrimaryDashboard(userRoles), nextUrl));
    }

    // 3. Proteção de Acesso Baseado em Perfis (RBAC)
    if (isLoggedIn) {
      const pathname = nextUrl.pathname;

      if (pathname.startsWith("/admin") && !userRoles.includes("admin")) {
        return NextResponse.redirect(new URL(getPrimaryDashboard(userRoles), nextUrl));
      }
      if (pathname.startsWith("/coordenador") && !userRoles.includes("coordenador") && !userRoles.includes("admin")) {
        return NextResponse.redirect(new URL(getPrimaryDashboard(userRoles), nextUrl));
      }
      if (pathname.startsWith("/professor") && !userRoles.includes("professor") && !userRoles.includes("admin")) {
        return NextResponse.redirect(new URL(getPrimaryDashboard(userRoles), nextUrl));
      }
      if (
        pathname.startsWith("/estudante") &&
        !userRoles.includes("estudante") &&
        !userRoles.includes("admin") &&
        !userRoles.includes("coordenador") &&
        !userRoles.includes("professor")
      ) {
        return NextResponse.redirect(new URL(getPrimaryDashboard(userRoles), nextUrl));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Erro no middleware:", error);
    return NextResponse.next();
  }
});

function getPrimaryDashboard(roles: string[]): string {
  if (roles.includes("admin")) return "/admin";
  if (roles.includes("coordenador")) return "/coordenador";
  if (roles.includes("professor")) return "/professor";
  return "/estudante";
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads).*)"],
};
