"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Plus, MessageSquare, Award, BookOpen, UserCheck, Shield, Sparkles, Loader2 } from "lucide-react";
import { criarGrupoServer, adicionarMembroGrupoServer } from "@/features/academic/actions";

export type ItemGrupo = {
  id: number;
  nomeGrupo: string;
  tipoGrupo: "turma" | "disciplina" | "mentoria" | "trabalho" | "conversa" | string;
  idCriador?: number | null;
  criadorNome?: string;
  totalMembros: number;
  dataCriacao?: string;
  membros?: Array<{
    idUsuario: number;
    nome: string;
    fotoPerfil?: string | null;
    funcao: string;
  }>;
};

interface GruposEMentoriaClientProps {
  grupos: ItemGrupo[];
  usuarioAtual: {
    id: number;
    nome: string;
    papeis: string[];
  };
  mentoresDisponiveis?: Array<{
    id: number;
    nome: string;
    email: string;
    numEstudante?: string | null;
  }>;
}

export function GruposEMentoriaClient({ grupos, usuarioAtual, mentoresDisponiveis = [] }: GruposEMentoriaClientProps) {
  const router = useRouter();
  const [modalAberto, setModalAberto] = useState(false);
  const [nomeGrupo, setNomeGrupo] = useState("");
  const [tipoGrupo, setTipoGrupo] = useState<"turma" | "disciplina" | "mentoria" | "trabalho">("mentoria");
  const [idMentorSelecionado, setIdMentorSelecionado] = useState<number | "">("");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [pendente, iniciarTransicao] = useTransition();

  const criarNovoGrupo = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setSucesso(null);

    if (!nomeGrupo.trim()) {
      setErro("Insira o nome do grupo.");
      return;
    }

    iniciarTransicao(async () => {
      const res = await criarGrupoServer({
        nomeGrupo,
        tipoGrupo,
        idCriador: usuarioAtual.id,
      });

      if (res.error) {
        setErro(res.error);
        return;
      }

      const idGrupoCriado = res.data?.id;

      // Se for grupo de mentoria e um mentor foi selecionado
      if (idGrupoCriado && idMentorSelecionado && Number(idMentorSelecionado) > 0) {
        await adicionarMembroGrupoServer(idGrupoCriado, Number(idMentorSelecionado), "mentor");
      }

      // Adicionar o próprio criador como membro admin
      if (idGrupoCriado) {
        await adicionarMembroGrupoServer(idGrupoCriado, usuarioAtual.id, "admin");
      }

      setSucesso("Grupo criado com sucesso!");
      setNomeGrupo("");
      setIdMentorSelecionado("");
      setModalAberto(false);
      router.refresh();
    });
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case "turma":
        return <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold text-blue-700 border border-blue-200">Turma</span>;
      case "disciplina":
        return <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-extrabold text-purple-700 border border-purple-200">Disciplina</span>;
      case "mentoria":
        return <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-700 border border-emerald-200">Mentoria Académica</span>;
      default:
        return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold text-slate-700 border border-slate-200">Trabalho / Projeto</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Mensagens de Alerta */}
      {sucesso && <p className="rounded-2xl bg-emerald-50 p-4 text-xs font-bold text-emerald-800 border border-emerald-200">{sucesso}</p>}
      {erro && <p className="rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-800 border border-rose-200">{erro}</p>}

      {/* Barra de Ações Superior */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-blue" /> Grupos & Mentoria Académica
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Colabore com a sua turma, interaja na disciplina e receba acompanhamento de mentores dedicados.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalAberto(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-brand-blue-dark"
        >
          <Plus className="h-4 w-4" /> Criar Novo Grupo / Mentoria
        </button>
      </div>

      {/* Lista de Grupos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {grupos.length > 0 ? (
          grupos.map((grupo) => (
            <div key={grupo.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-brand-blue/30 transition">
              <div>
                <div className="flex items-center justify-between gap-2">
                  {getTipoBadge(grupo.tipoGrupo)}
                  <span className="text-[10px] font-bold text-slate-400">{grupo.totalMembros} membro(s)</span>
                </div>
                <h3 className="mt-3 text-base font-extrabold text-slate-900 line-clamp-1">{grupo.nomeGrupo}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Criado por: <strong className="text-slate-700">{grupo.criadorNome || "Universidade Kimpa Vita"}</strong>
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Sparkles className="h-3.5 w-3.5 text-brand-green" /> Chat Ativo
                </div>
                <Link
                  href="/mensagens"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Abrir Chat
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-3 text-sm font-bold text-slate-800">Nenhum grupo registado</h3>
            <p className="mt-1 text-xs text-slate-500">Crie o seu primeiro grupo de mentoria ou trabalho de grupo para começar a colaborar.</p>
          </div>
        )}
      </div>

      {/* Modal de Criação de Grupo */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Criar Novo Grupo</h3>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={criarNovoGrupo} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Nome do Grupo</label>
                <input
                  type="text"
                  placeholder="Ex: Mentoria de Algoritmos 2026"
                  value={nomeGrupo}
                  onChange={(e) => setNomeGrupo(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Tipo de Grupo</label>
                <select
                  value={tipoGrupo}
                  onChange={(e) => setTipoGrupo(e.target.value as any)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="mentoria">Mentoria Académica (Mentor + Alunos)</option>
                  <option value="trabalho">Trabalho de Grupo / Projeto</option>
                  <option value="turma">Grupo de Turma</option>
                  <option value="disciplina">Grupo de Cadeira / Disciplina</option>
                </select>
              </div>

              {tipoGrupo === "mentoria" && mentoresDisponiveis.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-700">Escolher Mentor Designado</label>
                  <select
                    value={idMentorSelecionado}
                    onChange={(e) => setIdMentorSelecionado(e.target.value ? Number(e.target.value) : "")}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none"
                  >
                    <option value="">Selecione um Mentor...</option>
                    {mentoresDisponiveis.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nome} {m.numEstudante ? `(${m.numEstudante})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pendente}
                  className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-blue-dark disabled:opacity-60"
                >
                  {pendente ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Criar Grupo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
