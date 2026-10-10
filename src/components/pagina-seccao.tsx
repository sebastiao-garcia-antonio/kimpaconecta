import Link from "next/link";
import { ArrowLeft, Sparkles, Target } from "lucide-react";
import type { ReactNode } from "react";

type Indicador = {
  titulo: string;
  valor: string;
  observacao?: string;
};

type CartaoResumo = {
  titulo: string;
  descricao: string;
  estado?: string;
};

interface PaginaSecaoProps {
  papel: "admin" | "professor" | "coordenador" | "estudante";
  titulo: string;
  descricao: string;
  indicadores: Indicador[];
  acaoPrincipal?: ReactNode;
  mostrarVoltar?: boolean;
}

const rotulos = {
  admin: "Administração",
  professor: "Docente",
  coordenador: "Coordenação",
  estudante: "Estudante",
};

export function PaginaSecao({
  papel,
  titulo,
  descricao,
  indicadores,
  acaoPrincipal,
  mostrarVoltar = true,
}: PaginaSecaoProps) {
  const papelRotulo = rotulos[papel];

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Cabeçalho Limpo e Moderno (Light Mode Premium) */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all hover:shadow-md">
        <div className="flex flex-col gap-6 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 via-slate-50/80 to-emerald-50/40 p-6 lg:flex-row lg:items-start lg:justify-between lg:p-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/20 bg-brand-blue/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-blue">
              <Sparkles className="h-3.5 w-3.5" /> {papelRotulo}
            </div>
            <div className="space-y-1.5">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-3xl">
                {titulo}
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                {descricao}
              </p>
            </div>
          </div>

          {(acaoPrincipal || mostrarVoltar) && (
            <div className="flex flex-wrap gap-3">
              {acaoPrincipal}
              {mostrarVoltar && (
                <Link
                  href={`/${papel}`}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
                >
                  <ArrowLeft className="h-4 w-4 text-slate-500" /> Voltar
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Grelha de Indicadores/Métricas */}
        <div className="grid gap-4 bg-slate-50/40 p-6 md:grid-cols-2 xl:grid-cols-4 lg:p-8">
          {indicadores.map((indicador, index) => (
            <div
              key={`indicador-${indicador.titulo || "item"}-${index}`}
              className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-xs transition hover:border-brand-blue/30 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {indicador.titulo}
                  </p>
                  <div className="mt-1.5 text-3xl font-black tracking-tight text-slate-900">
                    {indicador.valor}
                  </div>
                  {indicador.observacao && (
                    <p className="mt-1 text-xs font-medium text-slate-500">{indicador.observacao}</p>
                  )}
                </div>
                <div className="rounded-2xl bg-brand-blue/10 p-3 text-brand-blue">
                  <Target className="h-5 w-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
