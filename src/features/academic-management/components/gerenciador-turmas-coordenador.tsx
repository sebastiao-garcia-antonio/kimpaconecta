"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
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
  Clock,
} from "lucide-react";
import {
  guardarTurmaServer,
  eliminarTurmaServer,
} from "@/features/academic-management/actions";

export type CursoSimples = {
  id: number;
  nomeCurso: string;
};

export type TurmaCoordenadorData = {
  id: number;
  idCurso: number;
  nomeTurma: string;
  anoCurricular: number;
  periodo: string;
  curso: {
    id: number;
    nomeCurso: string;
  };
  _count?: {
    matriculas: number;
  };
};

interface GerenciadorTurmasCoordenadorProps {
  cursos: CursoSimples[];
  turmas: TurmaCoordenadorData[];
}

const PERIODOS = ["Manhã", "Tarde", "Pós-laboral"];
const ANOS_CURRICULARES = [
  { valor: 1, rotulo: "1º Ano" },
  { valor: 2, rotulo: "2º Ano" },
  { valor: 3, rotulo: "3º Ano" },
  { valor: 4, rotulo: "4º Ano" },
  { valor: 5, rotulo: "5º Ano" },
  { valor: 6, rotulo: "6º Ano" },
];

export function GerenciadorTurmasCoordenador({
  cursos,
  turmas,
}: GerenciadorTurmasCoordenadorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Filtros
  const [termoBusca, setTermoBusca] = useState("");
  const [cursoSelecionado, setCursoSelecionado] = useState<string>(
    cursos.length === 1 ? String(cursos[0].id) : "todos"
  );
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>("todos");

  // Notificações
  const [notificacao, setNotificacao] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);

  // Modais de Criação / Edição
  const [modalTurma, setModalTurma] = useState<{
    aberto: boolean;
    modo: "criar" | "editar";
    dados?: TurmaCoordenadorData;
  }>({ aberto: false, modo: "criar" });

  // Modal de Eliminação
  const [modalEliminar, setModalEliminar] = useState<{
    aberto: boolean;
    id: number;
    nome: string;
    detalhes?: string;
  } | null>(null);

  // Campos do Formulário do Modal
  const [formIdCurso, setFormIdCurso] = useState("");
  const [formNomeTurma, setFormNomeTurma] = useState("");
  const [formAnoCurricular, setFormAnoCurricular] = useState("1");
  const [formPeriodo, setFormPeriodo] = useState(PERIODOS[0]);

  // Handlers para abrir modais
  const abrirModalCriar = () => {
    // Se estiver filtrado por um curso específico, pré-seleciona
    const idPadrao = cursoSelecionado !== "todos" ? cursoSelecionado : cursos[0] ? String(cursos[0].id) : "";
    setFormIdCurso(idPadrao);
    setFormNomeTurma("");
    setFormAnoCurricular("1");
    setFormPeriodo(PERIODOS[0]);
    setModalTurma({ aberto: true, modo: "criar" });
  };

  const abrirModalEditar = (t: TurmaCoordenadorData) => {
    setFormIdCurso(String(t.idCurso));
    setFormNomeTurma(t.nomeTurma);
    setFormAnoCurricular(String(t.anoCurricular));
    setFormPeriodo(t.periodo);
    setModalTurma({ aberto: true, modo: "editar", dados: t });
  };

  // Submissão do Formulário
  const submeterTurma = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const id = modalTurma.modo === "editar" ? modalTurma.dados?.id : null;
      const res = await guardarTurmaServer(id, {
        idCurso: formIdCurso,
        nomeTurma: formNomeTurma,
        anoCurricular: formAnoCurricular,
        periodo: formPeriodo,
      });

      if (res.success) {
        setNotificacao({
          tipo: "sucesso",
          texto: modalTurma.modo === "editar" ? "Turma atualizada com sucesso!" : "Turma criada com sucesso!",
        });
        setModalTurma({ aberto: false, modo: "criar" });
        router.refresh();
      } else {
        setNotificacao({ tipo: "erro", texto: res.error || "Erro ao guardar turma." });
      }
    });
  };

  // Confirmar Eliminação
  const confirmarEliminacao = () => {
    if (!modalEliminar) return;
    startTransition(async () => {
      const res = await eliminarTurmaServer(modalEliminar.id);

      if (res.success) {
        setNotificacao({
          tipo: "sucesso",
          texto: "Turma eliminada com sucesso!",
        });
        setModalEliminar(null);
        router.refresh();
      } else {
        setNotificacao({ tipo: "erro", texto: res.error || "Não foi possível eliminar a turma." });
        setModalEliminar(null);
      }
    });
  };

  // Filtragem
  const turmasFiltradas = useMemo(() => {
    return turmas.filter((t) => {
      const busca = termoBusca.toLowerCase();
      const matchBusca =
        t.nomeTurma.toLowerCase().includes(busca) ||
        t.curso.nomeCurso.toLowerCase().includes(busca) ||
        t.periodo.toLowerCase().includes(busca);
      const matchCurso = cursoSelecionado === "todos" || String(t.idCurso) === cursoSelecionado;
      const matchPeriodo = filtroPeriodo === "todos" || t.periodo === filtroPeriodo;
      return matchBusca && matchCurso && matchPeriodo;
    });
  }, [turmas, termoBusca, cursoSelecionado, filtroPeriodo]);

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

      {/* Cartão de Gestão de Turmas */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
        {/* Cabeçalho de Ações e Filtro de Curso */}
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/70 p-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-slate-800">Gestão de Turmas</h3>
              <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                {turmasFiltradas.length} de {turmas.length}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Crie, edite e acompanhe as turmas curriculares dos cursos sob a sua coordenação.
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

            {/* Botão Nova Turma */}
            <button
              onClick={abrirModalCriar}
              disabled={cursos.length === 0}
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-blue/90 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              <span>Nova Turma</span>
            </button>
          </div>
        </div>

        {/* Barra de Busca e Filtro de Turno */}
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between px-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              placeholder="Buscar por código de turma ou período..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-xs sm:text-sm text-slate-800 placeholder-slate-400 transition focus:border-brand-blue focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Turno:</span>
            <select
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="todos">Todos os Turnos</option>
              {PERIODOS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabela de Turmas */}
        <div className="p-6">
          {turmasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-slate-300" />
              <h4 className="mt-3 text-base font-bold text-slate-700">Nenhuma turma encontrada</h4>
              <p className="mt-1 text-xs text-slate-400">
                {termoBusca || cursoSelecionado !== "todos" || filtroPeriodo !== "todos"
                  ? "Tente ajustar os filtros de pesquisa."
                  : "Cadastre a primeira turma do curso para iniciar as matrículas."}
              </p>
              {!termoBusca && cursos.length > 0 && (
                <button
                  onClick={abrirModalCriar}
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-4 py-2 text-xs font-bold text-white shadow-xs"
                >
                  <Plus className="h-4 w-4" /> Criar Turma
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="pb-3 pl-2">Código / Turma</th>
                    <th className="pb-3">Curso</th>
                    <th className="pb-3">Ano Curricular</th>
                    <th className="pb-3">Período / Turno</th>
                    <th className="pb-3 text-center">Estudantes</th>
                    <th className="pb-3 text-right pr-2">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {turmasFiltradas.map((t) => {
                    const totalMatriculas = t._count?.matriculas ?? 0;
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 pl-2 font-extrabold text-slate-800">
                          <span className="rounded-xl bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-bold text-brand-blue">
                            {t.nomeTurma}
                          </span>
                        </td>
                        <td className="py-4 font-bold text-slate-700">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-slate-400 shrink-0" />
                            <span>{t.curso.nomeCurso}</span>
                          </div>
                        </td>
                        <td className="py-4 text-slate-600">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {t.anoCurricular}º Ano
                          </span>
                        </td>
                        <td className="py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              t.periodo === "Manhã"
                                ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                                : t.periodo === "Tarde"
                                ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                                : "bg-purple-50 text-purple-700 border border-purple-200/60"
                            }`}
                          >
                            <Clock className="h-3 w-3" />
                            {t.periodo}
                          </span>
                        </td>
                        <td className="py-4 text-center">
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                            {totalMatriculas} estudante(s)
                          </span>
                        </td>
                        <td className="py-4 text-right pr-2">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => abrirModalEditar(t)}
                              title="Editar Turma"
                              className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-brand-blue"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                setModalEliminar({
                                  aberto: true,
                                  id: t.id,
                                  nome: `${t.nomeTurma} (${t.curso.nomeCurso})`,
                                  detalhes:
                                    totalMatriculas > 0
                                      ? `Atenção: esta turma possui ${totalMatriculas} estudante(s) matriculado(s). Não poderá ser eliminada enquanto existirem matrículas ativas.`
                                      : undefined,
                                })
                              }
                              title="Eliminar Turma"
                              className="rounded-xl p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ────────────────── MODAIS ────────────────── */}

      {/* MODAL TURMA (CRIAR / EDITAR) — SEM CAMPO DE FACULDADE */}
      {modalTurma.aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {modalTurma.modo === "editar" ? "Editar Turma" : "Nova Turma"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Preencha os dados curriculares da turma para o seu curso.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalTurma({ aberto: false, modo: "criar" })}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submeterTurma} className="mt-5 space-y-4">
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

              {/* Nome/Código da Turma */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Código / Nome da Turma *
                </label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={formNomeTurma}
                  onChange={(e) => setFormNomeTurma(e.target.value)}
                  placeholder="Ex: ECO-M1, INF-T2, DIR-PL"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Ano Curricular *
                  </label>
                  <select
                    required
                    value={formAnoCurricular}
                    onChange={(e) => setFormAnoCurricular(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
                  >
                    {ANOS_CURRICULARES.map((ano) => (
                      <option key={ano.valor} value={String(ano.valor)}>
                        {ano.rotulo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Período / Turno *
                  </label>
                  <select
                    required
                    value={formPeriodo}
                    onChange={(e) => setFormPeriodo(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
                  >
                    {PERIODOS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalTurma({ aberto: false, modo: "criar" })}
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
                  <span>{modalTurma.modo === "editar" ? "Salvar Alterações" : "Cadastrar Turma"}</span>
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
              <h3 className="text-lg font-black text-slate-900">Eliminar Turma</h3>
            </div>

            <p className="mt-3 text-sm text-slate-600">
              Tem a certeza de que deseja eliminar a turma{" "}
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
