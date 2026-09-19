"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type FiltroAnoAcademicoClientProps = {
  anosDisponiveis: number[];
  anoActual?: number | null;
};

export function FiltroAnoAcademicoClient({ anosDisponiveis, anoActual }: FiltroAnoAcademicoClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const valorAtual = searchParams.get("ano") || "actual";
  const valorAtivo = valorAtual === "actual" && anoActual ? String(anoActual) : valorAtual;

  const opcoes = useMemo(() => {
    const anos = Array.from(new Set(anosDisponiveis)).sort((a, b) => a - b);

    return anos.map((ano) => ({
      value: String(ano),
      label: `${ano}º ano`,
    }));
  }, [anosDisponiveis]);

  const atualizarAno = (novoValor: string) => {
    const parametros = new URLSearchParams(searchParams.toString());
    if (novoValor === "actual") {
      parametros.delete("ano");
    } else {
      parametros.set("ano", novoValor);
    }
    router.push(`${pathname}${parametros.toString() ? `?${parametros.toString()}` : ""}`);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Contexto académico</p>
          <p className="text-sm text-slate-600">
            {anoActual ? `Ano actual sugerido: ${anoActual}º ano.` : "Escolha o ano que pretende visualizar no painel."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {anosDisponiveis.length > 1 && (
            <button
              type="button"
              onClick={() => atualizarAno("actual")}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                valorAtual === "actual"
                  ? "bg-brand-blue text-white shadow-md shadow-brand-blue/20"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              Ano actual
            </button>
          )}

          {opcoes.map((opcao) => {
            const ativo = valorAtivo === opcao.value;
            return (
              <button
                key={opcao.value}
                type="button"
                onClick={() => atualizarAno(opcao.value)}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  ativo
                    ? "bg-brand-blue text-white shadow-md shadow-brand-blue/20"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {opcao.label}
              </button>
            );
          })}

          {anosDisponiveis.length > 1 && (
            <button
              type="button"
              onClick={() => atualizarAno("historico")}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                valorAtual === "historico"
                  ? "bg-brand-blue text-white shadow-md shadow-brand-blue/20"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              Todos os anos
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
