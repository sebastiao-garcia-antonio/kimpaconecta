"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, Clock, Eye, Lock, RefreshCw, ShieldAlert, Unlock, Users, Video, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { gerirEstadoTentativaProva, obterPainelProctoringGlobal } from "@/features/admin/admin.actions";

interface ProctoringGlobalClientProps {
  initialData: {
    metricas: {
      totalAtivas: number;
      totalBloqueadas: number;
      totalAlertasAltos: number;
      totalTentativas: number;
      totalLogs: number;
    };
    tentativas: any[];
    logsRecentes: any[];
  };
  adminNome: string;
}

function formatarData(valor: string | Date) {
  return new Date(valor).toLocaleString("pt-PT", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function corRisco(nivel?: string) {
  switch (nivel) {
    case "alto": return "border-red-200 bg-red-50 text-red-600";
    case "medio": return "border-amber-200 bg-amber-50 text-amber-600";
    case "baixo": return "border-emerald-200 bg-emerald-50 text-emerald-600";
    default: return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

function prioridadeRisco(nivel?: string) {
  switch (nivel) {
    case "alto": return 0;
    case "medio": return 1;
    default: return 2;
  }
}

export default function ProctoringGlobalClient({ initialData, adminNome }: ProctoringGlobalClientProps) {
  const [data, setData] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<"todos" | "em_curso" | "bloqueada">("todos");
  const [riscoFiltro, setRiscoFiltro] = useState<"todos" | "alto" | "medio" | "baixo">("todos");
  const [somAtivado, setSomAtivado] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();
  const audioContextRef = useRef<AudioContext | null>(null);
  const alertasAnterioresRef = useRef(initialData.metricas.totalAlertasAltos);
  const primeiraCargaRef = useRef(true);

  const recarregar = useCallback(async () => {
    const resposta = await obterPainelProctoringGlobal();
    if ((resposta as any)?.metricas) {
      setData(resposta as any);
    }
  }, []);

  const tocarSom = useCallback(() => {
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
      ganho.gain.exponentialRampToValueAtTime(0.10, contexto.currentTime + 0.02);
      ganho.gain.exponentialRampToValueAtTime(0.0001, contexto.currentTime + 0.35);
      oscilador.stop(contexto.currentTime + 0.38);
    } catch {
      // Som opcional
    }
  }, []);

  useEffect(() => {
    const intervalo = setInterval(() => {
      void recarregar();
    }, 15000);

    return () => clearInterval(intervalo);
  }, [recarregar]);

  useEffect(() => {
    if (primeiraCargaRef.current) {
      primeiraCargaRef.current = false;
      alertasAnterioresRef.current = data.metricas.totalAlertasAltos;
      return;
    }

    if (data.metricas.totalAlertasAltos > alertasAnterioresRef.current) {
      addToast(`Novo alerta crítico: ${data.metricas.totalAlertasAltos}`, "error");
      if (somAtivado) tocarSom();
    }

    alertasAnterioresRef.current = data.metricas.totalAlertasAltos;
  }, [addToast, data.metricas.totalAlertasAltos, somAtivado, tocarSom]);

  const tentativasOrdenadas = useMemo(() => {
    return [...(data.tentativas || [])]
      .sort((primeira, segunda) => {
        const prioridadeDiferenca = prioridadeRisco(primeira.monitoramento?.nivelSuspeita) - prioridadeRisco(segunda.monitoramento?.nivelSuspeita);
        if (prioridadeDiferenca !== 0) return prioridadeDiferenca;
        return Number(segunda.id) - Number(primeira.id);
      })
      .filter((tentativa) => {
        const textoPesquisa = `${tentativa.estudante?.nome || ""} ${tentativa.estudante?.email || ""} ${tentativa.provaTitulo || ""} ${tentativa.tipoEvento || ""}`.toLowerCase();
        const correspondePesquisa = textoPesquisa.includes(searchTerm.toLowerCase());
        const correspondeEstado = estadoFiltro === "todos" || tentativa.statusTentativa === estadoFiltro;
        const correspondeRisco = riscoFiltro === "todos" || (tentativa.monitoramento?.nivelSuspeita || "baixo") === riscoFiltro;
        return correspondePesquisa && correspondeEstado && correspondeRisco;
      });
  }, [data.tentativas, searchTerm, estadoFiltro, riscoFiltro]);

  const logsFiltrados = useMemo(() => {
    return (data.logsRecentes || []).filter((log) => {
      const textoPesquisa = `${log.estudanteNome || ""} ${log.estudanteEmail || ""} ${log.provaTitulo || ""} ${log.tipoEvento || ""} ${log.descricao || ""}`.toLowerCase();
      return textoPesquisa.includes(searchTerm.toLowerCase());
    });
  }, [data.logsRecentes, searchTerm]);

  const bloquearEmLote = () => {
    const alvos = tentativasOrdenadas.filter((tentativa) => tentativa.statusTentativa === "em_curso" && (tentativa.monitoramento?.nivelSuspeita || "baixo") === "alto");

    if (alvos.length === 0) {
      addToast("Nenhuma tentativa em alto risco encontrada.", "info");
      return;
    }

    startTransition(async () => {
      for (const tentativa of alvos) {
        await gerirEstadoTentativaProva(Number(tentativa.id), "bloqueada");
      }
      addToast(`${alvos.length} tentativa(s) bloqueada(s).`, "success");
      await recarregar();
    });
  };

  const alternarEstado = (idTentativa: number, statusAtual: string) => {
    const novoEstado = statusAtual === "bloqueada" ? "em_curso" : "bloqueada";

    startTransition(async () => {
      const resposta = await gerirEstadoTentativaProva(idTentativa, novoEstado);
      if ((resposta as any)?.success) {
        addToast(novoEstado === "bloqueada" ? "Tentativa bloqueada." : "Tentativa desbloqueada.", novoEstado === "bloqueada" ? "error" : "success");
        await recarregar();
        return;
      }

      addToast((resposta as any)?.error || "Não foi possível alterar a tentativa.", "error");
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className={`rounded-3xl border p-6 text-white shadow-2xl transition ${data.metricas.totalAlertasAltos > 0 ? "border-red-400/40 bg-gradient-to-br from-red-950 via-slate-900 to-slate-800 shadow-red-500/10" : "border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800"}`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-red-200">
              <ShieldAlert className="h-4 w-4" /> Proctoring global
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{adminNome}, controlo global em direto</h1>
              <p className="mt-2 max-w-2xl text-xs text-slate-300 sm:text-sm">Vê todas as tentativas ativas, os logs recentes e intervém quando houver risco.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void recarregar()}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/15 sm:px-4 sm:py-2.5 sm:text-sm"
            >
              <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} /> Atualizar
            </button>
            <button
              type="button"
              onClick={bloquearEmLote}
              className="inline-flex items-center gap-2 rounded-2xl bg-red-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-400 sm:px-4 sm:py-2.5 sm:text-sm"
            >
              <Lock className="h-4 w-4" /> Bloquear altos
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

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Tentativas", value: data.metricas.totalTentativas, icon: Video, hint: "Visão geral" },
            { label: "Ativas", value: data.metricas.totalAtivas, icon: Users, hint: "Em curso" },
            { label: "Alertas altos", value: data.metricas.totalAlertasAltos, icon: AlertTriangle, hint: "Atenção" },
            { label: "Bloqueadas", value: data.metricas.totalBloqueadas, icon: CheckCircle2, hint: "Contenção" },
            { label: "Logs", value: data.metricas.totalLogs, icon: Clock, hint: "Recentes" }
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
                <h2 className="text-base font-black text-slate-900 sm:text-lg">Resumo do monitor</h2>
                <p className="text-xs text-slate-500 sm:text-sm">Pesquisa rápida e controlo por estado ou risco.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={(evento) => setSearchTerm(evento.target.value)}
                    placeholder="Pesquisar estudante, prova ou evento"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs font-semibold text-slate-700 outline-none sm:w-80 sm:text-sm"
                  />
                </div>
                <select value={estadoFiltro} onChange={(evento) => setEstadoFiltro(evento.target.value as any)} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none sm:px-4 sm:text-sm">
                  <option value="todos">Todos os estados</option>
                  <option value="em_curso">Em curso</option>
                  <option value="bloqueada">Bloqueada</option>
                </select>
                <select value={riscoFiltro} onChange={(evento) => setRiscoFiltro(evento.target.value as any)} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none sm:px-4 sm:text-sm">
                  <option value="todos">Todos os riscos</option>
                  <option value="alto">Alto</option>
                  <option value="medio">Médio</option>
                  <option value="baixo">Baixo</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {tentativasOrdenadas.length === 0 ? (
              <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
                Nenhuma tentativa encontrada.
              </div>
            ) : (
              tentativasOrdenadas.map((tentativa) => {
                const nivel = tentativa.monitoramento?.nivelSuspeita || "baixo";
                const bloqueada = tentativa.statusTentativa === "bloqueada";
                const percentagem = nivel === "alto" ? 90 : nivel === "medio" ? 60 : 25;

                return (
                  <div key={tentativa.id} className={`rounded-3xl border bg-white p-5 shadow-sm transition ${bloqueada ? "border-slate-200 opacity-75" : "border-slate-200 hover:shadow-md"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{tentativa.avaliacao?.titulo || "Avaliação"}</p>
                        <h3 className="mt-1 text-base font-black text-slate-900">{tentativa.estudante?.nome || "Estudante"}</h3>
                        <p className="mt-1 text-xs text-slate-500">{tentativa.estudante?.email || tentativa.estudante?.numEstudanteLogin || "Sem identificação"}</p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-bold ${corRisco(nivel)}`}>{nivel}</span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-600">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <span className="block text-[10px] uppercase tracking-widest text-slate-400">Câmara</span>
                        <span className={`mt-1 block font-bold ${tentativa.monitoramento?.webcamAtiva ? "text-emerald-600" : "text-red-500"}`}>{tentativa.monitoramento?.webcamAtiva ? "Ligada" : "Desligada"}</span>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <span className="block text-[10px] uppercase tracking-widest text-slate-400">Estado</span>
                        <span className={`mt-1 block font-bold ${bloqueada ? "text-red-600" : "text-slate-700"}`}>{bloqueada ? "Bloqueada" : "Em curso"}</span>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <span className="block text-[10px] uppercase tracking-widest text-slate-400">Foco</span>
                        <span className="mt-1 block font-bold text-slate-700">{tentativa.monitoramento?.perdaFoco || 0}x</span>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <span className="block text-[10px] uppercase tracking-widest text-slate-400">Cópias</span>
                        <span className="mt-1 block font-bold text-slate-700">{tentativa.monitoramento?.tentativasCopia || 0}x</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Índice de suspeita</span>
                        <span>{nivel}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${nivel === "alto" ? "bg-red-500" : nivel === "medio" ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${percentagem}%` }} />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> {tentativa.monitoramento?.deteccaoMultiplosRostos ? "Multi-rosto" : "1 rosto"}</span>
                      <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {formatarData(tentativa.submetidoEm || tentativa.dataInicio || new Date())}</span>
                    </div>

                    <div className="mt-5 flex gap-2">
                      <button
                        type="button"
                        onClick={() => alternarEstado(tentativa.id, tentativa.statusTentativa)}
                        className={`flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold transition ${bloqueada ? "border-slate-200 text-slate-700 hover:bg-slate-50" : "border-red-200 text-red-600 hover:bg-red-50"}`}
                      >
                        {bloqueada ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        {bloqueada ? "Desbloquear" : "Bloquear"}
                      </button>
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
                <h3 className="text-sm font-black text-slate-900 sm:text-base">Logs recentes</h3>
                <p className="text-xs text-slate-500 sm:text-sm">Incidentes mais recentes do sistema.</p>
              </div>
              <div className="rounded-2xl bg-slate-100 p-2 text-slate-600">
                <ShieldAlert className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-4 space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {logsFiltrados.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-6 text-center text-xs text-slate-500 sm:text-sm">
                  Sem logs para os filtros atuais.
                </div>
              ) : (
                logsFiltrados.map((log) => {
                  const bloqueia = log.tipoEvento === "tentativa_copiar";
                  return (
                    <div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">{log.estudanteNome}</p>
                          <h4 className="mt-1 text-sm font-bold text-slate-900">{log.provaTitulo}</h4>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${bloqueia ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-600"}`}>
                          {bloqueia ? "Cópia" : "Foco"}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600">{log.descricao}</p>
                      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{formatarData(log.dataRegisto)}</span>
                        <button type="button" onClick={() => alternarEstado(Number(log.idTentativa), log.statusTentativa)} className="font-bold text-slate-700 hover:text-slate-900">
                          {log.statusTentativa === "bloqueada" ? "Desbloquear" : "Bloquear"}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 sm:text-base">Resumo rápido</h3>
            <div className="mt-4 space-y-3 text-xs text-slate-600 sm:text-sm">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="inline-flex items-center gap-2"><Video className="h-4 w-4 text-slate-500" /> Tentativas</span>
                <strong className="text-slate-900">{data.metricas.totalTentativas}</strong>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-slate-500" /> Ativas</span>
                <strong className="text-slate-900">{data.metricas.totalAtivas}</strong>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="inline-flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-slate-500" /> Alertas altos</span>
                <strong className="text-slate-900">{data.metricas.totalAlertasAltos}</strong>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-slate-500" /> Logs</span>
                <strong className="text-slate-900">{data.metricas.totalLogs}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

