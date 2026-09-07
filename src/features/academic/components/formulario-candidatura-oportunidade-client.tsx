"use client";

import { FormEvent, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { submeterCandidaturaOportunidadeServer } from "@/features/academic/actions";

type Oportunidade = {
  idOportunidade: number;
  titulo: string;
  empresa?: string | null;
  tipo: string;
  candidaturas?: {
    estado: string;
  }[];
};

interface FormularioCandidaturaOportunidadeClientProps {
  idUsuario: number;
  oportunidades: Oportunidade[];
}

export function FormularioCandidaturaOportunidadeClient({
  idUsuario,
  oportunidades,
}: FormularioCandidaturaOportunidadeClientProps) {
  const router = useRouter();
  const [idOportunidade, setIdOportunidade] = useState(String(oportunidades[0]?.idOportunidade ?? ""));
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submeter = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();

    startTransition(async () => {
      const resultado = await submeterCandidaturaOportunidadeServer(Number(idOportunidade), idUsuario);
      if (resultado.success) {
        setMensagem("Candidatura submetida com sucesso.");
        router.refresh();
      } else {
        setMensagem(resultado.error || "Não foi possível submeter a candidatura.");
      }
    });
  };

  return (
    <form onSubmit={submeter} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div>
        <h3 className="font-bold text-lg text-slate-800">Submeter candidatura</h3>
        <p className="text-sm text-slate-500">Escolhe uma oportunidade disponível e envia a candidatura para análise.</p>
      </div>

      <label className="space-y-2 text-sm font-semibold text-slate-700 block">
        <span>Oportunidade</span>
        <select
          value={idOportunidade}
          onChange={(evento) => setIdOportunidade(evento.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
        >
          {oportunidades.map((oportunidade) => (
            <option key={oportunidade.idOportunidade} value={oportunidade.idOportunidade}>
              {oportunidade.titulo} {oportunidade.empresa ? `· ${oportunidade.empresa}` : ""}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center justify-between gap-3">
        {mensagem && <p className="text-sm font-semibold text-slate-600">{mensagem}</p>}
        <button
          type="submit"
          disabled={isPending || oportunidades.length === 0}
          className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-blue-dark disabled:opacity-60"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? "A enviar..." : "Enviar candidatura"}
        </button>
      </div>
    </form>
  );
}
