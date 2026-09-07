const fs = require('fs');
const path = require('path');

// Helper to create directories recursively
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created folder: ${dirPath}`);
  }
}

// Helper to write file content
function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  ensureDirectoryExists(dir);
  fs.writeFileSync(filePath, content.trim() + '\n', 'utf8');
  console.log(`Created file: ${filePath}`);
}

const basePath = path.join(__dirname, 'src');

console.log('--- INITIALIZING KIMPA CONNECT SCAFFOLDING GENERATOR ---');

// ==========================================
// 1. STYLES & CORE UTILITIES
// ==========================================

writeFile(path.join(basePath, 'styles', 'globals.css'), `
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 224 71.4% 4.1%;
    --card: 0 0% 100%;
    --card-foreground: 224 71.4% 4.1%;
    --popover: 0 0% 100%;
    --popover-foreground: 224 71.4% 4.1%;
    --primary: 262.1 83.3% 57.8%;
    --primary-foreground: 210 20% 98%;
    --secondary: 220 14.3% 95.9%;
    --secondary-foreground: 220.9 39.3% 11%;
    --muted: 220 14.3% 95.9%;
    --muted-foreground: 220 8.9% 46.1%;
    --accent: 220 14.3% 95.9%;
    --accent-foreground: 220.9 39.3% 11%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 20% 98%;
    --border: 220 13% 91%;
    --input: 220 13% 91%;
    --ring: 262.1 83.3% 57.8%;
    --radius: 0.75rem;
  }

  .dark {
    --background: 224 71.4% 4.1%;
    --foreground: 210 20% 98%;
    --card: 224 71.4% 4.1%;
    --card-foreground: 210 20% 98%;
    --popover: 224 71.4% 4.1%;
    --popover-foreground: 210 20% 98%;
    --primary: 263.4 70% 50.4%;
    --primary-foreground: 210 20% 98%;
    --secondary: 215 27.9% 16.9%;
    --secondary-foreground: 210 20% 98%;
    --muted: 215 27.9% 16.9%;
    --muted-foreground: 217.9 10.6% 64.9%;
    --accent: 215 27.9% 16.9%;
    --accent-foreground: 210 20% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 20% 98%;
    --border: 215 27.9% 16.9%;
    --input: 215 27.9% 16.9%;
    --ring: 263.4 70% 50.4%;
  }
}

@layer base {
  * {
    border-color: hsl(var(--border));
  }
  body {
    background-color: hsl(var(--background));
    color: hsl(var(--foreground));
    font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  }
}
`);

// Prisma Singleton Helper
writeFile(path.join(basePath, 'lib', 'prisma.ts'), `
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
`);

// Socket IO Client Helper
writeFile(path.join(basePath, 'lib', 'socket.ts'), `
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000", {
      autoConnect: false,
    });
  }
  return socket;
};
`);

// Tailwind Merging Utility
writeFile(path.join(basePath, 'lib', 'utils.ts'), `
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`);

// ==========================================
// 2. GLOBAL PROVIDERS
// ==========================================

writeFile(path.join(basePath, 'providers', 'query-provider.tsx'), `
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
`);

writeFile(path.join(basePath, 'providers', 'theme-provider.tsx'), `
"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
`);

// ==========================================
// 3. CORE AUTHENTICATION MODULE (NextAuth v5 / Auth.js)
// ==========================================

writeFile(path.join(basePath, 'features', 'auth', 'schemas.ts'), `
import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(1, "E-mail ou número de estudante é obrigatório"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

export const registroSchema = z.object({
  nomeCompleto: z.string().min(3, "Nome muito curto"),
  email: z.string().email("E-mail inválido"),
  numEstudante: z.string().min(4, "Número de processo ou estudante inválido"),
  senhaProvisoria: z.string().min(6, "Mínimo de 6 caracteres"),
  idCurso: z.number({ required_error: "Selecione o curso" }),
});
`);

writeFile(path.join(basePath, 'features', 'auth', 'repositories', 'auth.repository.ts'), `
import { prisma } from "@/lib/prisma";

export class AuthRepository {
  static async findUserByIdentifier(identifier: string) {
    return prisma.usuario.findFirst({
      where: {
        OR: [
          { email: identifier },
          { numEstudanteLogin: identifier }
        ]
      },
      include: {
        perfis: {
          include: {
            perfil: true
          }
        }
      }
    });
  }

  static async findUserById(id: number) {
    return prisma.usuario.findUnique({
      where: { id },
      include: {
        perfis: {
          include: {
            perfil: true
          }
        }
      }
    });
  }

  static async registrarSolicitacaoAcesso(data: {
    nomeCompleto: string;
    email: string;
    numEstudante: string;
    senhaProvisoria: string;
    idCurso: number;
  }) {
    return prisma.solicitacaoAcesso.create({
      data: {
        nomeCompleto: data.nomeCompleto,
        email: data.email,
        numEstudante: data.numEstudante,
        senhaProvisoria: data.senhaProvisoria,
        idCurso: data.idCurso,
        status: "pendente"
      }
    });
  }
}
`);

writeFile(path.join(basePath, 'features', 'auth', 'actions.ts'), `
"use server";

import { AuthRepository } from "./repositories/auth.repository";
import { registroSchema } from "./schemas";
import bcrypt from "bcryptjs";

export async function criarSolicitacaoAcesso(formData: any) {
  const result = registroSchema.safeParse(formData);
  if (!result.success) {
    return { error: "Dados inválidos." };
  }

  const { nomeCompleto, email, numEstudante, senhaProvisoria, idCurso } = result.data;
  
  try {
    const hashed = await bcrypt.hash(senhaProvisoria, 10);
    await AuthRepository.registrarSolicitacaoAcesso({
      nomeCompleto,
      email,
      numEstudante,
      senhaProvisoria: hashed,
      idCurso
    });
    return { success: true, message: "Solicitação enviada com sucesso! Aguarde a validação do coordenador." };
  } catch (error) {
    return { error: "Erro ao registrar solicitação ou e-mail já existente." };
  }
}
`);

// NextAuth Configuration
writeFile(path.join(basePath, 'features', 'auth', 'auth.config.ts'), `
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { AuthRepository } from "./repositories/auth.repository";
import bcrypt from "bcryptjs";

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

        const user = await AuthRepository.findUserByIdentifier(credentials.identifier as string);
        if (!user || user.status !== "ativo") return null;

        const matches = await bcrypt.compare(credentials.password as string, user.senha);
        if (!matches) return null;

        // Return user profile mapping
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
`);

// ==========================================
// 4. CHAT AND MESSAGING MODULE (Socket.IO + Direct + Group Chat)
// ==========================================

writeFile(path.join(basePath, 'features', 'messaging', 'repositories', 'messaging.repository.ts'), `
import { prisma } from "@/lib/prisma";

export class MessagingRepository {
  static async listMessagesByGroup(idGrupo: number, skip = 0, take = 50) {
    return prisma.mensagem.findMany({
      where: { idGrupo },
      orderBy: { dataEnvio: "desc" },
      skip,
      take,
      include: {
        emissor: {
          select: { id: true, nome: true, fotoPerfil: true }
        }
      }
    });
  }

  static async createMessage(data: {
    idGrupo: number;
    idEmissor: number;
    conteudo?: string;
    tipoConteudo?: string;
    urlFicheiro?: string;
    duracaoAudio?: number;
  }) {
    return prisma.mensagem.create({
      data: {
        idGrupo: data.idGrupo,
        idEmissor: data.idEmissor,
        conteudo: data.conteudo,
        tipoConteudo: data.tipoConteudo ?? "texto",
        urlFicheiro: data.urlFicheiro,
        duracaoAudio: data.duracaoAudio
      },
      include: {
        emissor: {
          select: { id: true, nome: true, fotoPerfil: true }
        }
      }
    });
  }

  static async fixMessage(idMensagem: number, idUsuario: number) {
    return prisma.$transaction([
      prisma.mensagem.update({
        where: { id: idMensagem },
        data: { isFixada: true }
      }),
      prisma.mensagemFixadaLog.create({
        data: {
          idMensagem,
          idUsuarioQuemFixou: idUsuario
        }
      })
    ]);
  }
}
`);

writeFile(path.join(basePath, 'features', 'messaging', 'actions.ts'), `
"use server";

import { MessagingRepository } from "./repositories/messaging.repository";

export async function enviarMensagem(payload: {
  idGrupo: number;
  idEmissor: number;
  conteudo: string;
  tipoConteudo?: string;
  urlFicheiro?: string;
}) {
  try {
    const mensagem = await MessagingRepository.createMessage(payload);
    // Em ambientes Server Action, geralmente usamos Socket.IO Server para emitir o evento
    return { success: true, mensagem };
  } catch (error) {
    return { error: "Erro ao enviar mensagem" };
  }
}
`);

// ==========================================
// 5. ASSESSMENTS & SECURITY/PROCTORING MODULE
// ==========================================

writeFile(path.join(basePath, 'features', 'assessments', 'repositories', 'assessments.repository.ts'), `
import { prisma } from "@/lib/prisma";

export class AssessmentsRepository {
  static async getAvaliacaoWithQuestions(idAvaliacao: number) {
    return prisma.avaliacao.findUnique({
      where: { id: idAvaliacao },
      include: {
        questoes: {
          include: {
            alternativas: {
              select: { id: true, textoAlternativa: true } // Hide correct indicator in frontend
            }
          }
        }
      }
    });
  }

  static async iniciarTentativa(idAvaliacao: number, idEstudante: number) {
    return prisma.tentativaAvaliacao.create({
      data: {
        idAvaliacao,
        idEstudante,
        statusTentativa: "em_curso"
      }
    });
  }

  static async registrarLogSeguranca(idTentativa: number, tipoEvento: string, descricao: string) {
    return prisma.$transaction([
      prisma.logsSeguranca.create({
        data: {
          idTentativa,
          tipoEvento,
          descricao
        }
      }),
      prisma.monitoramentoProva.upsert({
        where: { idMonitoramento: BigInt(idTentativa) },
        update: {
          perdaFoco: tipoEvento === "perda_de_foco" ? { increment: 1 } : undefined,
          tentativasCopia: tipoEvento === "tentativa_copiar" ? { increment: 1 } : undefined,
        },
        create: {
          idTentativa,
          perdaFoco: tipoEvento === "perda_de_foco" ? 1 : 0,
          tentativasCopia: tipoEvento === "tentativa_copiar" ? 1 : 0,
        }
      })
    ]);
  }
}
`);

// Custom Security hook for assessments tabs proctoring
writeFile(path.join(basePath, 'features', 'assessments', 'hooks', 'use-proctoring.ts'), `
"use client";

import { useEffect, useState } from "react";

export function useProctoring(idTentativa: number, onFocusLost: () => void) {
  const [focusLossCount, setFocusLossCount] = useState(0);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setFocusLossCount(prev => prev + 1);
        onFocusLost();
        
        // Log anti-fraude via fetch em background
        fetch("/api/proctoring/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idTentativa,
            tipoEvento: "perda_de_foco",
            descricao: "O estudante alterou a aba ativa do navegador."
          })
        });
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      fetch("/api/proctoring/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idTentativa,
          tipoEvento: "tentativa_copiar",
          descricao: "Estudante tentou copiar conteúdo da avaliação."
        })
      });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("copy", handleCopy);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("copy", handleCopy);
    };
  }, [idTentativa, onFocusLost]);

  return { focusLossCount };
}
`);

// ==========================================
// 6. LOCAL UPLOAD FILE MANAGER MODULE (Strict Local Volume Mode)
// ==========================================

writeFile(path.join(basePath, 'features', 'files', 'services', 'upload.service.ts'), `
import fs from "fs/promises";
import path from "path";

export class UploadService {
  private static uploadDir = path.join(process.cwd(), "public", "uploads");

  static async uploadFile(file: File): Promise<string> {
    // Ensure directory exists
    await fs.mkdir(this.uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const uniqueName = Date.now() + "-" + file.name.replace(/\\s+/g, "_");
    const finalPath = path.join(this.uploadDir, uniqueName);

    await fs.writeFile(finalPath, buffer);
    return "/uploads/" + uniqueName;
  }
}
`);

// ==========================================
// 7. APP PAGES & ROUTING (Next.js 15 layout, Page, Middleware)
// ==========================================

// Global Layout
writeFile(path.join(basePath, 'app', 'layout.tsx'), `
import "@/styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/providers/theme-provider";
import { QueryProvider } from "@/providers/query-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kimpa Connect | Plataforma Académica Colaborativa",
  description: "O portal de integração académica oficial da Universidade Kimpa Vita. Uma ponte de inovação, networking e conhecimento.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
`);

// Modern Premium Landing Page resembling Slack, Discord, Linear style
writeFile(path.join(basePath, 'app', 'page.tsx'), `
import Link from "next/link";
import { GraduationCap, MessageSquare, ShieldAlert, Award, ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
              Kimpa Connect
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground">Funcionalidades</Link>
            <Link href="#impact" className="text-sm font-medium text-muted-foreground hover:text-foreground">Impacto</Link>
            <Link href="/login" className="text-sm font-medium text-foreground border border-border px-4 py-2 rounded-full hover:bg-muted transition-colors">Entrar</Link>
            <Link href="/registro" className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-full hover:opacity-90 transition-opacity">Cadastrar-se</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="container flex flex-col items-center text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-sm text-primary mb-6 animate-pulse">
              <span>Universidade Kimpa Vita em Conexão</span>
              <ChevronRight className="h-3 w-3" />
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight">
              O Portal Colaborativo{" "}
              <span className="bg-gradient-to-r from-primary via-violet-500 to-indigo-600 bg-clip-text text-transparent">
                Líder da Inovação
              </span>{" "}
              Académica
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl">
              Um ecossistema digital inteligente unindo Estudantes, Docentes e Coordenadores. Aulas, chat em tempo real, mentorias de alto nível e avaliações seguras num só lugar.
            </p>
            <div className="mt-10 flex gap-4">
              <Link href="/registro" className="bg-primary text-primary-foreground text-lg px-8 py-3 rounded-full hover:opacity-95 transition shadow-lg shadow-primary/20">
                Criar Conta de Estudante
              </Link>
              <Link href="/login" className="border border-border text-lg px-8 py-3 rounded-full hover:bg-muted transition">
                Acessar Portal
              </Link>
            </div>
          </div>
        </section>

        {/* Features Modules */}
        <section id="features" className="py-20 border-t border-border/40 bg-muted/20">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight">Recursos Enterprise Disponíveis</h2>
              <p className="text-muted-foreground mt-2">Tecnologia avançada projetada para gerenciar as rotinas académicas com máxima integridade.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl border border-border/60 bg-card hover:shadow-md transition">
                <MessageSquare className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Comunicação em Tempo Real</h3>
                <p className="text-muted-foreground text-sm">
                  Salas de chat integradas por disciplina, turmas e projetos. Chamadas de áudio, videoconferência direta e compartilhamento instantâneo de ficheiros.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl border border-border/60 bg-card hover:shadow-md transition">
                <ShieldAlert className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Proctoring Avançado (Anti-Fraude)</h3>
                <p className="text-muted-foreground text-sm">
                  Ambiente de exames seguro com bloqueio inteligente de área de transferência, logs imediatos de foco da página e auditoria em tempo real de tentativas.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl border border-border/60 bg-card hover:shadow-md transition">
                <Award className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Reputação & Portfólio</h3>
                <p className="text-muted-foreground text-sm">
                  Vitrine pública de projetos universitários. Networking acadêmico estruturado para dar visibilidade a competências e encontrar estágios e mentorias.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 bg-background">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-center">
          <p className="text-sm text-muted-foreground">&copy; 2026 Universidade Kimpa Vita. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Suporte Técnico</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Termos de Uso</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
`);

// Next.js Middleware file for robust RBAC protection & authentication redirects
writeFile(path.join(__dirname, 'src', 'middleware.ts'), `
import { NextResponse } from "next/server";
import { authConfig } from "./features/auth/auth.config";
import NextAuth from "next-auth";

const { auth } = NextAuth(authConfig);

export default auth((req: any) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isPublicRoute = ["/", "/login", "/registro", "/auth-error"].includes(nextUrl.pathname);

  if (isApiAuthRoute) return NextResponse.next();

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isLoggedIn && isPublicRoute && nextUrl.pathname !== "/") {
    const roles = req.auth.user.roles || [];
    if (roles.includes("admin")) {
      return NextResponse.redirect(new URL("/admin", nextUrl));
    } else if (roles.includes("coordenador")) {
      return NextResponse.redirect(new URL("/coordenador", nextUrl));
    } else if (roles.includes("professor")) {
      return NextResponse.redirect(new URL("/professor", nextUrl));
    } else {
      return NextResponse.redirect(new URL("/estudante", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads).*)"],
};
`);

// ==========================================
// 8. ROUTE HANDLERS & API SCRIPTS (Zustand State, API Routes)
// ==========================================

// Global Toast state and notification triggers using Zustand
writeFile(path.join(basePath, 'hooks', 'use-toast.ts'), `
import { create } from "zustand";

type ToastType = "success" | "error" | "info";

interface ToastState {
  toasts: { id: string; message: string; type: ToastType }[];
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type = "info") => {
    const id = Math.random().toString(36).substring(7);
    set(state => ({
      toasts: [...state.toasts, { id, message, type }]
    }));
    setTimeout(() => {
      set(state => ({
        toasts: state.toasts.filter(t => t.id !== id)
      }));
    }, 4000);
  },
  removeToast: (id) => set(state => ({
    toasts: state.toasts.filter(t => t.id !== id)
  }))
}));
`);

// Dummy files for all remaining dashboard views and API route handlers so the compilation succeeds
writeFile(path.join(basePath, 'app', '(auth)', 'login', 'page.tsx'), `
import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <div className="w-full max-w-md p-8 bg-card border border-border rounded-2xl shadow-sm">
        <div className="flex flex-col items-center mb-6">
          <GraduationCap className="h-10 w-10 text-primary mb-2" />
          <h2 className="text-2xl font-bold tracking-tight">Acesse o Kimpa Connect</h2>
          <p className="text-muted-foreground text-sm text-center mt-1">Insira seu e-mail institucional ou número de estudante para logar.</p>
        </div>
        <form className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email ou Número</label>
            <input type="text" className="w-full p-3 border border-border rounded-lg mt-1 bg-background" placeholder="ex: 123456 ou user@ukv.ao" />
          </div>
          <div>
            <label className="text-sm font-medium">Senha</label>
            <input type="password" className="w-full p-3 border border-border rounded-lg mt-1 bg-background" placeholder="••••••••" />
          </div>
          <button type="submit" className="w-full bg-primary text-primary-foreground p-3 rounded-lg hover:opacity-95 transition font-medium mt-2">
            Entrar no Sistema
          </button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-4">Não possui uma conta? <Link href="/registro" className="text-primary hover:underline font-medium">Cadastre-se</Link></p>
      </div>
    </div>
  );
}
`);

writeFile(path.join(basePath, 'app', '(auth)', 'registro', 'page.tsx'), `
import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function RegistroPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <div className="w-full max-w-lg p-8 bg-card border border-border rounded-2xl shadow-sm">
        <div className="flex flex-col items-center mb-6">
          <GraduationCap className="h-10 w-10 text-primary mb-2" />
          <h2 className="text-2xl font-bold tracking-tight">Solicitar Acesso ao Portal</h2>
          <p className="text-muted-foreground text-sm text-center mt-1">Envie seus dados para validação do coordenador de curso.</p>
        </div>
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Nome Completo</label>
              <input type="text" className="w-full p-3 border border-border rounded-lg mt-1 bg-background" />
            </div>
            <div>
              <label className="text-sm font-medium">E-mail</label>
              <input type="email" className="w-full p-3 border border-border rounded-lg mt-1 bg-background" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Número do Estudante / Processo</label>
            <input type="text" className="w-full p-3 border border-border rounded-lg mt-1 bg-background" placeholder="Ex: 242091" />
          </div>
          <div>
            <label className="text-sm font-medium">Senha de Login Provisória</label>
            <input type="password" className="w-full p-3 border border-border rounded-lg mt-1 bg-background" />
          </div>
          <button type="submit" className="w-full bg-primary text-primary-foreground p-3 rounded-lg hover:opacity-95 transition font-medium mt-2">
            Enviar Solicitação
          </button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-4">Já possui conta? <Link href="/login" className="text-primary hover:underline font-medium">Acesse aqui</Link></p>
      </div>
    </div>
  );
}
`);

// Create dummy pages for the four main control dashboards
const dashboards = ["admin", "coordenador", "professor", "estudante"];
dashboards.forEach(dashboard => {
  writeFile(path.join(basePath, 'app', '(dashboard)', dashboard, 'page.tsx'), `
import { GraduationCap } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <GraduationCap className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-extrabold tracking-tight capitalize">
          Painel do ` + dashboard + ` | Kimpa Connect
        </h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 bg-card border border-border rounded-xl">
          <h3 className="font-semibold text-lg">Métricas Ativas</h3>
          <p className="text-3xl font-bold mt-2 text-primary">--</p>
          <p className="text-xs text-muted-foreground mt-1">Carregando dados institucionais</p>
        </div>
        <div className="p-6 bg-card border border-border rounded-xl">
          <h3 className="font-semibold text-lg">Alertas de Proctoring</h3>
          <p className="text-3xl font-bold mt-2 text-destructive">0</p>
          <p className="text-xs text-muted-foreground mt-1">Sem anormalidades no momento</p>
        </div>
        <div className="p-6 bg-card border border-border rounded-xl">
          <h3 className="font-semibold text-lg">Aulas Agendadas</h3>
          <p className="text-3xl font-bold mt-2 text-emerald-500">0</p>
          <p className="text-xs text-muted-foreground mt-1">Nenhuma reunião agora</p>
        </div>
        <div className="p-6 bg-card border border-border rounded-xl">
          <h3 className="font-semibold text-lg">Pontos de Reputação</h3>
          <p className="text-3xl font-bold mt-2 text-amber-500">120 pts</p>
          <p className="text-xs text-muted-foreground mt-1">Nível Iniciante</p>
        </div>
      </div>
    </div>
  );
});
});

// Create generic place-holders for API route handlers (Proctoring log register)
writeFile(path.join(basePath, 'app', 'api', 'proctoring', 'log', 'route.ts'), `
import { NextResponse } from "next/server";
import { AssessmentsRepository } from "@/features/assessments/repositories/assessments.repository";

export async function POST(request: Request) {
  try {
    const { idTentativa, tipoEvento, descricao } = await request.json();
    
    if (!idTentativa || !tipoEvento || !descricao) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const log = await AssessmentsRepository.registrarLogSeguranca(
      Number(idTentativa),
      tipoEvento,
      descricao
    );

    return NextResponse.json({ success: true, log });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`);

// Creating files for each remaining module to complete the structural requirement
const features = [
  "academic", "users", "notifications", "networking", "analytics", "files"
];

features.forEach(feat => {
  ensureDirectoryExists(path.join(basePath, 'features', feat, 'components'));
  ensureDirectoryExists(path.join(basePath, 'features', feat, 'hooks'));
  ensureDirectoryExists(path.join(basePath, 'features', feat, 'services'));
  
  writeFile(path.join(basePath, 'features', feat, 'repositories', feat + ".repository.ts"), `
import { prisma } from "@/lib/prisma";

export class ` + feat.charAt(0).toUpperCase() + feat.slice(1) + `Repository {
  // Enterprise methods for repository isolation
  static async getEntity(id: number) {
    return { id, status: "ok" };
  }
}
  `);
  
  writeFile(path.join(basePath, 'features', feat, 'actions.ts'), `
"use server";

import { ` + feat.charAt(0).toUpperCase() + feat.slice(1) + `Repository } from "./repositories/` + feat + `.repository";

export async function processAction(id: number) {
  try {
    const data = await ` + feat.charAt(0).toUpperCase() + feat.slice(1) + `Repository.getEntity(id);
    return { success: true, data };
  } catch (error) {
    return { error: "Action error" };
  }
}
  `);
});

console.log('--- ENTERPRISE CORE SCAFFOLD GENERATED SUCCESSFULLY ---');
