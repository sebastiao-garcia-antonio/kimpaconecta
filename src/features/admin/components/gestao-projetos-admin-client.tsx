"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { gerirAutorizacaoProjeto } from "@/features/admin/admin.actions";

type ProjetoAdmin = {
  id: number;
  titulo: string;
  descricao: string;
  idProfessorAutorizador: number | null;
  disciplina?: { nomeDisciplina: string } | null;
  professor?: { nome: string } | null;
  autores?: Array<{ usuario: { nome: string } }>;
};

interface GestaoProjetosAdminClientProps {
  projetos: ProjetoAdmin[];
}

export function GestaoProjetosAdminClient({ projetos }: GestaoProjetosAdminClientProps) {
  const router = useRouter();
  const [pendente, iniciarTransicao] = useTransition();
  const [mensagem, setMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  const [idEmAcao, setIdEmAcao] = useState<number | null>(null);
  const [mapaEstado, setMapaEstado] = useState<Record<number, boolean>>(() => {
    const mapa: Record<number, boolean> = {};
    projetos.forEach((projeto) => {
      mapa[projeto.id] = Boolean(projeto.idProfessorAutorizador);
    });
    return mapa;
  });

  const gerir = (idProjeto: number, autorizar: boolean) => {
    setIdEmAcao(idProjeto);
    iniciarTransicao(async () => {
      const resultado = await gerirAutorizacaoProjeto(idProjeto, autorizar);
      if (resultado.success) {
        setMapaEstado((prev) => ({ ...prev, [idProjeto]: autorizar }));
        setMensagem({
          tipo: "sucesso",
          texto: autorizar ? "Projeto aprovado e publicado na vitrine." : "Autorização removida do projeto.",
        });
        router.refresh();
      } else {
        setMensagem({ tipo: "erro", texto: resultado.error || "Não foi possível processar o projeto." });
      }
      setIdEmAcao(null);
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

      {projetos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Nenhum projeto submetido à vitrine.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projetos.map((projeto) => {
            const autorizado = mapaEstado[projeto.id];
            const nomesAutores = projeto.autores?.map((autor) => autor.usuario.nome).join(", ") || "Autor não identificado";
            return (
              <div key={projeto.id} className="rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-bold text-slate-800">{projeto.titulo}</h4>
                    <p className="mt-1 text-xs text-slate-500">{projeto.disciplina?.nomeDisciplina || "Projeto interdisciplinar"}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${autorizado ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {autorizado ? "Aprovado" : "Pendente"}
                  </span>
                </div>

                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{projeto.descricao}</p>
                <div className="mt-4 space-y-1 text-xs text-slate-500">
                  <p>Autores: {nomesAutores}</p>
                  {projeto.professor?.nome && <p>Aprovador atual: {projeto.professor.nome}</p>}
                </div>

                <div className="mt-4 flex items-center gap-2">
                  {autorizado ? (
                    <button
                      type="button"
                      onClick={() => gerir(projeto.id, false)}
                      disabled={pendente && idEmAcao === projeto.id}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Remover aprovação
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => gerir(projeto.id, true)}
                      disabled={pendente && idEmAcao === projeto.id}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Aprovar projeto
                    </button>
                  )}
                  {pendente && idEmAcao === projeto.id && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}