"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
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

const navegacaoPorPapel: Record<string, ItemNavegacao[]> = {
  admin: [
    { label: "Meu perfil", href: "/perfil", icon: <UserRound className="h-4 w-4" />, section: "Principal" },
    { label: "Notificações", href: "/notificacoes", icon: <Bell className="h-4 w-4" /> },
    { label: "Mensagens", href: "/mensagens", icon: <MessageCircle className="h-4 w-4" /> },
    { label: "Painel geral", href: "/admin", icon: <LayoutDashboard className="h-4 w-4" />, section: "Principal" },
    { label: "Gestão de utilizadores", href: "/admin/usuarios", icon: <Users className="h-4 w-4" />, section: "Gestão" },
    { label: "Triagem de acessos", href: "/admin/solicitacoes", icon: <ShieldCheck className="h-4 w-4" /> },
    { label: "Moderação do feed", href: "/admin/feed", icon: <Bell className="h-4 w-4" />, section: "Comunidade" },
    { label: "Anti-fraude", href: "/admin/proctoring", icon: <ShieldAlert className="h-4 w-4" />, section: "Segurança" },
    { label: "Estrutura académica", href: "/admin/academico", icon: <BookOpen className="h-4 w-4" />, section: "Académico" },
    { label: "Competências", href: "/admin/competencias", icon: <Award className="h-4 w-4" /> },
    { label: "Vitrine de projetos", href: "/admin/projetos", icon: <FolderGit2 className="h-4 w-4" /> },
  ],
  professor: [
    { label: "Meu perfil", href: "/perfil", icon: <UserRound className="h-4 w-4" />, section: "Principal" },
    { label: "Notificações", href: "/notificacoes", icon: <Bell className="h-4 w-4" /> },
    { label: "Mensagens", href: "/mensagens", icon: <MessageCircle className="h-4 w-4" /> },
    { label: "Visão geral", href: "/professor", icon: <BarChart2 className="h-4 w-4" />, section: "Painel geral" },
    { label: "Disciplinas e presenças", href: "/professor/classes", icon: <BookOpen className="h-4 w-4" />, section: "Aulas e diários" },
    { label: "Avaliações e indicadores", href: "/professor/exams", icon: <FileText className="h-4 w-4" /> },
    { label: "Grupos de trabalho", href: "/professor/groups", icon: <Users className="h-4 w-4" /> },
    { label: "Sala de monitorização", href: "/professor/proctoring", icon: <ShieldAlert className="h-4 w-4" />, section: "Segurança e integração" },
    { label: "Carreiras e vagas", href: "/professor/opportunities", icon: <Briefcase className="h-4 w-4" /> },
    { label: "Vitrine de projetos", href: "/professor/projects", icon: <Award className="h-4 w-4" /> },
  ],
  estudante: [
    { label: "Meu perfil", href: "/perfil", icon: <UserRound className="h-4 w-4" />, section: "Principal" },
    { label: "Painel", href: "/estudante", icon: <LayoutDashboard className="h-4 w-4" />, section: "Principal" },
    { label: "Mensagens", href: "/mensagens", icon: <MessageCircle className="h-4 w-4" /> },
    { label: "Notificações", href: "/notificacoes", icon: <Bell className="h-4 w-4" /> },
    { label: "Disciplinas", href: "/estudante/disciplinas", icon: <BookOpen className="h-4 w-4" />, section: "Académico" },
    { label: "Avaliações", href: "/estudante/avaliacoes", icon: <FileText className="h-4 w-4" /> },
    { label: "Notas e pautas", href: "/estudante/notas", icon: <FileText className="h-4 w-4" /> },
    { label: "Presenças", href: "/estudante/presencas", icon: <CheckCircle2 className="h-4 w-4" /> },
{ label: "Grupos", href: "/estudante/grupos", icon: <Users className="h-4 w-4" /> },
    { label: "Mentores", href: "/estudante/mentores", icon: <Award className="h-4 w-4" /> },
    { label: "Carreiras", href: "/estudante/carreiras", icon: <Briefcase className="h-4 w-4" />, section: "Oportunidades" },
    { label: "Portfólio", href: "/estudante/portfolio", icon: <Award className="h-4 w-4" /> },
  ],
  coordenador: [
    { label: "Meu perfil", href: "/perfil", icon: <UserRound className="h-4 w-4" />, section: "Principal" },
    { label: "Notificações", href: "/notificacoes", icon: <Bell className="h-4 w-4" /> },
    { label: "Mensagens", href: "/mensagens", icon: <MessageCircle className="h-4 w-4" /> },
    { label: "Painel", href: "/coordenador", icon: <LayoutDashboard className="h-4 w-4" />, section: "Principal" },
    { label: "Cursos", href: "/coordenador/cursos", icon: <Building className="h-4 w-4" />, section: "Gestão académica" },
    { label: "Solicitações", href: "/coordenador/solicitacoes", icon: <ShieldCheck className="h-4 w-4" /> },
{ label: "Disciplinas", href: "/coordenador/disciplinas", icon: <BookOpen className="h-4 w-4" /> },
    { label: "Turmas", href: "/coordenador/turmas", icon: <Users className="h-4 w-4" /> },
    { label: "Estudantes", href: "/coordenador/estudantes", icon: <GraduationCap className="h-4 w-4" /> },
    { label: "Relatórios", href: "/coordenador/relatorios", icon: <BarChart2 className="h-4 w-4" />, section: "Indicadores" },
    { label: "Projetos", href: "/coordenador/projetos", icon: <FolderGit2 className="h-4 w-4" /> },
  ],
};

const rotulosPapel: Record<string, string> = {
  admin: "Administração",
  professor: "Docente",
  estudante: "Estudante",
  coordenador: "Coordenador",
};

interface DashboardShellProps {
  role: "admin" | "professor" | "coordenador" | "estudante";
  userName: string;
  fotoPerfil?: string;
  notificacoesNaoLidas: number;
  contextoAcademico?: {
    anoActual: number | null;
    anosDisponiveis: number[];
  } | null;
  children: ReactNode;
}

export function DashboardShell({ role, userName, fotoPerfil, contextoAcademico, notificacoesNaoLidas, children }: DashboardShellProps) {
  const [menuMovelAberto, setMenuMovelAberto] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const itensNavegacao = navegacaoPorPapel[role] || [];
  const anoFiltro = role === "estudante" ? searchParams.get("ano") : null;

  useEffect(() => {
    if (!menuMovelAberto) return;

    const fecharComEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuMovelAberto(false);
    };

    document.addEventListener("keydown", fecharComEscape);
    return () => document.removeEventListener("keydown", fecharComEscape);
  }, [menuMovelAberto]);

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
      const badge = item.href === "/notificacoes" ? notificacoesNaoLidas : item.badge;

      return (
        <div key={item.href}>
          {mostrarSecao && (
            <p className="px-3 pb-1.5 pt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 first:pt-0">
              {item.section}
            </p>
          )}
          <Link
            href={construirHref(item.href)}
            onClick={() => setMenuMovelAberto(false)}
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

  const conteudoLateral = (
    <>
<div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 px-6">
        <Link href="/" className="flex items-center gap-3" onClick={() => setMenuMovelAberto(false)} title="Voltar ao início">
          <div className="rounded-xl bg-gradient-to-tr from-brand-blue to-brand-green p-1.5 text-white shadow-md shadow-brand-blue/20">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-slate-800">Kimpa Connect</span>
            <span className="mt-0.5 block w-fit rounded-full bg-brand-blue/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-blue">
              {rotulosPapel[role]}
            </span>
          </div>
        </Link>
      </div>

      <nav aria-label="Navegação principal" className="scrollbar-thin flex-1 space-y-1 overflow-y-auto p-4">
        {renderizarItensNavegacao(itensNavegacao)}
      </nav>

      <div className="shrink-0 border-t border-slate-200 bg-slate-50/80 p-4">
<div className="flex items-center gap-3">
          {fotoPerfil ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fotoPerfil}
              alt="Foto de perfil"
              className="h-10 w-10 shrink-0 rounded-xl border-2 border-brand-blue object-cover shadow-md"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-green text-sm font-bold text-white shadow-md">
              {userName.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-700">{userName}</p>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">{rotulosPapel[role]}</span>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Terminar sessão"
            className="ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400"
            aria-label="Terminar sessão"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 border-t border-slate-200/60 pt-2 flex items-center justify-between">
          <SocketStatusBadge />
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      <a
        href="#conteudo-principal"
        className="sr-only fixed left-4 top-4 z-[60] rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white focus:not-sr-only"
      >
        Saltar para o conteúdo principal
      </a>
      <aside className="z-30 hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white shadow-sm lg:flex">
        {conteudoLateral}
      </aside>

<header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 shadow-sm backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => setMenuMovelAberto(true)}
          className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          aria-label="Abrir menu"
          aria-controls="navegacao-movel"
          aria-expanded={menuMovelAberto}
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/" className="flex items-center gap-2" title="Voltar ao início">
          <div className="rounded-lg bg-gradient-to-tr from-brand-blue to-brand-green p-1 text-white">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold text-slate-700">Kimpa Connect</span>
        </Link>
      </header>

      <AnimatePresence>
        {menuMovelAberto && (
          <>
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/30 lg:hidden"
              onClick={() => setMenuMovelAberto(false)}
            />
            <motion.aside
              id="navegacao-movel"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 top-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white shadow-xl lg:hidden"
            >
              <button
                type="button"
                onClick={() => setMenuMovelAberto(false)}
                className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
              {conteudoLateral}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main id="conteudo-principal" className="scrollbar-thin flex-1 overflow-y-auto bg-slate-50 pt-14 lg:pt-0">
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
  );
}
