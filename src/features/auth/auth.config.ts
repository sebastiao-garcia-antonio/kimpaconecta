import type { NextAuthConfig } from "next-auth";

const DEFAULT_AUTH_SECRET = "f63c87e834bd31b6727289b4f9d45e73ef9b12bb1de29b93abde65fa1a2b1660";

// Se estiver no ambiente Vercel e NEXTAUTH_URL ou AUTH_URL estiver como localhost,
// corrigir automaticamente para o domínio de produção da Vercel.
if (typeof process !== "undefined" && process.env) {
  const isVercel = Boolean(process.env.VERCEL || process.env.NEXT_PUBLIC_VERCEL_ENV);
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  const authUrl = process.env.AUTH_URL;

  if (isVercel && ((nextAuthUrl && nextAuthUrl.includes("localhost")) || (authUrl && authUrl.includes("localhost")) || !authUrl)) {
    const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || "kimpaconecta.vercel.app";
    const resolvedUrl = vercelHost.startsWith("http") ? vercelHost : `https://${vercelHost}`;
    process.env.NEXTAUTH_URL = resolvedUrl;
    process.env.AUTH_URL = resolvedUrl;
  }
}

export function obterSegredoAutenticacao(): string {
  const s = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (s && !s.includes("http") && s.trim().length >= 16) {
    return s.trim();
  }
  return DEFAULT_AUTH_SECRET;
}

export const authConfig: NextAuthConfig = {
  trustHost: true,
  secret: obterSegredoAutenticacao(),
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.roles = (user as any).roles;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token) {
        session.user.id = token.id as string;
        (session.user as any).roles = token.roles;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    error: "/auth-error",
  }
};
