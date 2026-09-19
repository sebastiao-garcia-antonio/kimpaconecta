"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, Clock, Eye, Lock, RefreshCw, ShieldAlert, Unlock, Users, Video } from "lucide-react";
import { atualizarStatusTentativaServer, getDashboardData } from "@/features/academic/actions";
import { useToast } from "@/hooks/use-toast";

interface ProctoringRoomClientProps {
  initialData: any;
  professorId: number;
  professorNome: string;
}

function formatarDataHora(valor: string | Date) {
  return new Date(valor).toLocaleString("pt-PT", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function obterEtiquetaRisco(nivel?: string) {
  switch (nivel) {
    case "alto":
      return { texto: "Risco alto", classe: "bg-red-500/10 text-red-500 border-red-200" };
    case "medio":
      return { texto: "Risco médio", classe: "bg-amber-500/10 text-amber-500 border-amber-200" };
    case "baixo":
      return { texto: "Risco baixo", classe: "bg-emerald-500/10 text-emerald-500 border-emerald-200" };
    default:
      return { texto: "Sem risco", classe: "bg-slate-100 text-slate-600 border-slate-200" };
  }
}

function obterCorPercentagem(nivel?: string) {
  switch (nivel) {
    case "alto":
      return "bg-red-500";
    case "medio":
      return "bg-amber-500";
    case "baixo":
      return "bg-emerald-500";
    default:
      return "bg-slate-300";
  }
}

export default function ProctoringRoomClient({ initialData, professorId, professorNome }: ProctoringRoomClientProps) {
  const [data, setData] = useState(initialData);
  const [selectedExamId, setSelectedExamId] = useState<number | "todos">("todos");
  const [riskFilter, setRiskFilter] = useState<"todos" | "alto" | "medio" | "baixo">("todos");
  const [somAtivado, setSomAtivado] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();
  const alertasAnterioresRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const primeiraCargaRef = useRef(true);

  const reloadData = useCallback(async () => {
    const resultado = await getDashboardData(professorId);
    if (resultado.success && resultado.data) {
      setData(resultado.data);
    }
  }, [professorId]);
  const tocarAlertaSonoro = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      const contexto = audioContextRef.current ?? new window.AudioContext();
      audioContextRef.current = contexto;

      const oscilador = contexto.createOscillator();
      const ganho = contexto.createGain();

      oscilador.type = "sine";
      oscilador.frequency.value = 880;
      ganho.gain.value = 0.0001;

      oscilador.connect(ganho);
      ganho.connect(contexto.destination);
      oscilador.start();

      ganho.gain.exponentialRampToValueAtTime(0.12, contexto.currentTime + 0.02);
      ganho.gain.exponentialRampToValueAtTime(0.0001, contexto.currentTime + 0.4);
      oscilador.stop(contexto.currentTime + 0.42);
    } catch {
      // Som opcional; o feedback visual continua ativo.
    }
  }, []);

  useEffect(() => {
    const intervalo = setInterval(() => {
      void reloadData();
    }, 20000);

    return () => clearInterval(intervalo);
  }, [reloadData]);


  const avaliacoes = useMemo(() => data.evaluations || [], [data.evaluations]);

  useEffect(() => {
    if (selectedExamId !== "todos") return;
    if (avaliacoes.length > 0) return;
    setSelectedExamId("todos");
  }, [avaliacoes.length, selectedExamId]);

  const tentativasGlobais = useMemo(() => {
    return (avaliacoes || []).flatMap((avaliacao: any) =>
      (avaliacao.tentativas || []).map((tentativa: any) => ({
        ...tentativa,
        tituloAvaliacao: avaliacao.titulo,
        disciplinaNome: avaliacao.disciplina?.nomeDisciplina || "Disciplina"
      }))
    );
  }, [avaliacoes]);

  const tentativasVisiveis = useMemo(() => {
    const alvo = selectedExamId === "todos"
      ? tentativasGlobais
      : tentativasGlobais.filter((tentativa: any) => tentativa.idAvaliacao === selectedExamId || tentativa.avaliacao?.id === selectedExamId);

    return alvo.filter((tentativa: any) => {
      if (riskFilter === "todos") return true;
      return (tentativa.monitoramento?.nivelSuspeita || "baixo") === riskFilter;
    });
  }, [riskFilter, selectedExamId, tentativasGlobais]);

  const eventosVisiveis = useMemo(() => {
    return tentativasVisiveis
      .flatMap((tentativa: any) => (tentativa.logsSeguranca || []).map((log: any) => ({
        ...log,
        estudanteNome: tentativa.estudante?.nome || "Estudante",
        tituloAvaliacao: tentativa.tituloAvaliacao
      })))
      .sort((a: any, b: any) => new Date(b.dataRegisto).getTime() - new Date(a.dataRegisto).getTime());
  }, [tentativasVisiveis]);

  const estatisticas = useMemo(() => {
    const ativas = tentativasGlobais.filter((tentativa: any) => tentativa.statusTentativa === "em_curso");
    const bloqueadas = tentativasGlobais.filter((tentativa: any) => tentativa.statusTentativa === "bloqueada");
    const alertasAltos = ativas.filter((tentativa: any) => tentativa.monitoramento?.nivelSuspeita === "alto");

    return {
      totalAvaliacoes: avaliacoes.length,
      totalAtivas: ativas.length,
      alertasAltos: alertasAltos.length,
      bloqueadas: bloqueadas.length
    };
  }, [avaliacoes.length, tentativasGlobais]);

  useEffect(() => {
    if (primeiraCargaRef.current) {
      primeiraCargaRef.current = false;
      alertasAnterioresRef.current = estatisticas.alertasAltos;
      return;
    }

    if (estatisticas.alertasAltos > alertasAnterioresRef.current) {
      addToast(`Novo alerta crítico: ${estatisticas.alertasAltos}`, "error");
      if (somAtivado) {
        tocarAlertaSonoro();
      }
    }

    alertasAnterioresRef.current = estatisticas.alertasAltos;
  }, [addToast, somAtivado, estatisticas.alertasAltos, tocarAlertaSonoro]);


  const handleEstadoTentativa = (idTentativa: number, estado: string, mensagemSucesso: string) => {
    startTransition(async () => {
      const resultado = await atualizarStatusTentativaServer(idTentativa, estado);
      if (resultado.success) {
        addToast(mensagemSucesso, estado === "bloqueada" ? "error" : "success");
        await reloadData();
        return;
      }

      addToast(resultado.error || "Não foi possível alterar o estado da tentativa.", "error");
    });
  };

  const bloquearSuspeitasAltas = () => {
    const alvo = tentativasVisiveis.filter((tentativa: any) => tentativa.statusTentativa === "em_curso" && tentativa.monitoramento?.nivelSuspeita === "alto");

    if (alvo.length === 0) {
      addToast("Nenhuma tentativa em risco alto para bloquear.", "info");
      return;
    }

    startTransition(async () => {
      for (const tentativa of alvo) {
        await atualizarStatusTentativaServer(tentativa.id, "bloqueada");
      }

      addToast(`${alvo.length} tentativa(s) bloqueada(s) com base nos alertas detectados.`, "success");
      await reloadData();
    });
  };

  const totalEcras = tentativasVisiveis.length;
  const totalEventos = eventosVisiveis.length;
  const totalWebcamsLigadas = tentativasVisiveis.filter((tentativa: any) => tentativa.monitoramento?.webcamAtiva).length;

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className={`rounded-3xl border p-6 text-white shadow-2xl transition ${estatisticas.alertasAltos > 0 ? "border-red-400/40 bg-gradient-to-br from-red-950 via-slate-900 to-slate-800 shadow-red-500/10" : "border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800"}`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-red-200">
              <ShieldAlert className="h-4 w-4" /> Sala de Monitorização
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{professorNome}, monitorização em direto</h1>
              <p className="mt-2 max-w-2xl text-xs text-slate-300 sm:text-sm">Acompanha tentativas ativas e reage rápido a riscos.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void reloadData()}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/15 sm:px-4 sm:py-2.5 sm:text-sm"
            >
              <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} /> Atualizar
            </button>
            <button
              type="button"
              onClick={bloquearSuspeitasAltas}
              className="inline-flex items-center gap-2 rounded-2xl bg-red-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-400 sm:px-4 sm:py-2.5 sm:text-sm"
            >
              <Lock className="h-4 w-4" /> Bloquear riscos altos
            </button>
            <button
              type="button"
              onClick={() => setSomAtivado((valor) => !valor)}
              className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-bold transition sm:px-4 sm:py-2.5 sm:text-sm ${somAtivado ? "border-emerald-300 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/15" : "border-white/10 bg-white/10 text-white hover:bg-white/15"}`}
            >
              <ShieldAlert className="h-4 w-4" /> {somAtivado ? "Som ativo" : "Ativar som"}
            </button>
          </div>
        </div>


        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Exames", value: estatisticas.totalAvaliacoes, icon: Video, hint: "Monitorização" },
            { label: "Ativas", value: estatisticas.totalAtivas, icon: Users, hint: "Ao vivo" },
            { label: "Alertas", value: estatisticas.alertasAltos, icon: AlertTriangle, hint: "Alto risco" },
            { label: "Bloqueadas", value: estatisticas.bloqueadas, icon: CheckCircle2, hint: "Bloqueio" }
          ].map((card) => {
            const Icone = card.icon;
            return (
              <div key={card.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">{card.label}</p>
                    <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">{card.value}</h2>
                    <p className="mt-1 text-xs text-slate-400">{card.hint}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3 text-slate-100">
                    <Icone className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">Resumo das avaliações</h2>
                <p className="text-sm text-slate-500">Filtra por prova ou mantém tudo visível.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <select
                  value={String(selectedExamId)}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedExamId(value === "todos" ? "todos" : Number(value));
                  }}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none sm:px-4 sm:text-sm"
                >
                  <option value="todos">Todos os exames</option>
                  {avaliacoes.map((avaliacao: any) => (
                    <option key={avaliacao.id} value={avaliacao.id}>
                      {avaliacao.titulo}
                    </option>
                  ))}
                </select>

                <select
                  value={riskFilter}
                  onChange={(event) => setRiskFilter(event.target.value as any)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none sm:px-4 sm:text-sm"
                >
                  <option value="todos">Todos os riscos</option>
                  <option value="alto">Somente alto</option>
                  <option value="medio">Somente médio</option>
                  <option value="baixo">Somente baixo</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {tentativasVisiveis.length === 0 ? (
              <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
                Nenhuma tentativa ativa para estes filtros.
              </div>
            ) : (
              tentativasVisiveis.map((tentativa: any) => {
                const risco = obterEtiquetaRisco(tentativa.monitoramento?.nivelSuspeita);
                const bloqueada = tentativa.statusTentativa === "bloqueada";
                const statusTexto = bloqueada ? "Bloqueada" : tentativa.statusTentativa === "em_curso" ? "Em curso" : tentativa.statusTentativa || "Desconhecido";
                const percentagem = Math.min(100, (tentativa.monitoramento?.nivelSuspeita === "alto" ? 90 : tentativa.monitoramento?.nivelSuspeita === "medio" ? 60 : 25));

                return (
                  <div key={tentativa.id} className={`rounded-3xl border bg-white p-5 shadow-sm transition ${bloqueada ? "border-slate-200 opacity-70" : "border-slate-200 hover:shadow-md"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{tentativa.disciplinaNome}</p>
                        <h3 className="mt-1 text-base font-black text-slate-900">{tentativa.estudante?.nome || "Estudante"}</h3>
                        <p className="mt-1 text-xs text-slate-500">{tentativa.tituloAvaliacao}</p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-bold ${risco.classe}`}>{risco.texto}</span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-600">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <span className="block text-[10px] uppercase tracking-widest text-slate-400">Câmara</span>
                        <span className={`mt-1 block font-bold ${tentativa.monitoramento?.webcamAtiva ? "text-emerald-600" : "text-red-500"}`}>
                          {tentativa.monitoramento?.webcamAtiva ? "Ligada" : "Desligada"}
                        </span>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <span className="block text-[10px] uppercase tracking-widest text-slate-400">Estado</span>
                        <span className={`mt-1 block font-bold ${bloqueada ? "text-red-600" : "text-slate-700"}`}>{statusTexto}</span>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <span className="block text-[10px] uppercase tracking-widest text-slate-400">Perda de foco</span>
                        <span className="mt-1 block font-bold text-slate-700">{tentativa.monitoramento?.perdaFoco || 0}x</span>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <span className="block text-[10px] uppercase tracking-widest text-slate-400">Copiar texto</span>
                        <span className="mt-1 block font-bold text-slate-700">{tentativa.monitoramento?.tentativasCopia || 0}x</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Índice de suspeita</span>
                        <span>{tentativa.monitoramento?.nivelSuspeita || "baixo"}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${obterCorPercentagem(tentativa.monitoramento?.nivelSuspeita)}`} style={{ width: `${percentagem}%` }} />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {formatarDataHora(tentativa.submetidoEm || tentativa.dataInicio || new Date())}</span>
                      <span className="inline-flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> {tentativa.monitoramento?.deteccaoMultiplosRostos ? "Multi-rosto" : "1 rosto"}</span>
                    </div>

                    <div className="mt-5 flex gap-2">
                      {bloqueada ? (
                        <button
                          type="button"
                          onClick={() => handleEstadoTentativa(tentativa.id, "em_curso", "Tentativa restaurada com sucesso.")}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Unlock className="h-4 w-4" /> Desbloquear
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleEstadoTentativa(tentativa.id, "bloqueada", "Tentativa bloqueada pelo professor.")}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50"
                        >
                          <Lock className="h-4 w-4" /> Bloquear
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Incidentes</h3>
                <p className="text-sm text-slate-500">Eventos das tentativas visíveis.</p>
              </div>
              <div className="rounded-2xl bg-slate-100 p-2 text-slate-600">
                <ShieldAlert className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-4 space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {eventosVisiveis.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                  Nenhum incidente registado para os filtros atuais.
                </div>
              ) : (
                eventosVisiveis.map((evento: any, indice: number) => {
                  const suspeitaCopia = evento.tipoEvento === "tentativa_copiar";
                  return (
                    <div key={`${evento.id || indice}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">{evento.estudanteNome}</p>
                          <h4 className="mt-1 text-sm font-bold text-slate-900">{evento.tituloAvaliacao}</h4>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${suspeitaCopia ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-600"}`}>
                          {suspeitaCopia ? "Cópia" : "Foco"}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600">{evento.descricao}</p>
                      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{formatarDataHora(evento.dataRegisto)}</span>
                        <span>{evento.tipoEvento}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-black text-slate-900">Resumo rápido</h3>
            <div className="mt-4 space-y-3 text-xs text-slate-600 sm:text-sm">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="inline-flex items-center gap-2"><Video className="h-4 w-4 text-slate-500" /> Ecrãs monitorizados</span>
                <strong className="text-slate-900">{totalEcras}</strong>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-slate-500" /> Webcams ativas</span>
                <strong className="text-slate-900">{totalWebcamsLigadas}</strong>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="inline-flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-slate-500" /> Eventos visíveis</span>
                <strong className="text-slate-900">{totalEventos}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}






