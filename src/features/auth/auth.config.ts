import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { AuthRepository } from "./repositories/auth.repository";
import bcrypt from "bcryptjs";
import { validarVariosTextosSeguros } from "@/lib/validacao-texto";

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email ou Registro", type: "text" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null;

        const validacaoCredenciais = validarVariosTextosSeguros([
          { nome: "identificador", valor: credentials.identifier, obrigatorio: true, maxLength: 120 }
        ]);

        if (!validacaoCredenciais.ok) return null;

        const user = await AuthRepository.findUserByIdentifier(credentials.identifier as string);
        if (!user || user.status !== "ativo") return null;

        const matches = await bcrypt.compare(credentials.password as string, user.senha);
        if (!matches) return null;

        return {
          id: String(user.id),
          name: user.nome,
          email: user.email,
          roles: user.perfis.map(p => p.perfil.nomePerfil)
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.roles = (user as any).roles;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
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


