"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  BarChart2,
  Bell,
  BookOpen,
  Briefcase,
  Building,
  CheckCircle2,
  FileText,
  FolderGit2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  PanelRight,
  ShieldAlert,
  ShieldCheck,
  Users,
  UserRound,
  X,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { FiltroAnoAcademicoClient } from "@/features/academic/components/filtro-ano-academico-client";
import { SocketStatusBadge } from "@/components/common/socket-status-badge";


interface ItemNavegacao {
  label: string;
  href: string;
  icon: ReactNode;
  badge?: number;
  section?: string;
}

interface MenuPorPapel {
  esquerda: ItemNavegacao[];
  direita: ItemNavegacao[];
}

const navegacaoPorPapel: Record<string, MenuPorPapel> = {
  admin: {
    esquerda: [
      { label: "Painel geral", href: "/admin", icon: <LayoutDashboard className="h-4 w-4" />, section: "Principal" },
      { label: "Gestão de utilizadores", href: "/admin/usuarios", icon: <Users className="h-4 w-4" />, section: "Gestão" },

      { label: "Estrutura académica", href: "/admin/academico", icon: <BookOpen className="h-4 w-4" />, section: "Académico" },
      { label: "Competências", href: "/admin/competencias", icon: <Award className="h-4 w-4" /> },
      { label: "Vitrine de projetos", href: "/admin/projetos", icon: <FolderGit2 className="h-4 w-4" /> },
    ],
    direita: [
      { label: "Mensagens", href: "/mensagens", icon: <MessageCircle className="h-4 w-4" />, section: "Comunicação" },
      { label: "Moderação do feed", href: "/admin/feed", icon: <Bell className="h-4 w-4" /> },
      { label: "Anti-fraude", href: "/admin/proctoring", icon: <ShieldAlert className="h-4 w-4" />, section: "Segurança" },
      { label: "Meu perfil", href: "/perfil", icon: <UserRound className="h-4 w-4" />, section: "Conta" },
    ],
  },
  professor: {
    esquerda: [
      { label: "Visão geral", href: "/professor", icon: <BarChart2 className="h-4 w-4" />, section: "Painel geral" },
      { label: "Disciplinas e presenças", href: "/professor/classes", icon: <BookOpen className="h-4 w-4" />, section: "Aulas e diários" },
      { label: "Avaliações e Quiz", href: "/professor/exams", icon: <FileText className="h-4 w-4" /> },
      { label: "Grupos por disciplina", href: "/professor/groups", icon: <Users className="h-4 w-4" /> },
      { label: "Vitrine de projetos", href: "/professor/projects", icon: <Award className="h-4 w-4" />, section: "Projetos" },
    ],
    direita: [
      { label: "Mensagens", href: "/mensagens", icon: <MessageCircle className="h-4 w-4" />, section: "Comunicação" },
      { label: "Sala de monitorização", href: "/professor/proctoring", icon: <ShieldAlert className="h-4 w-4" />, section: "Segurança" },
      { label: "Carreiras e vagas", href: "/professor/opportunities", icon: <Briefcase className="h-4 w-4" />, section: "Oportunidades" },
      { label: "Meu perfil", href: "/perfil", icon: <UserRound className="h-4 w-4" />, section: "Conta" },
    ],
  },
  estudante: {
    esquerda: [
      { label: "Painel", href: "/estudante", icon: <LayoutDashboard className="h-4 w-4" />, section: "Principal" },
      { label: "Disciplinas", href: "/estudante/disciplinas", icon: <BookOpen className="h-4 w-4" />, section: "Académico" },
      { label: "Notas e pautas", href: "/estudante/notas", icon: <FileText className="h-4 w-4" /> },
      { label: "Mentores", href: "/estudante/mentores", icon: <Award className="h-4 w-4" /> },
      { label: "Grupos", href: "/estudante/grupos", icon: <Users className="h-4 w-4" /> },
    ],
    direita: [
      { label: "Mensagens", href: "/mensagens", icon: <MessageCircle className="h-4 w-4" />, section: "Comunicação" },
      { label: "Avaliações", href: "/estudante/avaliacoes", icon: <FileText className="h-4 w-4" />, section: "Académico" },
      { label: "Portfólio", href: "/estudante/portfolio", icon: <Award className="h-4 w-4" />, section: "Pessoal" },
      { label: "Perfil", href: "/perfil", icon: <UserRound className="h-4 w-4" /> },
      { label: "Presenças", href: "/estudante/presencas", icon: <CheckCircle2 className="h-4 w-4" /> },
      { label: "Carreiras", href: "/estudante/carreiras", icon: <Briefcase className="h-4 w-4" /> },
    ],
  },
  coordenador: {
    esquerda: [
      { label: "Painel", href: "/coordenador", icon: <LayoutDashboard className="h-4 w-4" />, section: "Principal" },
      { label: "Cursos", href: "/coordenador/cursos", icon: <Building className="h-4 w-4" />, section: "Gestão académica" },
      { label: "Solicitações de acesso", href: "/coordenador/solicitacoes", icon: <ShieldCheck className="h-4 w-4" /> },
      { label: "Estudantes", href: "/coordenador/estudantes", icon: <GraduationCap className="h-4 w-4" /> },
      { label: "Professores do curso", href: "/coordenador/professores", icon: <Users className="h-4 w-4" /> },
      { label: "Disciplinas", href: "/coordenador/disciplinas", icon: <BookOpen className="h-4 w-4" /> },
      { label: "Turmas", href: "/coordenador/turmas", icon: <Building className="h-4 w-4" /> },
      { label: "Grupos do curso", href: "/coordenador/grupos", icon: <CheckCircle2 className="h-4 w-4" /> },
    ],
    direita: [
      { label: "Relatórios", href: "/coordenador/relatorios", icon: <BarChart2 className="h-4 w-4" />, section: "Indicadores" },
      { label: "Projetos", href: "/coordenador/projetos", icon: <FolderGit2 className="h-4 w-4" /> },
      { label: "Mensagens", href: "/mensagens", icon: <MessageCircle className="h-4 w-4" />, section: "Comunicação" },
      { label: "Meu perfil", href: "/perfil", icon: <UserRound className="h-4 w-4" />, section: "Conta" },
    ],
  },
};

const rotulosPapel: Record<string, string> = {
  admin: "Administração",
  professor: "Docente",
  estudante: "Estudante",
  coordenador: "Coordenador",
};

interface DashboardShellProps {
  role: "admin" | "professor" | "coordenador" | "estudante";
  userId?: string | number;
  userName: string;
  fotoPerfil?: string;
  notificacoesNaoLidas: number;
  contextoAcademico?: {
    anoActual: number | null;
    anosDisponiveis: number[];
  } | null;
  children: ReactNode;
}

export function DashboardShell({ role, userId, userName, fotoPerfil, contextoAcademico, notificacoesNaoLidas, children }: DashboardShellProps) {
  const [menuMovel, setMenuMovel] = useState<"esquerda" | "direita" | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const menu = navegacaoPorPapel[role] || { esquerda: [], direita: [] };
  const itensEsquerda = menu.esquerda;
  const itensDireita = menu.direita;
  const anoFiltro = role === "estudante" ? searchParams.get("ano") : null;

  useEffect(() => {
    if (!menuMovel) return;

    const fecharComEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuMovel(null);
    };

    document.addEventListener("keydown", fecharComEscape);
    return () => document.removeEventListener("keydown", fecharComEscape);
  }, [menuMovel]);

  const construirHref = (href: string) => {
    if (role !== "estudante" || !anoFiltro) return href;
    const separador = href.includes("?") ? "&" : "?";
    return `${href}${separador}ano=${encodeURIComponent(anoFiltro)}`;
  };

  const estaAtivo = (href: string) => {
    if (pathname === href) return true;

    if (role === "admin" && pathname === "/admin") {
      const separadorActual = searchParams.get("tab");
      const rotaParaSeparador: Record<string, string> = {
        "/admin/usuarios": "usuarios",
        "/admin/solicitacoes": "solicitacoes",
        "/admin/proctoring": "proctoring",
        "/admin/academico": "academico",
        "/admin/competencias": "competencias",
        "/admin/projetos": "projetos",
      };

      return rotaParaSeparador[href] === separadorActual;
    }

    return false;
  };

  const renderizarItensNavegacao = (itens: ItemNavegacao[]) => {
    let secaoActual = "";

    return itens.map((item) => {
      const mostrarSecao = item.section && item.section !== secaoActual;
      if (item.section) secaoActual = item.section;
      const ativo = estaAtivo(item.href);
      const badge = item.badge;

      return (
        <div key={item.href}>
          {mostrarSecao && (
            <p className="px-3 pb-1.5 pt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 first:pt-0">
              {item.section}
            </p>
          )}
          <Link
            href={construirHref(item.href)}
            onClick={() => setMenuMovel(null)}
            aria-current={ativo ? "page" : undefined}
            className={`relative flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              ativo
                ? "bg-brand-blue/10 text-brand-blue"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            }`}
          >
            {ativo && <span className="absolute bottom-1/4 left-0 top-1/4 w-1 rounded-r-full bg-brand-blue" />}
            {item.icon}
            <span>{item.label}</span>
            {badge && badge > 0 && (
              <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-100 px-1.5 text-[10px] font-bold text-red-600">
                {badge}
              </span>
            )}
          </Link>
        </div>
      );
    });
  };

  const avatarUsuario = fotoPerfil ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={fotoPerfil}
      alt="Foto de perfil"
      className="h-10 w-10 shrink-0 rounded-xl border-2 border-brand-blue object-cover shadow-md"
    />
  ) : (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-green text-sm font-bold text-white shadow-md">
      {userName.substring(0, 2).toUpperCase()}
    </div>
  );

  const cabecalhoLateral = (
    <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 px-6">
      <Link href="/" className="flex items-center gap-3" onClick={() => setMenuMovel(null)} title="Voltar ao início">
        <Image src="/logo-oficial.jpeg" alt="Logo Universidade Kimpa Vita" width={36} height={36} className="rounded-xl object-cover shadow-sm" priority />
        <div>
          <span className="text-base font-extrabold tracking-tight text-slate-800">Kimpa Connect</span>
          <span className="mt-0.5 block w-fit rounded-full bg-brand-blue/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-blue">
            {rotulosPapel[role]}
          </span>
        </div>
      </Link>
    </div>
  );

  const cabecalhoDireita = (
    <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 px-6">
      {avatarUsuario}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-700">{userName}</p>
        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">{rotulosPapel[role]}</span>
      </div>
    </div>
  );

  const rodapeLateral = (
    <div className="shrink-0 border-t border-slate-200 bg-slate-50/80 p-4">
      <SocketStatusBadge userId={userId} />
    </div>
  );

  const rodapeDireita = (
    <div className="shrink-0 border-t border-slate-200 bg-slate-50/80 p-4">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Terminar sessão"
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400"
          aria-label="Terminar sessão"
        >
          <LogOut className="h-4 w-4" />
          <span>Terminar sessão</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      <a
        href="#conteudo-principal"
        className="sr-only fixed left-4 top-4 z-[60] rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white focus:not-sr-only"
      >
        Saltar para o conteúdo principal
      </a>

      <aside className="z-30 hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white shadow-sm lg:flex">
        {cabecalhoLateral}
        <nav aria-label="Navegação lateral esquerda" className="scrollbar-thin flex-1 space-y-1 overflow-y-auto p-4">
          {renderizarItensNavegacao(itensEsquerda)}
        </nav>
        {rodapeLateral}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-20 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 shadow-sm backdrop-blur-md lg:h-16 lg:px-6">
          <button
            type="button"
            onClick={() => setMenuMovel("esquerda")}
            className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue lg:hidden"
            aria-label="Abrir menu esquerdo"
            aria-controls="navegacao-movel-esquerda"
            aria-expanded={menuMovel === "esquerda"}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="flex items-center gap-2 lg:hidden" title="Voltar ao início">
            <Image src="/logo-oficial.jpeg" alt="Logo Universidade Kimpa Vita" width={28} height={28} className="rounded-lg object-cover" priority />
            <span className="text-sm font-bold text-slate-700">Kimpa Connect</span>
          </Link>

          <div className="hidden lg:block">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Kimpa Connect</p>
            <p className="text-sm font-bold text-slate-700">{rotulosPapel[role]}</p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href={construirHref("/notificacoes")}
              title="Notificações"
              aria-label="Notificações"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
            >
              <Bell className="h-5 w-5" />
              {notificacoesNaoLidas > 0 && (
                <span className="absolute right-1 top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                  {notificacoesNaoLidas > 99 ? "99+" : notificacoesNaoLidas}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setMenuMovel("direita")}
              className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue lg:hidden"
              aria-label="Abrir menu direito"
              aria-controls="navegacao-movel-direita"
              aria-expanded={menuMovel === "direita"}
            >
              <PanelRight className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main id="conteudo-principal" className="scrollbar-thin flex-1 overflow-y-auto bg-slate-50">
          <div className="animate-fadeIn space-y-4 px-4 py-4 lg:px-6 lg:py-6">
            {role === "estudante" && contextoAcademico && (
              <FiltroAnoAcademicoClient
                anosDisponiveis={contextoAcademico.anosDisponiveis}
                anoActual={contextoAcademico.anoActual}
              />
            )}
            {children}
          </div>
        </main>
      </div>

      <aside className="z-30 hidden w-60 shrink-0 flex-col border-l border-slate-200 bg-white shadow-sm lg:flex">
        {cabecalhoDireita}
        <nav aria-label="Navegação lateral direita" className="scrollbar-thin flex-1 space-y-1 overflow-y-auto p-4">
          {renderizarItensNavegacao(itensDireita)}
        </nav>
        {rodapeDireita}
      </aside>

      <AnimatePresence>
        {menuMovel && (
          <>
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/30 lg:hidden"
              onClick={() => setMenuMovel(null)}
            />

            {menuMovel === "esquerda" && (
              <motion.aside
                id="navegacao-movel-esquerda"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed bottom-0 left-0 top-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white shadow-xl lg:hidden"
              >
                <button
                  type="button"
                  onClick={() => setMenuMovel(null)}
                  className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
                  aria-label="Fechar menu"
                >
                  <X className="h-5 w-5" />
                </button>
                {cabecalhoLateral}
                <nav aria-label="Navegação principal" className="scrollbar-thin flex-1 space-y-1 overflow-y-auto p-4">
                  {renderizarItensNavegacao(itensEsquerda)}
                </nav>
                {rodapeLateral}
              </motion.aside>
            )}

            {menuMovel === "direita" && (
              <motion.aside
                id="navegacao-movel-direita"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed bottom-0 right-0 top-0 z-50 flex w-72 flex-col border-l border-slate-200 bg-white shadow-xl lg:hidden"
              >
                <button
                  type="button"
                  onClick={() => setMenuMovel(null)}
                  className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
                  aria-label="Fechar menu"
                >
                  <X className="h-5 w-5" />
                </button>
                {cabecalhoDireita}
                <nav aria-label="Acesso rápido" className="scrollbar-thin flex-1 space-y-1 overflow-y-auto p-4">
                  {renderizarItensNavegacao(itensDireita)}
                </nav>
                {rodapeDireita}
              </motion.aside>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
