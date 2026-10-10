"use client";

import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import {
  Loader2,
  Send,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  BookOpen,
  Award,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  iniciarTentativaAvaliacaoServer,
  submeterTentativaAvaliacaoServer,
} from "@/features/assessments/actions/tentativas.actions";

type Alternativa = { id: number; textoAlternativa: string };
type Questao = {
  id: number;
  enunciado: string;
  tipoQuestao: string;
  alternativas: Alternativa[];
};
type Avaliacao = {
  id: number;
  titulo: string;
  dataInicio: string;
  dataFim: string;
  duracaoMinutos: number;
  notaMaxima: string;
  questoes: Questao[];
};
type Tentativa = {
  id: number;
  statusTentativa: string;
  notaObtida?: string | null;
  submetidoEm?: string | null;
  inicioEm?: string | null;
} | null;

// ── Temporizador ─────────────────────────────────────────────────────────
function useTempoRestante(inicioEm: string | null | undefined, duracaoMinutos: number) {
  const calcular = useCallback(() => {
    if (!inicioEm) return duracaoMinutos * 60;
    const inicio = new Date(inicioEm).getTime();
    const fim = inicio + duracaoMinutos * 60 * 1000;
    return Math.max(0, Math.floor((fim - Date.now()) / 1000));
  }, [inicioEm, duracaoMinutos]);

  const [segundos, setSegundos] = useState(calcular);

  useEffect(() => {
    if (!inicioEm) return;
    const intervalo = setInterval(() => setSegundos(calcular()), 1000);
    return () => clearInterval(intervalo);
  }, [inicioEm, calcular]);

  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segs = segundos % 60;
  const formatado = horas > 0
    ? `${horas}h ${String(minutos).padStart(2, "0")}m ${String(segs).padStart(2, "0")}s`
    : `${String(minutos).padStart(2, "0")}m ${String(segs).padStart(2, "0")}s`;
  const urgente = segundos <= 300 && segundos > 0;
  const expirou = segundos === 0 && !!inicioEm;

  return { formatado, urgente, expirou, totalSegundos: segundos };
}

// ── Componente principal ─────────────────────────────────────────────────
export function ResolverAvaliacaoClient({
  avaliacao,
  tentativa: tentativaInicial,
}: {
  avaliacao: Avaliacao;
  tentativa: Tentativa;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tentativa, setTentativa] = useState<Tentativa>(tentativaInicial);
  const [respostas, setRespostas] = useState<Record<number, string>>({});
  const [questaoActual, setQuestaoActual] = useState(0);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const submetidoAutoRef = useRef(false);

  const { formatado, urgente, expirou } = useTempoRestante(
    tentativa?.inicioEm ?? null,
    avaliacao.duracaoMinutos
  );

  const totalRespondidas = avaliacao.questoes.filter((q) => respostas[q.id] !== undefined && respostas[q.id] !== "").length;
  const progresso = avaliacao.questoes.length > 0 ? Math.round((totalRespondidas / avaliacao.questoes.length) * 100) : 0;

  // Auto-submeter quando o tempo expira
  useEffect(() => {
    if (expirou && tentativa?.statusTentativa === "em_curso" && !submetidoAutoRef.current) {
      submetidoAutoRef.current = true;
      submeter(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expirou]);

  const iniciar = () =>
    startTransition(async () => {
      const resultado = await iniciarTentativaAvaliacaoServer(avaliacao.id);
      if (resultado.success) {
        router.refresh();
      } else {
        setMensagem(resultado.error || "Não foi possível iniciar.");
      }
    });

  const submeter = (automatico = false) =>
    startTransition(async () => {
      if (!tentativa) return;
      const resultado = await submeterTentativaAvaliacaoServer(
        tentativa.id,
        avaliacao.questoes.map((q) =>
          q.tipoQuestao === "desenvolvimento"
            ? { idQuestao: q.id, textoResposta: respostas[q.id] || "" }
            : { idQuestao: q.id, idAlternativaEscolhida: respostas[q.id] || "" }
        )
      );
      if (resultado.success) {
        if (automatico) setMensagem("⏱ Tempo esgotado — avaliação submetida automaticamente.");
        router.refresh();
      } else {
        setMensagem(resultado.error || "Não foi possível submeter.");
        setConfirmar(false);
      }
    });

  // ── Estado: Já submetida ─────────────────────────────────────────────
  if (tentativa?.statusTentativa === "submetida" || tentativa?.statusTentativa === "corrigida") {
    const nota = tentativa.notaObtida ? Number(tentativa.notaObtida) : null;
    const notaMax = Number(avaliacao.notaMaxima);
    const pct = nota !== null ? Math.round((nota / notaMax) * 100) : null;
    const corNota = pct === null ? "text-slate-600" : pct >= 75 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-600";

    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-emerald-800">Avaliação submetida</h2>
          <p className="mt-2 text-sm text-emerald-700">
            {tentativa.submetidoEm
              ? `Submetida em ${new Intl.DateTimeFormat("pt-PT", { dateStyle: "long", timeStyle: "short" }).format(new Date(tentativa.submetidoEm))}`
              : "A sua submissão foi registada com sucesso."}
          </p>
          {nota !== null ? (
            <div className="mt-6 inline-flex flex-col items-center">
              <div className={`text-5xl font-black ${corNota}`}>{nota.toFixed(1)}</div>
              <div className="text-sm font-semibold text-slate-500">de {notaMax} valores</div>
              {pct !== null && (
                <div className="mt-3 h-2 w-48 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
              <Eye className="h-4 w-4" />
              A aguardar correção manual pelo docente
            </div>
          )}
          <button
            type="button"
            onClick={() => router.push("/estudante/avaliacoes")}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-white px-5 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar às avaliações
          </button>
        </div>
      </div>
    );
  }

  // ── Estado: Ainda não iniciada ───────────────────────────────────────
  if (!tentativa) {
    const agora = new Date();
    const inicio = new Date(avaliacao.dataInicio);
    const fim = new Date(avaliacao.dataFim);
    const disponivel = agora >= inicio && agora <= fim;

    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-blue/10">
          <BookOpen className="h-8 w-8 text-brand-blue" />
        </div>
        <h2 className="text-2xl font-black text-slate-800">{avaliacao.titulo}</h2>

        <div className="mx-auto mt-6 grid max-w-sm grid-cols-3 gap-3">
          {[
            { label: "Questões", valor: avaliacao.questoes.length },
            { label: "Duração", valor: `${avaliacao.duracaoMinutos} min` },
            { label: "Nota máx.", valor: `${avaliacao.notaMaxima} val.` },
          ].map(({ label, valor }) => (
            <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <div className="text-lg font-black text-slate-800">{valor}</div>
              <div className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-sm text-slate-500">
          Disponível de {" "}
          <span className="font-semibold text-slate-700">
            {new Intl.DateTimeFormat("pt-PT", { dateStyle: "short", timeStyle: "short" }).format(inicio)}
          </span>{" "}
          até{" "}
          <span className="font-semibold text-slate-700">
            {new Intl.DateTimeFormat("pt-PT", { dateStyle: "short", timeStyle: "short" }).format(fim)}
          </span>
        </div>

        {mensagem && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">
            {mensagem}
          </p>
        )}

        <button
          type="button"
          onClick={iniciar}
          disabled={isPending || !disponivel}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-blue px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {!disponivel
            ? agora < inicio
              ? "Ainda não disponível"
              : "Prazo encerrado"
            : "Iniciar avaliação"}
        </button>

        {!disponivel && (
          <p className="mt-3 text-xs text-slate-400">
            {agora < inicio ? "Aguarde até ao início do período de avaliação." : "O prazo de submissão terminou."}
          </p>
        )}
      </div>
    );
  }

  // ── Estado: Em curso ─────────────────────────────────────────────────
  const questao = avaliacao.questoes[questaoActual];
  const respondida = respostas[questao?.id] !== undefined && respostas[questao?.id] !== "";

  return (
    <div className="space-y-4">
      {/* Header com temporizador */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div>
          <h2 className="text-base font-black text-slate-800">{avaliacao.titulo}</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {totalRespondidas} de {avaliacao.questoes.length} questões respondidas
          </p>
        </div>
        <div
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black ${
            urgente
              ? "animate-pulse bg-red-50 text-red-600"
              : "bg-slate-50 text-slate-700"
          }`}
        >
          <Clock className="h-4 w-4" />
          {formatado}
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <span>Progresso</span>
          <span>{progresso}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-green transition-all duration-300"
            style={{ width: `${progresso}%` }}
          />
        </div>
        {/* Indicadores de questões */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {avaliacao.questoes.map((q, i) => (
            <button
              key={q.id}
              type="button"
              onClick={() => setQuestaoActual(i)}
              className={`h-7 w-7 rounded-lg text-xs font-bold transition ${
                i === questaoActual
                  ? "bg-brand-blue text-white"
                  : respostas[q.id]
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Questão actual */}
      {questao && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-xs font-black text-brand-blue">
              {questaoActual + 1}
            </span>
            <p className="text-base font-semibold leading-relaxed text-slate-800">{questao.enunciado}</p>
          </div>

          {questao.tipoQuestao === "desenvolvimento" ? (
            <textarea
              value={respostas[questao.id] || ""}
              onChange={(e) => setRespostas((prev) => ({ ...prev, [questao.id]: e.target.value }))}
              maxLength={3000}
              rows={8}
              placeholder="Escreva a sua resposta aqui..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-blue focus:bg-white focus:ring-2 focus:ring-brand-blue/20"
            />
          ) : (
            <div className="space-y-2">
              {questao.alternativas.map((alt) => {
                const selecionada = respostas[questao.id] === String(alt.id);
                return (
                  <label
                    key={alt.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm transition ${
                      selecionada
                        ? "border-brand-blue bg-brand-blue/5 text-brand-blue"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                        selecionada ? "border-brand-blue bg-brand-blue" : "border-slate-300"
                      }`}
                    >
                      {selecionada && <span className="h-2 w-2 rounded-full bg-white" />}
                    </span>
                    <input
                      type="radio"
                      name={`q-${questao.id}`}
                      value={alt.id}
                      checked={selecionada}
                      onChange={() => setRespostas((prev) => ({ ...prev, [questao.id]: String(alt.id) }))}
                      className="sr-only"
                    />
                    {alt.textoAlternativa}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Navegação */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setQuestaoActual((i) => Math.max(0, i - 1))}
          disabled={questaoActual === 0}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </button>

        {questaoActual < avaliacao.questoes.length - 1 ? (
          <button
            type="button"
            onClick={() => setQuestaoActual((i) => Math.min(avaliacao.questoes.length - 1, i + 1))}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-blue-dark"
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmar(true)}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Submeter avaliação
          </button>
        )}
      </div>

      {mensagem && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {mensagem}
        </div>
      )}

      {/* Modal de confirmação */}
      {confirmar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
              <Award className="h-7 w-7 text-amber-600" />
            </div>
            <h3 className="text-center text-xl font-black text-slate-800">Submeter avaliação?</h3>
            <p className="mt-2 text-center text-sm text-slate-500">
              Respondeu a <span className="font-bold text-slate-700">{totalRespondidas}</span> de{" "}
              <span className="font-bold text-slate-700">{avaliacao.questoes.length}</span> questões.
              {totalRespondidas < avaliacao.questoes.length && (
                <span className="block mt-1 text-amber-600 font-semibold">
                  ⚠ Ainda há {avaliacao.questoes.length - totalRespondidas} questão(ões) por responder.
                </span>
              )}
              <span className="block mt-1">Esta ação não pode ser desfeita.</span>
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmar(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => submeter()}
                disabled={isPending}
                className="flex-1 rounded-xl bg-brand-blue py-2.5 text-sm font-bold text-white transition hover:bg-brand-blue-dark disabled:opacity-60"
              >
                {isPending ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Confirmar submissão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}