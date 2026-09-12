"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  GraduationCap,
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
  MapPin,
  BookOpen,
  UserCheck,
} from "lucide-react";
import {
  guardarUnidadeOrganicaServer,
  eliminarUnidadeOrganicaServer,
  guardarCursoServer,
  eliminarCursoServer,
  guardarTurmaServer,
  eliminarTurmaServer,
} from "@/features/academic-management/actions";

export type UnidadeData = {
  id: number;
  nomeUo: string;
  sigla: string;
  localizacao: string | null;
  _count?: { cursos: number };
};

export type CoordenadorData = {
  id: number;
  nome: string;
  email?: string;
};

export type CursoData = {
  id: number;
  idUo: number;
  nomeCurso: string;
  idCoordenador: number | null;
  unidade?: { id: number; nomeUo: string; sigla: string };
  coordenador?: { id: number; nome: string } | null;
  _count?: { turmas: number; disciplinas: number };
};

export type TurmaData = {
  id: number;
  idCurso: number;
  nomeTurma: string;
  anoCurricular: number;
  periodo: string;
  curso?: {
    id: number;
    nomeCurso: string;
    unidade?: { id: number; sigla: string; nomeUo: string };
  };
  _count?: { matriculas: number };
};

interface GerenciadorAcademicoTabsProps {
  unidades: UnidadeData[];
  cursos: CursoData[];
  turmas: TurmaData[];
  coordenadores: CoordenadorData[];
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

export function GerenciadorAcademicoTabs({
  unidades,
  cursos,
  turmas,
  coordenadores,
}: GerenciadorAcademicoTabsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Aba ativa: 'unidades' | 'cursos' | 'turmas'
  const [abaAtiva, setAbaAtiva] = useState<"unidades" | "cursos" | "turmas">("unidades");

  // Filtros de busca
  const [termoBusca, setTermoBusca] = useState("");
  const [filtroUnidade, setFiltroUnidade] = useState<string>("todas");
  const [filtroCurso, setFiltroCurso] = useState<string>("todos");

  // Notificações
  const [notificacao, setNotificacao] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);

  // Modais de Cadastro / Edição
  const [modalUnidade, setModalUnidade] = useState<{
    aberto: boolean;
    modo: "criar" | "editar";
    dados?: UnidadeData;
  }>({ aberto: false, modo: "criar" });

  const [modalCurso, setModalCurso] = useState<{
    aberto: boolean;
    modo: "criar" | "editar";
    dados?: CursoData;
  }>({ aberto: false, modo: "criar" });

  const [modalTurma, setModalTurma] = useState<{
    aberto: boolean;
    modo: "criar" | "editar";
    dados?: TurmaData;
  }>({ aberto: false, modo: "criar" });

  // Modal de Eliminação
  const [modalEliminar, setModalEliminar] = useState<{
    aberto: boolean;
    tipo: "unidade" | "curso" | "turma";
    id: number;
    nome: string;
    detalhes?: string;
  } | null>(null);

  // Estados dos formulários de modais
  // Formulário Unidade
  const [formUoNome, setFormUoNome] = useState("");
  const [formUoSigla, setFormUoSigla] = useState("");
  const [formUoLocalizacao, setFormUoLocalizacao] = useState("");

  // Formulário Curso
  const [formCursoNome, setFormCursoNome] = useState("");
  const [formCursoIdUo, setFormCursoIdUo] = useState("");
  const [formCursoIdCoordenador, setFormCursoIdCoordenador] = useState("");

  // Formulário Turma
  const [formTurmaNome, setFormTurmaNome] = useState("");
  const [formTurmaIdCurso, setFormTurmaIdCurso] = useState("");
  const [formTurmaAno, setFormTurmaAno] = useState("1");
  const [formTurmaPeriodo, setFormTurmaPeriodo] = useState(PERIODOS[0]);

  // Handlers para abrir modais
  const abrirModalUnidadeCriar = () => {
    setFormUoNome("");
    setFormUoSigla("");
    setFormUoLocalizacao("");
    setModalUnidade({ aberto: true, modo: "criar" });
  };

  const abrirModalUnidadeEditar = (item: UnidadeData) => {
    setFormUoNome(item.nomeUo);
    setFormUoSigla(item.sigla);
    setFormUoLocalizacao(item.localizacao || "");
    setModalUnidade({ aberto: true, modo: "editar", dados: item });
  };

  const abrirModalCursoCriar = () => {
    setFormCursoNome("");
    setFormCursoIdUo(unidades[0] ? String(unidades[0].id) : "");
    setFormCursoIdCoordenador("");
    setModalCurso({ aberto: true, modo: "criar" });
  };

  const abrirModalCursoEditar = (item: CursoData) => {
    setFormCursoNome(item.nomeCurso);
    setFormCursoIdUo(String(item.idUo));
    setFormCursoIdCoordenador(item.idCoordenador ? String(item.idCoordenador) : "");
    setModalCurso({ aberto: true, modo: "editar", dados: item });
  };

  const abrirModalTurmaCriar = () => {
    setFormTurmaNome("");
    setFormTurmaIdCurso(cursos[0] ? String(cursos[0].id) : "");
    setFormTurmaAno("1");
    setFormTurmaPeriodo(PERIODOS[0]);
    setModalTurma({ aberto: true, modo: "criar" });
  };

  const abrirModalTurmaEditar = (item: TurmaData) => {
    setFormTurmaNome(item.nomeTurma);
    setFormTurmaIdCurso(String(item.idCurso));
    setFormTurmaAno(String(item.anoCurricular));
    setFormTurmaPeriodo(item.periodo);
    setModalTurma({ aberto: true, modo: "editar", dados: item });
  };

  // Submissão Unidade
  const submeterUnidade = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const id = modalUnidade.modo === "editar" ? modalUnidade.dados?.id : null;
      const res = await guardarUnidadeOrganicaServer(id, {
        nomeUo: formUoNome,
        sigla: formUoSigla,
        localizacao: formUoLocalizacao,
      });

      if (res.success) {
        setNotificacao({
          tipo: "sucesso",
          texto: modalUnidade.modo === "editar" ? "Unidade académica atualizada!" : "Unidade académica cadastrada!",
        });
        setModalUnidade({ aberto: false, modo: "criar" });
        router.refresh();
      } else {
        setNotificacao({ tipo: "erro", texto: res.error || "Erro ao guardar unidade." });
      }
    });
  };

  // Submissão Curso
  const submeterCurso = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const id = modalCurso.modo === "editar" ? modalCurso.dados?.id : null;
      const res = await guardarCursoServer(id, {
        idUo: formCursoIdUo,
        nomeCurso: formCursoNome,
        idCoordenador: formCursoIdCoordenador || null,
      });

      if (res.success) {
        setNotificacao({
          tipo: "sucesso",
          texto: modalCurso.modo === "editar" ? "Curso atualizado com sucesso!" : "Curso cadastrado com sucesso!",
        });
        setModalCurso({ aberto: false, modo: "criar" });
        router.refresh();
      } else {
        setNotificacao({ tipo: "erro", texto: res.error || "Erro ao guardar curso." });
      }
    });
  };

  // Submissão Turma
  const submeterTurma = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const id = modalTurma.modo === "editar" ? modalTurma.dados?.id : null;
      const res = await guardarTurmaServer(id, {
        idCurso: formTurmaIdCurso,
        nomeTurma: formTurmaNome,
        anoCurricular: formTurmaAno,
        periodo: formTurmaPeriodo,
      });

      if (res.success) {
        setNotificacao({
          tipo: "sucesso",
          texto: modalTurma.modo === "editar" ? "Turma atualizada com sucesso!" : "Turma cadastrada com sucesso!",
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
      let res;
      if (modalEliminar.tipo === "unidade") {
        res = await eliminarUnidadeOrganicaServer(modalEliminar.id);
      } else if (modalEliminar.tipo === "curso") {
        res = await eliminarCursoServer(modalEliminar.id);
      } else {
        res = await eliminarTurmaServer(modalEliminar.id);
      }

      if (res.success) {
        setNotificacao({
          tipo: "sucesso",
          texto: `${modalEliminar.tipo === "unidade" ? "Unidade" : modalEliminar.tipo === "curso" ? "Curso" : "Turma"} eliminada com sucesso!`,
        });
        setModalEliminar(null);
        router.refresh();
      } else {
        setNotificacao({ tipo: "erro", texto: res.error || "Não foi possível eliminar o registo." });
        setModalEliminar(null);
      }
    });
  };

  // Filtragem de dados
  const unidadesFiltradas = useMemo(() => {
    return unidades.filter((u) => {
      const busca = termoBusca.toLowerCase();
      return (
        u.nomeUo.toLowerCase().includes(busca) ||
        u.sigla.toLowerCase().includes(busca) ||
        (u.localizacao && u.localizacao.toLowerCase().includes(busca))
      );
    });
  }, [unidades, termoBusca]);

  const cursosFiltrados = useMemo(() => {
    return cursos.filter((c) => {
      const busca = termoBusca.toLowerCase();
      const matchBusca =
        c.nomeCurso.toLowerCase().includes(busca) ||
        (c.unidade && c.unidade.sigla.toLowerCase().includes(busca)) ||
        (c.coordenador && c.coordenador.nome.toLowerCase().includes(busca));
      const matchUnidade = filtroUnidade === "todas" || String(c.idUo) === filtroUnidade;
      return matchBusca && matchUnidade;
    });
  }, [cursos, termoBusca, filtroUnidade]);

  const turmasFiltradas = useMemo(() => {
    return turmas.filter((t) => {
      const busca = termoBusca.toLowerCase();
      const matchBusca =
        t.nomeTurma.toLowerCase().includes(busca) ||
        (t.curso && t.curso.nomeCurso.toLowerCase().includes(busca)) ||
        t.periodo.toLowerCase().includes(busca);
      const matchCurso = filtroCurso === "todos" || String(t.idCurso) === filtroCurso;
      return matchBusca && matchCurso;
    });
  }, [turmas, termoBusca, filtroCurso]);

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

      {/* Cartão Principal com Abas */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
        {/* Barra de Abas */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-slate-50/70 px-6 py-4 gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Aba Unidades */}
            <button
              onClick={() => {
                setAbaAtiva("unidades");
                setTermoBusca("");
              }}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all ${
                abaAtiva === "unidades"
                  ? "bg-white text-brand-blue shadow-sm border border-slate-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>Unidades Académicas</span>
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  abaAtiva === "unidades"
                    ? "bg-brand-blue/10 text-brand-blue"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {unidades.length}
              </span>
            </button>

            {/* Aba Cursos */}
            <button
              onClick={() => {
                setAbaAtiva("cursos");
                setTermoBusca("");
              }}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all ${
                abaAtiva === "cursos"
                  ? "bg-white text-brand-blue shadow-sm border border-slate-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              <span>Cursos</span>
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  abaAtiva === "cursos"
                    ? "bg-brand-blue/10 text-brand-blue"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {cursos.length}
              </span>
            </button>

            {/* Aba Turmas */}
            <button
              onClick={() => {
                setAbaAtiva("turmas");
                setTermoBusca("");
              }}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all ${
                abaAtiva === "turmas"
                  ? "bg-white text-brand-blue shadow-sm border border-slate-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Turmas</span>
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  abaAtiva === "turmas"
                    ? "bg-brand-blue/10 text-brand-blue"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {turmas.length}
              </span>
            </button>
          </div>

          {/* Botão Novo de Acordo com a Aba Ativa */}
          <div>
            {abaAtiva === "unidades" && (
              <button
                onClick={abrirModalUnidadeCriar}
                className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-blue/90"
              >
                <Plus className="h-4 w-4" />
                <span>Nova Unidade</span>
              </button>
            )}
            {abaAtiva === "cursos" && (
              <button
                onClick={abrirModalCursoCriar}
                disabled={unidades.length === 0}
                className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-blue/90 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                <span>Novo Curso</span>
              </button>
            )}
            {abaAtiva === "turmas" && (
              <button
                onClick={abrirModalTurmaCriar}
                disabled={cursos.length === 0}
                className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-blue/90 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                <span>Nova Turma</span>
              </button>
            )}
          </div>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between px-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              placeholder={
                abaAtiva === "unidades"
                  ? "Buscar por nome, sigla ou localização..."
                  : abaAtiva === "cursos"
                  ? "Buscar por nome do curso ou coordenador..."
                  : "Buscar por nome da turma ou período..."
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 transition focus:border-brand-blue focus:bg-white focus:outline-none"
            />
          </div>

          {/* Filtros secundários contextuais */}
          {abaAtiva === "cursos" && unidades.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Unidade:</span>
              <select
                value={filtroUnidade}
                onChange={(e) => setFiltroUnidade(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none"
              >
                <option value="todas">Todas as Unidades</option>
                {unidades.map((u) => (
                  <option key={u.id} value={String(u.id)}>
                    {u.sigla} · {u.nomeUo}
                  </option>
                ))}
              </select>
            </div>
          )}

          {abaAtiva === "turmas" && cursos.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Curso:</span>
              <select
                value={filtroCurso}
                onChange={(e) => setFiltroCurso(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none"
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
        </div>

        {/* CONTEÚDO DA ABA: 1. UNIDADES ACADÉMICAS */}
        {abaAtiva === "unidades" && (
          <div className="p-6">
            {unidadesFiltradas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 className="h-12 w-12 text-slate-300" />
                <h4 className="mt-3 text-base font-bold text-slate-700">Nenhuma unidade encontrada</h4>
                <p className="mt-1 text-xs text-slate-400">
                  {termoBusca ? "Tente ajustar o termo de pesquisa." : "Cadastre a primeira unidade académica para começar."}
                </p>
                {!termoBusca && (
                  <button
                    onClick={abrirModalUnidadeCriar}
                    className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-4 py-2 text-xs font-bold text-white shadow-xs"
                  >
                    <Plus className="h-4 w-4" /> Criar Unidade
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="pb-3 pl-2">Sigla</th>
                      <th className="pb-3">Nome da Unidade Orgânica</th>
                      <th className="pb-3">Localização</th>
                      <th className="pb-3 text-center">Cursos</th>
                      <th className="pb-3 text-right pr-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {unidadesFiltradas.map((u) => {
                      const totalCursos = u._count?.cursos ?? cursos.filter((c) => c.idUo === u.id).length;
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 pl-2 font-black text-brand-blue">
                            <span className="rounded-lg bg-brand-blue/10 px-2.5 py-1 text-xs font-extrabold text-brand-blue">
                              {u.sigla}
                            </span>
                          </td>
                          <td className="py-4 font-bold text-slate-800">{u.nomeUo}</td>
                          <td className="py-4 text-slate-600">
                            {u.localizacao ? (
                              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                                <MapPin className="h-3.5 w-3.5 text-slate-400" /> {u.localizacao}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">Não especificada</span>
                            )}
                          </td>
                          <td className="py-4 text-center">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                              {totalCursos} curso(s)
                            </span>
                          </td>
                          <td className="py-4 text-right pr-2">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => abrirModalUnidadeEditar(u)}
                                title="Editar Unidade"
                                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-brand-blue"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() =>
                                  setModalEliminar({
                                    aberto: true,
                                    tipo: "unidade",
                                    id: u.id,
                                    nome: `${u.sigla} · ${u.nomeUo}`,
                                    detalhes:
                                      totalCursos > 0
                                        ? `Atenção: esta unidade possui ${totalCursos} curso(s) vinculado(s). Não poderá ser eliminada enquanto houver cursos associados.`
                                        : undefined,
                                  })
                                }
                                title="Eliminar Unidade"
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
        )}

        {/* CONTEÚDO DA ABA: 2. CURSOS */}
        {abaAtiva === "cursos" && (
          <div className="p-6">
            {cursosFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <GraduationCap className="h-12 w-12 text-slate-300" />
                <h4 className="mt-3 text-base font-bold text-slate-700">Nenhum curso encontrado</h4>
                <p className="mt-1 text-xs text-slate-400">
                  {termoBusca || filtroUnidade !== "todas"
                    ? "Tente ajustar os filtros de pesquisa."
                    : "Cadastre o primeiro curso associado a uma unidade."}
                </p>
                {!termoBusca && filtroUnidade === "todas" && (
                  <button
                    onClick={abrirModalCursoCriar}
                    disabled={unidades.length === 0}
                    className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-4 py-2 text-xs font-bold text-white shadow-xs disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" /> Criar Curso
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="pb-3 pl-2">Nome do Curso</th>
                      <th className="pb-3">Unidade Orgânica</th>
                      <th className="pb-3">Coordenador</th>
                      <th className="pb-3 text-center">Turmas</th>
                      <th className="pb-3 text-center">Disciplinas</th>
                      <th className="pb-3 text-right pr-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {cursosFiltrados.map((c) => {
                      const totalTurmas = c._count?.turmas ?? turmas.filter((t) => t.idCurso === c.id).length;
                      const totalDisciplinas = c._count?.disciplinas ?? 0;
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 pl-2 font-bold text-slate-800">
                            <div className="flex items-center gap-2">
                              <GraduationCap className="h-4 w-4 text-brand-blue shrink-0" />
                              <span>{c.nomeCurso}</span>
                            </div>
                          </td>
                          <td className="py-4 text-slate-600">
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                              {c.unidade?.sigla || "—"}
                            </span>
                            <span className="ml-2 text-xs text-slate-500 hidden md:inline">
                              {c.unidade?.nomeUo}
                            </span>
                          </td>
                          <td className="py-4 text-slate-700">
                            {c.coordenador ? (
                              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800">
                                <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                                <span>{c.coordenador.nome}</span>
                              </div>
                            ) : (
                              <span className="text-xs italic text-slate-400">Sem coordenador</span>
                            )}
                          </td>
                          <td className="py-4 text-center">
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                              {totalTurmas}
                            </span>
                          </td>
                          <td className="py-4 text-center">
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                              {totalDisciplinas}
                            </span>
                          </td>
                          <td className="py-4 text-right pr-2">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => abrirModalCursoEditar(c)}
                                title="Editar Curso"
                                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-brand-blue"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() =>
                                  setModalEliminar({
                                    aberto: true,
                                    tipo: "curso",
                                    id: c.id,
                                    nome: c.nomeCurso,
                                    detalhes:
                                      totalTurmas > 0 || totalDisciplinas > 0
                                        ? `Possui ${totalTurmas} turma(s) e ${totalDisciplinas} disciplina(s) vinculada(s).`
                                        : undefined,
                                  })
                                }
                                title="Eliminar Curso"
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
        )}

        {/* CONTEÚDO DA ABA: 3. TURMAS */}
        {abaAtiva === "turmas" && (
          <div className="p-6">
            {turmasFiltradas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-slate-300" />
                <h4 className="mt-3 text-base font-bold text-slate-700">Nenhuma turma encontrada</h4>
                <p className="mt-1 text-xs text-slate-400">
                  {termoBusca || filtroCurso !== "todos"
                    ? "Tente ajustar os filtros de pesquisa."
                    : "Cadastre a primeira turma para associar estudantes."}
                </p>
                {!termoBusca && filtroCurso === "todos" && (
                  <button
                    onClick={abrirModalTurmaCriar}
                    disabled={cursos.length === 0}
                    className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-4 py-2 text-xs font-bold text-white shadow-xs disabled:opacity-50"
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
                      <th className="pb-3 pl-2">Turma</th>
                      <th className="pb-3">Curso</th>
                      <th className="pb-3">Ano Curricular</th>
                      <th className="pb-3">Período</th>
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
                            <span className="rounded-lg bg-blue-50 border border-blue-100 px-2.5 py-1 text-xs font-bold text-brand-blue">
                              {t.nomeTurma}
                            </span>
                          </td>
                          <td className="py-4 font-semibold text-slate-700">
                            {t.curso?.nomeCurso || "Curso não identificado"}
                            {t.curso?.unidade && (
                              <span className="ml-2 text-xs text-slate-400 font-normal">
                                ({t.curso.unidade.sigla})
                              </span>
                            )}
                          </td>
                          <td className="py-4 text-slate-600">
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                              {t.anoCurricular}º Ano
                            </span>
                          </td>
                          <td className="py-4">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                t.periodo === "Manhã"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                                  : t.periodo === "Tarde"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                                  : "bg-purple-50 text-purple-700 border border-purple-200/60"
                              }`}
                            >
                              {t.periodo}
                            </span>
                          </td>
                          <td className="py-4 text-center">
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                              {totalMatriculas}
                            </span>
                          </td>
                          <td className="py-4 text-right pr-2">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => abrirModalTurmaEditar(t)}
                                title="Editar Turma"
                                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-brand-blue"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() =>
                                  setModalEliminar({
                                    aberto: true,
                                    tipo: "turma",
                                    id: t.id,
                                    nome: `${t.nomeTurma} (${t.curso?.nomeCurso || ""})`,
                                    detalhes:
                                      totalMatriculas > 0
                                        ? `Atenção: esta turma possui ${totalMatriculas} estudante(s) matriculado(s).`
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
        )}
      </div>

      {/* ────────────────── MODAIS ────────────────── */}

      {/* MODAL 1: UNIDADE ORGÂNICA (CRIAR / EDITAR) */}
      {modalUnidade.aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {modalUnidade.modo === "editar" ? "Editar Unidade Académica" : "Nova Unidade Académica"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Faculdade, Instituto Superior ou Escola da Universidade.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalUnidade({ aberto: false, modo: "criar" })}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submeterUnidade} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Nome da Unidade Orgânica *
                </label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  value={formUoNome}
                  onChange={(e) => setFormUoNome(e.target.value)}
                  placeholder="Ex: Faculdade de Economia"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Sigla Oficial *
                </label>
                <input
                  type="text"
                  required
                  maxLength={20}
                  value={formUoSigla}
                  onChange={(e) => setFormUoSigla(e.target.value)}
                  placeholder="Ex: FE, ISCED, FCSA"
                  className="w-full uppercase rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Localização / Campus (Opcional)
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={formUoLocalizacao}
                  onChange={(e) => setFormUoLocalizacao(e.target.value)}
                  placeholder="Ex: Campus Central, Cidade do Uíge"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalUnidade({ aberto: false, modo: "criar" })}
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
                  <span>{modalUnidade.modo === "editar" ? "Salvar Alterações" : "Cadastrar Unidade"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CURSO (CRIAR / EDITAR) */}
      {modalCurso.aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {modalCurso.modo === "editar" ? "Editar Curso" : "Novo Curso"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Vincule o curso à unidade orgânica e defina o coordenador.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalCurso({ aberto: false, modo: "criar" })}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submeterCurso} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Unidade Académica Orgânica *
                </label>
                <select
                  required
                  value={formCursoIdUo}
                  onChange={(e) => setFormCursoIdUo(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
                >
                  <option value="">Selecione uma unidade...</option>
                  {unidades.map((u) => (
                    <option key={u.id} value={String(u.id)}>
                      {u.sigla} · {u.nomeUo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Nome do Curso *
                </label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  value={formCursoNome}
                  onChange={(e) => setFormCursoNome(e.target.value)}
                  placeholder="Ex: Engenharia Informática, Economia, Direito"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Coordenador do Curso (Opcional)
                </label>
                <select
                  value={formCursoIdCoordenador}
                  onChange={(e) => setFormCursoIdCoordenador(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
                >
                  <option value="">Sem coordenador atribuído</option>
                  {coordenadores.map((coord) => (
                    <option key={coord.id} value={String(coord.id)}>
                      {coord.nome} {coord.email ? `(${coord.email})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalCurso({ aberto: false, modo: "criar" })}
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
                  <span>{modalCurso.modo === "editar" ? "Salvar Alterações" : "Cadastrar Curso"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: TURMA (CRIAR / EDITAR) */}
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
                    Defina o curso, o código da turma, o ano curricular e o período.
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
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Curso *
                </label>
                <select
                  required
                  value={formTurmaIdCurso}
                  onChange={(e) => setFormTurmaIdCurso(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
                >
                  <option value="">Selecione um curso...</option>
                  {cursos.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.nomeCurso} {c.unidade ? `(${c.unidade.sigla})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Código / Nome da Turma *
                </label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={formTurmaNome}
                  onChange={(e) => setFormTurmaNome(e.target.value)}
                  placeholder="Ex: INF-M1, ECO-T2, DIR-PL"
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
                    value={formTurmaAno}
                    onChange={(e) => setFormTurmaAno(e.target.value)}
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
                    value={formTurmaPeriodo}
                    onChange={(e) => setFormTurmaPeriodo(e.target.value)}
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

      {/* MODAL 4: CONFIRMAÇÃO DE ELIMINAÇÃO */}
      {modalEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Eliminar {modalEliminar.tipo === "unidade" ? "Unidade Académica" : modalEliminar.tipo === "curso" ? "Curso" : "Turma"}
              </h3>
            </div>

            <p className="mt-3 text-sm text-slate-600">
              Tem a certeza de que deseja eliminar o registo{" "}
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
