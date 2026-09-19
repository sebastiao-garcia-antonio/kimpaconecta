import type { NextAuthConfig } from "next-auth";

function sanitizarUrlBase(url: string | undefined): string | null {
  if (!url) return null;
  if (url.includes("kimpa_secret_key")) return null;
  if (!url.includes(".")) return null;
  return url.startsWith("http") ? url : `https://${url}`;
}

function obterUrlBase(): string {
  const envNextAuth = sanitizarUrlBase(process.env.NEXTAUTH_URL);
  if (envNextAuth) return envNextAuth;

  const envAuth = sanitizarUrlBase(process.env.AUTH_URL);
  if (envAuth) return envAuth;

  const envVercel = sanitizarUrlBase(process.env.VERCEL_URL);
  if (envVercel) return envVercel;

  return "https://kimpaconecta.vercel.app";
}

const urlCorreta = obterUrlBase();
if (typeof process !== "undefined" && process.env) {
  process.env.NEXTAUTH_URL = urlCorreta;
  process.env.AUTH_URL = urlCorreta;
}

export const authConfig: NextAuthConfig = {
  trustHost: true,
  secret:
    process.env.AUTH_SECRET && !process.env.AUTH_SECRET.includes("http")
      ? process.env.AUTH_SECRET
      : "f63c87e834bd31b6727289b4f9d45e73ef9b12bb1de29b93abde65fa1a2b1660",
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
