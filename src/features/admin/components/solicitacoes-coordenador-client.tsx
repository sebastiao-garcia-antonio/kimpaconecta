"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Clock, Loader2, XCircle, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { processarSolicitacaoAcesso } from "@/features/admin/admin.actions";

type Solicitacao = {
  id: number;
  nomeCompleto: string;
  email: string;
  numEstudante: string;
  numBi?: string | null;
  telefone?: string | null;
  status: string;
  curso: {
    nomeCurso: string;
    unidade: {
      nomeUo: string;
      sigla: string;
    };
  };
  turma?: {
    nomeTurma: string;
    anoCurricular: number;
    periodo: string;
  } | null;
};

interface SolicitacoesCoordenadorClientProps {
  solicitacoes: Solicitacao[];
}

export function SolicitacoesCoordenadorClient({ solicitacoes }: SolicitacoesCoordenadorClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mensagem, setMensagem] = useState<string | null>(null);

  // Mapa local de status para transição imediata na UI
  const [statusMap, setStatusMap] = useState<Record<number, string>>(() => {
    const map: Record<number, string> = {};
    solicitacoes.forEach((s) => {
      map[s.id] = s.status;
    });
    return map;
  });

  const [idEmProcessamento, setIdEmProcessamento] = useState<number | null>(null);

  const processar = (idSolicitacao: number, aprovado: boolean) => {
    setIdEmProcessamento(idSolicitacao);
    startTransition(async () => {
      const resultado = await processarSolicitacaoAcesso(idSolicitacao, aprovado);
      if (resultado.success) {
        setStatusMap((prev) => ({
          ...prev,
          [idSolicitacao]: aprovado ? "aprovado" : "rejeitado",
        }));
        setMensagem(resultado.message || (aprovado ? "Solicitação aprovada com sucesso!" : "Solicitação rejeitada."));
        router.refresh();
      } else {
        setMensagem(resultado.error || "Não foi possível processar a solicitação.");
      }
      setIdEmProcessamento(null);
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-extrabold text-lg text-slate-800">Solicitações de Acesso</h3>
          <p className="text-sm text-slate-500">
            Pedidos de acesso enviados pelos estudantes para validação da coordenação.
          </p>
        </div>
        {mensagem && (
          <div className="rounded-xl bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-700">
            {mensagem}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {solicitacoes.map((solicitacao) => {
          const statusAtual = statusMap[solicitacao.id] || solicitacao.status;
          const aProcessarEsta = isPending && idEmProcessamento === solicitacao.id;

          return (
            <div
              key={solicitacao.id}
              className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4 transition-all hover:bg-white hover:shadow-xs"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-800">{solicitacao.nomeCompleto}</h4>
                    <span className="text-xs text-slate-400">· Nº {solicitacao.numEstudante}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{solicitacao.email}</span>
                    {solicitacao.numBi && <span> · BI: {solicitacao.numBi}</span>}
                    {solicitacao.telefone && <span> · Tel: {solicitacao.telefone}</span>}
                  </p>
                  <p className="text-xs text-slate-600">
                    {solicitacao.curso.unidade.sigla} · {solicitacao.curso.nomeCurso}
                    {solicitacao.turma && (
                      <span className="font-semibold text-brand-blue">
                        {" "}· Turma {solicitacao.turma.nomeTurma} ({solicitacao.turma.anoCurricular}º ano · {solicitacao.turma.periodo})
                      </span>
                    )}
                  </p>
                </div>

                {/* Área de estado e botões */}
                <div className="flex items-center shrink-0">
                  {statusAtual === "pendente" ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => processar(solicitacao.id, true)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-60 transition"
                      >
                        {aProcessarEsta ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        <span>Aprovar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => processar(solicitacao.id, false)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 disabled:opacity-60 transition"
                      >
                        {aProcessarEsta ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                        <span>Rejeitar</span>
                      </button>
                    </div>
                  ) : statusAtual === "aprovado" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Aprovada</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-bold text-rose-700">
                      <XCircle className="h-4 w-4 text-rose-600" />
                      <span>Rejeitada</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {solicitacoes.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            Não existem solicitações de acesso para os cursos sob a sua coordenação.
          </div>
        )}
      </div>
    </div>
  );
}
