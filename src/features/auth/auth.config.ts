import type { NextAuthConfig } from "next-auth";

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
