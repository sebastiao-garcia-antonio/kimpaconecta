import type { NextAuthConfig } from "next-auth";

function normalizarUrlBase(): string {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.startsWith("http")
      ? process.env.NEXTAUTH_URL
      : `https://${process.env.NEXTAUTH_URL}`;
  }
  if (process.env.AUTH_URL) {
    return process.env.AUTH_URL.startsWith("http")
      ? process.env.AUTH_URL
      : `https://${process.env.AUTH_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return process.env.VERCEL_URL.startsWith("http")
      ? process.env.VERCEL_URL
      : `https://${process.env.VERCEL_URL}`;
  }
  return "https://kimpaconecta.vercel.app";
}

const baseUrl = normalizarUrlBase();
if (typeof process !== "undefined" && process.env) {
  if (!process.env.NEXTAUTH_URL) process.env.NEXTAUTH_URL = baseUrl;
  if (!process.env.AUTH_URL) process.env.AUTH_URL = baseUrl;
}

export const authConfig: NextAuthConfig = {
  trustHost: true,
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "kimpa_secret_key_super_segura_2026_vercel_production",
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
