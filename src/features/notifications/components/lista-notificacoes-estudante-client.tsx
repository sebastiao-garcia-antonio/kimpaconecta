"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCheck, BellRing } from "lucide-react";
import { marcarNotificacaoComoLidaServer, marcarTodasNotificacoesComoLidasServer } from "@/features/notifications/actions";

interface NotificacaoItem {
  idNotificacao: number;
  titulo: string;
  mensagem: string;
  tipo: string;
  prioridade: string;
  lida: boolean;
  dataEnvio: string;
}

interface ListaNotificacoesEstudanteClientProps {
  notificacoes: NotificacaoItem[];
}

function formatarData(valor: string) {
  return new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short" }).format(new Date(valor));
}

export function ListaNotificacoesEstudanteClient({ notificacoes }: ListaNotificacoesEstudanteClientProps) {
  const [pendenteId, setPendenteId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const naoLidas = notificacoes.filter((notificacao) => !notificacao.lida).length;

  const marcarLida = (idNotificacao: number) => {
    setPendenteId(idNotificacao);
    startTransition(async () => {
      await marcarNotificacaoComoLidaServer(idNotificacao);
      setPendenteId(null);
      router.refresh();
    });
  };

  const marcarTodas = () => {
    startTransition(async () => {
      await marcarTodasNotificacoesComoLidasServer();
      router.refresh();
    });
  };

  if (notificacoes.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <BellRing className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <p className="font-semibold text-slate-700">Ainda não tem notificações.</p>
        <p className="mt-1 text-sm text-slate-500">Aprovações, interações e avisos importantes vão aparecer aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {naoLidas > 0 && (
        <div className="flex justify-end">
          <button type="button" onClick={marcarTodas} disabled={isPending} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60">
            <CheckCheck className="h-4 w-4" />
            {isPending && pendenteId === null ? "A marcar..." : "Marcar todas como lidas"}
          </button>
        </div>
      )}

      {notificacoes.map((notificacao) => {
        const destacada = !notificacao.lida;
        const corPrioridade = notificacao.prioridade === "alta" ? "text-red-700 bg-red-100" : "text-slate-500 bg-slate-100";

        return (
          <div key={notificacao.idNotificacao} className={`rounded-2xl border p-5 shadow-sm transition ${destacada ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-slate-800">{notificacao.titulo}</h3>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${notificacao.lida ? "bg-slate-100 text-slate-500" : "bg-emerald-100 text-emerald-700"}`}>{notificacao.lida ? "Lida" : "Nova"}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{notificacao.tipo}</span>
                  {notificacao.prioridade === "alta" && <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${corPrioridade}`}>Prioridade alta</span>}
                </div>
                <p className="text-sm leading-relaxed text-slate-600">{notificacao.mensagem}</p>
                <p className="text-xs text-slate-400">{formatarData(notificacao.dataEnvio)}</p>
              </div>

              {!notificacao.lida ? (
                <button type="button" onClick={() => marcarLida(notificacao.idNotificacao)} disabled={isPending} className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60">
                  <Check className="h-4 w-4" />
                  {isPending && pendenteId === notificacao.idNotificacao ? "A marcar..." : "Marcar como lida"}
                </button>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-500"><CheckCheck className="h-4 w-4" />Já lida</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}