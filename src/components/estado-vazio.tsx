import { type ReactNode } from "react";
import { Sparkles } from "lucide-react";

interface EstadoVazioProps {
  titulo: string;
  descricao: string;
  acao?: ReactNode;
  icone?: ReactNode;
}

export function EstadoVazio({ titulo, descricao, acao, icone }: EstadoVazioProps) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-blue shadow-sm">
        {icone || <Sparkles className="h-6 w-6" />}
      </div>
      <h3 className="mt-4 text-lg font-black text-slate-900">{titulo}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">{descricao}</p>
      {acao && <div className="mt-5 flex justify-center">{acao}</div>}
    </div>
  );
}
