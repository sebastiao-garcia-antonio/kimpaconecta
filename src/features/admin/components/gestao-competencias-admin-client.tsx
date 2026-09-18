"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2, Plus, X } from "lucide-react";
import { cadastrarCompetenciaHabilidade } from "@/features/admin/admin.actions";

type CompetenciaAdmin = {
  id: number;
  nomeCompetencia: string;
  habilidades: Array<{ id: number; nomeHabilidade: string }>;
};

interface GestaoCompetenciasAdminClientProps {
  competencias: CompetenciaAdmin[];
}

export function GestaoCompetenciasAdminClient({ competencias }: GestaoCompetenciasAdminClientProps) {
  const router = useRouter();
  const [pendente, iniciarTransicao] = useTransition();
  const [mensagem, setMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  const [modal, setModal] = useState(false);
  const [nomeCompetencia, setNomeCompetencia] = useState("");
  const [habilidadesTexto, setHabilidadesTexto] = useState("");

  const criar = (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem(null);

    const habilidades = habilidadesTexto
      .split("\n")
      .map((habilidade) => habilidade.trim())
      .filter(Boolean);

    if (!nomeCompetencia.trim() || habilidades.length === 0) {
      setMensagem({ tipo: "erro", texto: "Indique o nome da competência e pelo menos uma habilidade." });
      return;
    }

    iniciarTransicao(async () => {
      const resultado = await cadastrarCompetenciaHabilidade({
        nomeCompetencia: nomeCompetencia.trim(),
        habilidades,
      });

      if (resultado.success) {
        setNomeCompetencia("");
        setHabilidadesTexto("");
        setModal(false);
        setMensagem({ tipo: "sucesso", texto: "Competência e habilidades registadas." });
        router.refresh();
      } else {
        setMensagem({ tipo: "erro", texto: resultado.error || "Não foi possível registar a competência." });
      }
    });
  };

  return (
    <div className="space-y-5">
      {mensagem && (
        <p
          className={`rounded-2xl border p-4 text-xs font-bold ${
            mensagem.tipo === "sucesso"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {mensagem.texto}
        </p>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-slate-900">Catálogo de competências</h3>
          <p className="mt-1 text-sm text-slate-500">Lista das competências com as respetivas habilidades.</p>
        </div>
        <button
          type="button"
          onClick={() => setModal(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-blue-dark"
        >
          <Plus className="h-4 w-4" /> Nova competência
        </button>
      </div>

      {modal && (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="font-bold text-slate-800">Registar competência e habilidades</h4>
            <button type="button" onClick={() => setModal(false)} className="rounded-full bg-slate-200 p-1.5 text-slate-500 hover:bg-slate-300">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={criar} className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Nome da competência
              <input
                value={nomeCompetencia}
                onChange={(e) => setNomeCompetencia(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                placeholder="Ex.: Ciência de Dados"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Habilidades (uma por linha)
              <textarea
                value={habilidadesTexto}
                onChange={(e) => setHabilidadesTexto(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                placeholder={"Análise exploratória\nVisualização de dados\nMachine Learning"}
              />
            </label>
            <div className="flex gap-3">
              <button type="submit" disabled={pendente} className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-blue-dark disabled:opacity-60">
                {pendente ? <Loader2 className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />} Guardar competência
              </button>
              <button type="button" onClick={() => setModal(false)} className="rounded-2xl bg-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-300">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {competencias.map((competencia) => (
          <div key={competencia.id} className="rounded-2xl border border-slate-200 p-5">
            <h4 className="text-base font-bold text-slate-800">{competencia.nomeCompetencia}</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {competencia.habilidades.map((habilidade) => (
                <span key={habilidade.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {habilidade.nomeHabilidade}
                </span>
              ))}
              {competencia.habilidades.length === 0 && (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">Sem habilidades</span>
              )}
            </div>
          </div>
        ))}

        {competencias.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
            Nenhuma competência registada ainda. Cria a primeira para estruturar o catálogo.
          </div>
        )}
      </div>
    </div>
  );
}