"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { atualizarPerfilEstudanteServer } from "@/features/users/actions";

type Habilidade = {
  id: number;
  nomeHabilidade: string;
};

type Competencia = {
  id: number;
  nomeCompetencia: string;
  habilidades: Habilidade[];
};

type Perfil = {
  id: number;
  nome: string;
  email: string;
  telefone?: string | null;
  numBi?: string | null;
  fotoPerfil?: string | null;
  bio?: string | null;
  habilidades?: {
    habilidade: {
      id: number;
    };
  }[];
};

interface FormularioPerfilEstudanteClientProps {
  perfil: Perfil;
  competencias: Competencia[];
}

export function FormularioPerfilEstudanteClient({ perfil, competencias }: FormularioPerfilEstudanteClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mensagem, setMensagem] = useState<string | null>(null);
  const habilidadesIniciais = useMemo(
    () => new Set((perfil.habilidades || []).map((entrada) => entrada.habilidade.id)),
    [perfil.habilidades]
  );
  const [habilidadesSelecionadas, setHabilidadesSelecionadas] = useState<Set<number>>(habilidadesIniciais);

  const alternarHabilidade = (idHabilidade: number) => {
    setHabilidadesSelecionadas((estadoAnterior) => {
      const novoEstado = new Set(estadoAnterior);
      if (novoEstado.has(idHabilidade)) {
        novoEstado.delete(idHabilidade);
      } else {
        novoEstado.add(idHabilidade);
      }
      return novoEstado;
    });
  };

  const submeterPerfil = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const formData = new FormData(evento.currentTarget);

    startTransition(async () => {
      const resultado = await atualizarPerfilEstudanteServer({

        nome: String(formData.get("nome") || ""),
        bio: String(formData.get("bio") || ""),
        telefone: String(formData.get("telefone") || ""),
        numBi: String(formData.get("numBi") || ""),
        fotoPerfil: String(formData.get("fotoPerfil") || ""),
        habilidadeIds: Array.from(habilidadesSelecionadas),
      });

      if (resultado.success) {
        setMensagem("Perfil atualizado com sucesso.");
        router.refresh();
      } else {
        setMensagem(resultado.error || "Não foi possível atualizar o perfil.");
      }
    });
  };

  return (
    <form onSubmit={submeterPerfil} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg text-slate-800">Completar perfil</h3>
          <p className="text-sm text-slate-500">Adicione biografia, foto e selecione as suas competências e habilidades.</p>
        </div>
        {mensagem && <p className="text-sm font-semibold text-slate-600">{mensagem}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-2 text-sm font-semibold text-slate-700">
          <span>Nome completo</span>
          <input
            name="nome"
            defaultValue={perfil.nome}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          />
        </label>

        <label className="space-y-2 text-sm font-semibold text-slate-700">
          <span>Foto de perfil</span>
          <input
            name="fotoPerfil"
            defaultValue={perfil.fotoPerfil || ""}
            placeholder="URL da imagem"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          />
        </label>

        <label className="space-y-2 text-sm font-semibold text-slate-700">
          <span>Número de BI</span>
          <input
            name="numBi"
            defaultValue={perfil.numBi || ""}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          />
        </label>

        <label className="space-y-2 text-sm font-semibold text-slate-700">
          <span>Telefone</span>
          <input
            name="telefone"
            defaultValue={perfil.telefone || ""}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          />
        </label>
      </div>

      <label className="space-y-2 text-sm font-semibold text-slate-700 block">
        <span>Biografia</span>
        <textarea
          name="bio"
          defaultValue={perfil.bio || ""}
          rows={4}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          placeholder="Conte um pouco sobre o seu percurso e objetivos"
        />
      </label>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-slate-800">Competências e habilidades</h4>
          <span className="text-xs text-slate-400">{habilidadesSelecionadas.size} selecionadas</span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {competencias.map((competencia) => (
            <div key={competencia.id} className="rounded-2xl border border-slate-200 p-4">
              <h5 className="font-semibold text-slate-800 mb-3">{competencia.nomeCompetencia}</h5>
              <div className="space-y-2">
                {competencia.habilidades.map((habilidade) => (
                  <label key={habilidade.id} className="flex items-center gap-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={habilidadesSelecionadas.has(habilidade.id)}
                      onChange={() => alternarHabilidade(habilidade.id)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
                    />
                    <span>{habilidade.nomeHabilidade}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-blue-dark disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isPending ? "A guardar..." : "Guardar perfil"}
        </button>
      </div>
    </form>
  );
}
