import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/features/auth/auth.config";
import { AuthRepository } from "@/features/auth/repositories/auth.repository";
import { validarVariosTextosSeguros } from "@/lib/validacao-texto";

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
