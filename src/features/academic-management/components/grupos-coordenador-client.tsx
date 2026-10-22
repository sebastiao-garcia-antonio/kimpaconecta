"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  GraduationCap,
  MessageSquare,
  Plus,
  Search,
  Trash2,
  Users,
  X,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  criarGrupoCoordenadorServer,
  eliminarGrupoCoordenadorServer,
} from "@/features/academic-management/grupos.actions";

type GrupoDisciplina = { id: number; nome: string; cursoNome: string } | null;
type GrupoTurma = { id: number; nome: string; cursoNome: string } | null;

type Grupo = {
  id: number;
  nomeGrupo: string;
  tipoGrupo: string;
  criadorNome: string;
  totalMembros: number;
  totalMensagens: number;
  disciplina: GrupoDisciplina;
  turma: GrupoTurma;
};

export type TurmaSimples = { id: number; nomeTurma: string; nomeCurso: string };
export type DisciplinaSimplesGrupo = { id: number; nomeDisciplina: string; nomeCurso: string };

interface Props {
  grupos: Grupo[];
  turmas?: TurmaSimples[];
  disciplinas?: DisciplinaSimplesGrupo[];
}

const tipoBadge: Record<string, string> = {
  turma: "bg-blue-50 text-blue-700 border-blue-200",
  disciplina: "bg-purple-50 text-purple-700 border-purple-200",
  mentoria: "bg-emerald-50 text-emerald-700 border-emerald-200",
  trabalho: "bg-amber-50 text-amber-700 border-amber-200",
};

const tipoRotulo: Record<string, string> = {
  turma: "Turma",
  disciplina: "Disciplina",
  mentoria: "Mentoria",
  trabalho: "Trabalho",
};

export function GruposCoordenadorClient({ grupos, turmas = [], disciplinas = [] }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [pesquisa, setPesquisa] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");

  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  // Modal novo grupo
  const [modalNovo, setModalNovo] = useState(false);
  const [nomeGrupo, setNomeGrupo] = useState("");
  const [tipoGrupo, setTipoGrupo] = useState("turma");
  const [idTurmaSel, setIdTurmaSel] = useState("");
  const [idDisciplinaSel, setIdDisciplinaSel] = useState("");

  // Modal confirmar eliminação
  const [modalEliminar, setModalEliminar] = useState<Grupo | null>(null);

  const filtrados = grupos.filter((g) => {
    const termo = pesquisa.toLowerCase();
    const combinaPesquisa =
      !termo ||
      g.nomeGrupo.toLowerCase().includes(termo) ||
      g.criadorNome.toLowerCase().includes(termo) ||
      (g.disciplina?.nome ?? "").toLowerCase().includes(termo) ||
      (g.turma?.nome ?? "").toLowerCase().includes(termo);
    const combinaTipo = filtroTipo === "todos" || g.tipoGrupo === filtroTipo;
    return combinaPesquisa && combinaTipo;
  });

  const submeterNovo = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setMensagem(null);
    startTransition(async () => {
      const res = await criarGrupoCoordenadorServer({
        nomeGrupo,
        tipoGrupo,
        idTurma: idTurmaSel || undefined,
        idDisciplina: idDisciplinaSel || undefined,
      });
      if (res.error) {
        setErro(res.error);
        return;
      }
      setModalNovo(false);
      setNomeGrupo("");
      setTipoGrupo("turma");
      setIdTurmaSel("");
      setIdDisciplinaSel("");
      setMensagem("Grupo criado com sucesso!");
      router.refresh();
    });
  };

  const confirmarEliminar = () => {
    if (!modalEliminar) return;
    setErro(null);
    startTransition(async () => {
      const res = await eliminarGrupoCoordenadorServer(modalEliminar.id);
      if (res.error) {
        setErro(res.error);
        setModalEliminar(null);
        return;
      }
      setModalEliminar(null);
      setMensagem("Grupo eliminado com sucesso.");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {mensagem && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          <span>{mensagem}</span>
          <button onClick={() => setMensagem(null)} className="text-emerald-600 hover:text-emerald-800"><X className="h-4 w-4" /></button>
        </div>
      )}
      {erro && (
        <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
          <span>{erro}</span>
          <button onClick={() => setErro(null)} className="text-rose-600 hover:text-rose-800"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Barra de pesquisa, filtros e botão novo */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar grupo, criador ou disciplina..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-blue focus:bg-white focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 focus:border-brand-blue focus:outline-none"
          >
            <option value="todos">Todos os tipos</option>
            <option value="turma">Turma</option>
            <option value="disciplina">Disciplina</option>
            <option value="mentoria">Mentoria</option>
            <option value="trabalho">Trabalho / Projeto</option>
          </select>
          <button
            type="button"
            onClick={() => { setModalNovo(true); setErro(null); setMensagem(null); }}
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-blue-dark"
          >
            <Plus className="h-4 w-4" /> Novo Grupo
          </button>
        </div>
      </div>

      {/* Grid de grupos */}
      {filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <Users className="h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-sm font-bold text-slate-700">Nenhum grupo encontrado.</h3>
          <p className="mt-1 text-xs text-slate-400">
            Crie o primeiro grupo para organizar os estudantes do seu curso.
          </p>
          <button
            onClick={() => { setModalNovo(true); setErro(null); }}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-brand-blue-dark"
          >
            <Plus className="h-4 w-4" /> Criar primeiro grupo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((grupo) => {
            const badgeClass = tipoBadge[grupo.tipoGrupo] || "bg-slate-100 text-slate-700 border-slate-200";
            const rotulo = tipoRotulo[grupo.tipoGrupo] || grupo.tipoGrupo;

            return (
              <div
                key={grupo.id}
                className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-blue/30 hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${badgeClass}`}>
                      {rotulo}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 font-semibold">
                        {grupo.totalMembros} membro{grupo.totalMembros !== 1 ? "s" : ""}
                      </span>
                      <button
                        onClick={() => setModalEliminar(grupo)}
                        title="Eliminar grupo"
                        className="rounded-xl p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-base font-extrabold text-slate-900 line-clamp-2">{grupo.nomeGrupo}</h4>

                  {grupo.disciplina && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <BookOpen className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                      <span className="font-medium">{grupo.disciplina.nome}</span>
                      <span className="text-slate-300">·</span>
                      <span>{grupo.disciplina.cursoNome}</span>
                    </div>
                  )}

                  {grupo.turma && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <GraduationCap className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span className="font-medium">{grupo.turma.nome}</span>
                      <span className="text-slate-300">·</span>
                      <span>{grupo.turma.cursoNome}</span>
                    </div>
                  )}

                  <p className="text-xs text-slate-400">
                    Criado por: <span className="font-semibold text-slate-600">{grupo.criadorNome}</span>
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs font-semibold text-slate-400">
                    {grupo.totalMensagens} mensagem{grupo.totalMensagens !== 1 ? "s" : ""}
                  </span>
                  <Link
                    href="/mensagens"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Chat
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filtrados.length > 0 && (
        <p className="text-xs text-slate-400 text-right">
          {filtrados.length} grupo{filtrados.length !== 1 ? "s" : ""} encontrado{filtrados.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* ── Modal: Novo Grupo ── */}
      {modalNovo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Novo Grupo</h3>
                  <p className="text-xs text-slate-500">Cria um grupo para o teu curso.</p>
                </div>
              </div>
              <button onClick={() => setModalNovo(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submeterNovo} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Nome do Grupo *
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={nomeGrupo}
                  onChange={(e) => setNomeGrupo(e.target.value)}
                  placeholder="Ex: Turma A - Engenharia Informática"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Tipo de Grupo *
                </label>
                <select
                  required
                  value={tipoGrupo}
                  onChange={(e) => setTipoGrupo(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
                >
                  <option value="turma">Turma</option>
                  <option value="disciplina">Disciplina</option>
                  <option value="mentoria">Mentoria</option>
                  <option value="trabalho">Trabalho / Projeto</option>
                </select>
              </div>

              {turmas.length > 0 && (tipoGrupo === "turma" || tipoGrupo === "mentoria" || tipoGrupo === "trabalho") && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Turma (opcional)
                  </label>
                  <select
                    value={idTurmaSel}
                    onChange={(e) => setIdTurmaSel(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
                  >
                    <option value="">— Nenhuma turma —</option>
                    {turmas.map((t) => (
                      <option key={t.id} value={t.id}>{t.nomeTurma} · {t.nomeCurso}</option>
                    ))}
                  </select>
                </div>
              )}

              {disciplinas.length > 0 && tipoGrupo === "disciplina" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Disciplina (opcional)
                  </label>
                  <select
                    value={idDisciplinaSel}
                    onChange={(e) => setIdDisciplinaSel(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
                  >
                    <option value="">— Nenhuma disciplina —</option>
                    {disciplinas.map((d) => (
                      <option key={d.id} value={d.id}>{d.nomeDisciplina} · {d.nomeCurso}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setModalNovo(false)} className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || !nomeGrupo.trim()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-blue-dark disabled:opacity-60"
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Criar Grupo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Confirmar Eliminação ── */}
      {modalEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Eliminar Grupo</h3>
            </div>

            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Tens a certeza de que queres eliminar o grupo{" "}
              <strong className="text-slate-900">{modalEliminar.nomeGrupo}</strong>?
            </p>
            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-800">
              Todas as mensagens e membros do grupo serão removidos. Esta ação é <strong>irreversível</strong>.
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setModalEliminar(null)} className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminar}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-60"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
