import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/features/auth/auth.config";
import { AuthRepository } from "@/features/auth/repositories/auth.repository";
import { validarVariosTextosSeguros } from "@/lib/validacao-texto";

if (typeof process !== "undefined" && process.env) {
  const url =
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://kimpaconecta.vercel.app");
  const finalUrl = url.startsWith("http") ? url : `https://${url}`;
  process.env.NEXTAUTH_URL = finalUrl;
  process.env.AUTH_URL = finalUrl;
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email ou Registro", type: "text" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        try {
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
        } catch (error) {
          console.error("Erro durante o authorize NextAuth:", error);
          return null;
        }
      }
    })
  ]
});
