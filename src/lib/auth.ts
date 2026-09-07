import NextAuth from "next-auth";
import { authConfig } from "@/features/auth/auth.config";

export const { auth, signIn, signOut, handlers } = NextAuth(authConfig);
