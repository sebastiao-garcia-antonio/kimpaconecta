"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Calendar,
  Layers,
} from "lucide-react";
import {
  guardarDisciplinaServer,
  eliminarDisciplinaServer,
} from "@/features/academic-management/actions";

export type CursoSimples = {
  id: number;
  nomeCurso: string;
};

export type DisciplinaCoordenadorData = {
  id: number;
  idCurso: number;
  nomeDisciplina: string;
  semestre: number;
  curso: {
    id: number;
    nomeCurso: string;
  };
  _count?: {
    avaliacoes?: number;
    materiais?: number;
  };
};

interface GerenciadorDisciplinasCoordenadorProps {
  cursos: CursoSimples[];
  disciplinas: DisciplinaCoordenadorData[];
}

const SEMESTRES = Array.from({ length: 12 }, (_, i) => ({
  valor: i + 1,
  rotulo: `${i + 1}º Semestre`,
}));

export function GerenciadorDisciplinasCoordenador({
  cursos,
  disciplinas,
}: GerenciadorDisciplinasCoordenadorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Filtros
  const [termoBusca, setTermoBusca] = useState("");
  const [cursoSelecionado, setCursoSelecionado] = useState<string>(
    cursos.length === 1 ? String(cursos[0].id) : "todos"
  );
  const [filtroSemestre, setFiltroSemestre] = useState<string>("todos");

  // Notificações
  const [notificacao, setNotificacao] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);

  // Modais de Criação / Edição
  const [modalDisciplina, setModalDisciplina] = useState<{
    aberto: boolean;
    modo: "criar" | "editar";
    dados?: DisciplinaCoordenadorData;
  }>({ aberto: false, modo: "criar" });

  // Modal de Eliminação
  const [modalEliminar, setModalEliminar] = useState<{
    aberto: boolean;
    id: number;
    nome: string;
    detalhes?: string;
  } | null>(null);

  // Campos do Formulário
  const [formIdCurso, setFormIdCurso] = useState("");
  const [formNomeDisciplina, setFormNomeDisciplina] = useState("");
  const [formSemestre, setFormSemestre] = useState("1");

  // Handlers para abrir modais
  const abrirModalCriar = () => {
    const idPadrao = cursoSelecionado !== "todos" ? cursoSelecionado : cursos[0] ? String(cursos[0].id) : "";
    setFormIdCurso(idPadrao);
    setFormNomeDisciplina("");
    setFormSemestre("1");
    setModalDisciplina({ aberto: true, modo: "criar" });
  };

  const abrirModalEditar = (d: DisciplinaCoordenadorData) => {
    setFormIdCurso(String(d.idCurso));
    setFormNomeDisciplina(d.nomeDisciplina);
    setFormSemestre(String(d.semestre));
    setModalDisciplina({ aberto: true, modo: "editar", dados: d });
  };

  // Submissão do Formulário
  const submeterDisciplina = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const id = modalDisciplina.modo === "editar" ? modalDisciplina.dados?.id : null;
      const res = await guardarDisciplinaServer(id, {
        idCurso: formIdCurso,
        nomeDisciplina: formNomeDisciplina,
        semestre: formSemestre,
      });

      if (res.success) {
        setNotificacao({
          tipo: "sucesso",
          texto: modalDisciplina.modo === "editar" ? "Disciplina atualizada com sucesso!" : "Disciplina criada com sucesso!",
        });
        setModalDisciplina({ aberto: false, modo: "criar" });
        router.refresh();
      } else {
        setNotificacao({ tipo: "erro", texto: res.error || "Erro ao guardar disciplina." });
      }
    });
  };

  // Confirmar Eliminação
  const confirmarEliminacao = () => {
    if (!modalEliminar) return;
    startTransition(async () => {
      const res = await eliminarDisciplinaServer(modalEliminar.id);

      if (res.success) {
        setNotificacao({
          tipo: "sucesso",
          texto: "Disciplina eliminada com sucesso!",
        });
        setModalEliminar(null);
        router.refresh();
      } else {
        setNotificacao({ tipo: "erro", texto: res.error || "Não foi possível eliminar a disciplina." });
        setModalEliminar(null);
      }
    });
  };

  // Filtragem
  const disciplinasFiltradas = useMemo(() => {
    return disciplinas.filter((d) => {
      const busca = termoBusca.toLowerCase();
      const matchBusca =
        d.nomeDisciplina.toLowerCase().includes(busca) ||
        d.curso.nomeCurso.toLowerCase().includes(busca);
      const matchCurso = cursoSelecionado === "todos" || String(d.idCurso) === cursoSelecionado;
      const matchSemestre = filtroSemestre === "todos" || String(d.semestre) === filtroSemestre;
      return matchBusca && matchCurso && matchSemestre;
    });
  }, [disciplinas, termoBusca, cursoSelecionado, filtroSemestre]);

  return (
    <div className="space-y-6">
      {/* Toast Notificação */}
      {notificacao && (
        <div
          className={`flex items-center justify-between rounded-2xl p-4 shadow-sm border ${
            notificacao.tipo === "sucesso"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-3">
            {notificacao.tipo === "sucesso" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            )}
            <span className="text-sm font-semibold">{notificacao.texto}</span>
          </div>
          <button
            onClick={() => setNotificacao(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Cartão de Gestão de Disciplinas */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
        {/* Cabeçalho com Filtro de Curso e Botão Novo */}
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/70 p-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-slate-800">Gestão de Disciplinas</h3>
              <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                {disciplinasFiltradas.length} de {disciplinas.length}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Estruture a grade curricular e organize as disciplinas por semestre lectivo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Seletor de Curso */}
            {cursos.length > 1 && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-600">Curso:</label>
                <select
                  value={cursoSelecionado}
                  onChange={(e) => setCursoSelecionado(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:border-brand-blue focus:outline-none"
                >
                  <option value="todos">Todos os Cursos</option>
                  {cursos.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.nomeCurso}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Botão Nova Disciplina */}
            <button
              onClick={abrirModalCriar}
              disabled={cursos.length === 0}
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-blue/90 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              <span>Nova Disciplina</span>
            </button>
          </div>
        </div>

        {/* Barra de Busca e Filtro de Semestre */}
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between px-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              placeholder="Buscar por nome da disciplina..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-xs sm:text-sm text-slate-800 placeholder-slate-400 transition focus:border-brand-blue focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Semestre:</span>
            <select
              value={filtroSemestre}
              onChange={(e) => setFiltroSemestre(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="todos">Todos os Semestres</option>
              {SEMESTRES.map((s) => (
                <option key={s.valor} value={String(s.valor)}>
                  {s.rotulo}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabela de Disciplinas */}
        <div className="p-6">
          {disciplinasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-slate-300" />
              <h4 className="mt-3 text-base font-bold text-slate-700">Nenhuma disciplina encontrada</h4>
              <p className="mt-1 text-xs text-slate-400">
                {termoBusca || cursoSelecionado !== "todos" || filtroSemestre !== "todos"
                  ? "Tente ajustar os filtros de pesquisa."
                  : "Cadastre a primeira disciplina do curso para estruturar o plano curricular."}
              </p>
              {!termoBusca && cursos.length > 0 && (
                <button
                  onClick={abrirModalCriar}
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-4 py-2 text-xs font-bold text-white shadow-xs"
                >
                  <Plus className="h-4 w-4" /> Criar Disciplina
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="pb-3 pl-2">Nome da Disciplina</th>
                    <th className="pb-3">Curso</th>
                    <th className="pb-3">Semestre Curricular</th>
                    <th className="pb-3 text-right pr-2">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {disciplinasFiltradas.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 pl-2 font-bold text-slate-800">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 shrink-0">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <span className="text-slate-900 font-semibold">{d.nomeDisciplina}</span>
                        </div>
                      </td>
                      <td className="py-4 font-medium text-slate-700">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-slate-400 shrink-0" />
                          <span>{d.curso.nomeCurso}</span>
                        </div>
                      </td>
                      <td className="py-4 text-slate-600">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                          <Calendar className="h-3 w-3 text-slate-500" />
                          {d.semestre}º Semestre
                        </span>
                      </td>
                      <td className="py-4 text-right pr-2">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => abrirModalEditar(d)}
                            title="Editar Disciplina"
                            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-brand-blue"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              setModalEliminar({
                                    aberto: true,
                                    id: d.id,
                                    nome: `${d.nomeDisciplina} (${d.curso.nomeCurso})`,
                                    detalhes:
                                      d._count?.avaliacoes || d._count?.materiais
                                        ? `Atenção: esta disciplina possui registos associados no sistema.`
                                        : undefined,
                                  })
                            }
                            title="Eliminar Disciplina"
                            className="rounded-xl p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ────────────────── MODAIS ────────────────── */}

      {/* MODAL DISCIPLINA (CRIAR / EDITAR) — SEM CAMPO DE FACULDADE */}
      {modalDisciplina.aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {modalDisciplina.modo === "editar" ? "Editar Disciplina" : "Nova Disciplina"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Insira a disciplina no curso e defina o semestre correspondente.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalDisciplina({ aberto: false, modo: "criar" })}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submeterDisciplina} className="mt-5 space-y-4">
              {/* Seleção do Curso */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Curso *
                </label>
                <select
                  required
                  value={formIdCurso}
                  onChange={(e) => setFormIdCurso(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
                >
                  <option value="">Selecione o curso...</option>
                  {cursos.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.nomeCurso}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nome da Disciplina */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Nome da Disciplina *
                </label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  value={formNomeDisciplina}
                  onChange={(e) => setFormNomeDisciplina(e.target.value)}
                  placeholder="Ex: Algoritmos e Estruturas de Dados, Cálculo I, Microeconomia"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
                />
              </div>

              {/* Semestre */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Semestre Curricular *
                </label>
                <select
                  required
                  value={formSemestre}
                  onChange={(e) => setFormSemestre(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
                >
                  {SEMESTRES.map((s) => (
                    <option key={s.valor} value={String(s.valor)}>
                      {s.rotulo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalDisciplina({ aberto: false, modo: "criar" })}
                  className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-blue/90 disabled:opacity-60"
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{modalDisciplina.modo === "editar" ? "Salvar Alterações" : "Cadastrar Disciplina"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAÇÃO DE ELIMINAÇÃO */}
      {modalEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Eliminar Disciplina</h3>
            </div>

            <p className="mt-3 text-sm text-slate-600">
              Tem a certeza de que deseja eliminar a disciplina{" "}
              <strong className="text-slate-900 font-bold">&quot;{modalEliminar.nome}&quot;</strong>?
            </p>

            {modalEliminar.detalhes && (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-800 leading-relaxed">
                {modalEliminar.detalhes}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalEliminar(null)}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminacao}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-60"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Eliminar Definitivamente</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
