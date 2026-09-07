"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
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

  const processar = (idSolicitacao: number, aprovado: boolean) => {
    startTransition(async () => {
      const resultado = await processarSolicitacaoAcesso(idSolicitacao, aprovado);
      if (resultado.success) {
        setMensagem(resultado.message || "Solicitação processada.");
        router.refresh();
      } else {
        setMensagem(resultado.error || "Não foi possível processar a solicitação.");
      }
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg text-slate-800">Solicitações pendentes</h3>
          <p className="text-sm text-slate-500">Pedidos de acesso dos estudantes do seu curso.</p>
        </div>
        {mensagem && <p className="text-sm font-semibold text-slate-600">{mensagem}</p>}
      </div>

      <div className="space-y-3">
        {solicitacoes.map((solicitacao) => (
          <div key={solicitacao.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h4 className="font-semibold text-slate-800">{solicitacao.nomeCompleto}</h4>
                <p className="text-sm text-slate-500">
                  {solicitacao.email} · {solicitacao.numEstudante} · {solicitacao.numBi || "Sem BI"}
                </p>
                <p className="text-sm text-slate-500">
                  {solicitacao.curso.unidade.nomeUo} · {solicitacao.curso.nomeCurso}
                  {solicitacao.turma ? ` · ${solicitacao.turma.nomeTurma} (${solicitacao.turma.anoCurricular}º ano)` : ""}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => processar(solicitacao.id, true)}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Aprovar
                </button>
                <button
                  type="button"
                  onClick={() => processar(solicitacao.id, false)}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Rejeitar
                </button>
              </div>
            </div>
          </div>
        ))}

        {solicitacoes.length === 0 && (
          <p className="text-sm text-slate-500">Não existem solicitações pendentes para este curso.</p>
        )}
      </div>
    </div>
  );
}
