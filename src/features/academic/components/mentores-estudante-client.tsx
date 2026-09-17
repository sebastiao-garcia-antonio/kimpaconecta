"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  UserRound,
  GraduationCap,
  Building2,
  Inbox,
  Mail,
  Phone,
  CheckCircle2,
  Loader2,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { escolherMentorServer, cancelarMentoriaServer } from "@/features/academic/mentores.actions";

export type DadosMentor = {
  id: number;
  nome: string;
  email: string;
  numEstudanteLogin: string | null;
  telefone: string | null;
  cursos: string[];
  turmas: string[];
  anoCurricular: number | null;
  presencas: number;
  historico: number;
};

export type EscolhaMentorCardProps = {
  mentor: DadosMentor;
  ehMentorAtual: boolean;
};

export function EscolhaMentorCard({ mentor, ehMentorAtual }: EscolhaMentorCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notificacao, setNotificacao] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);

  const escolher = () => {
    setNotificacao(null);
    startTransition(async () => {
      const res = await escolherMentorServer(mentor.id);

      if (res.success) {
        setNotificacao({
          tipo: "sucesso",
          texto: `${mentor.nome} é agora o seu mentor. Boa jornada de aprendizagem!`,
        });
        router.refresh();
      } else {
        setNotificacao({ tipo: "erro", texto: res.error || "Não foi possível escolher o mentor." });
      }
    });
  };

  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm">
          <Award className="h-7 w-7" />
        </div>
        {ehMentorAtual ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
            <CheckCircle2 className="h-3 w-3" /> Mentor atual
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
            <Award className="h-3 w-3" /> Mentor
          </span>
        )}
      </div>

      <h3 className="mt-4 font-bold text-slate-900">{mentor.nome}</h3>
      <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
        <Mail className="h-3 w-3 shrink-0" />
        <span className="truncate">{mentor.email}</span>
      </p>

      <div className="mt-3 space-y-1.5 text-xs text-slate-600">
        {mentor.numEstudanteLogin && (
          <p className="flex items-center gap-1.5">
            <Inbox className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            Nº de estudante: <strong>{mentor.numEstudanteLogin}</strong>
          </p>
        )}
        {mentor.telefone && (
          <p className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            {mentor.telefone}
          </p>
        )}
        {mentor.anoCurricular && (
          <p className="flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            {mentor.anoCurricular}º ano
          </p>
        )}
      </div>

      <div className="mt-3 space-y-2">
        {mentor.cursos.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            {mentor.cursos.slice(0, 2).map((curso) => (
              <span
                key={curso}
                className="rounded-full bg-brand-blue/10 px-2 py-0.5 text-[10px] font-bold text-brand-blue"
              >
                {curso}
              </span>
            ))}
            {mentor.cursos.length > 2 && (
              <span className="text-[10px] font-medium text-slate-400">+{mentor.cursos.length - 2}</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
            <BookOpen className="h-3 w-3 text-slate-400" /> {mentor.historico} histórico
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
            <UserRound className="h-3 w-3 text-slate-400" /> {mentor.presencas} presenças
          </span>
        </div>
      </div>

      {notificacao && (
        <p
          className={`mt-3 rounded-xl p-2.5 text-xs font-semibold ${
            notificacao.tipo === "sucesso" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
          }`}
        >
          {notificacao.texto}
        </p>
      )}

      <div className="mt-auto pt-4">
        {ehMentorAtual ? (
          <CancelarMentoriaButton />
        ) : (
          <button
            onClick={escolher}
            disabled={isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-green px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-green/90 disabled:opacity-60"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Escolher como mentor
          </button>
        )}
      </div>
    </article>
  );
}

export function CancelarMentoriaButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const cancelar = () => {
    setErro(null);
    startTransition(async () => {
      const res = await cancelarMentoriaServer();

      if (res.success) {
        router.refresh();
      } else {
        setErro(res.error || "Não foi possível cancelar a mentoria.");
      }
    });
  };

  return (
    <div className="space-y-2">
      <button
        onClick={cancelar}
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertCircle className="h-4 w-4" />}
        Cancelar mentoria
      </button>
      {erro && <p className="rounded-xl bg-rose-50 p-2.5 text-xs font-semibold text-rose-700">{erro}</p>}
    </div>
  );
}