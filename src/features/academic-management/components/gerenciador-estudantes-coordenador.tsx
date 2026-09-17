"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  BellRing,
  Trash2,
  Mail,
  Phone,
  UserRound,
  GraduationCap,
  Lock,
  Clock,
  Building2,
  Calendar,
  Inbox,
  ShieldAlert,
  Award,
} from "lucide-react";
import {
  alterarEstadoEstudanteServer,
  notificarEstudanteServer,
  eliminarEstudanteServer,
  alterarMentorEstudanteServer,
} from "@/features/academic-management/estudantes.actions";

export type CursoSimples = {
  id: number;
  nomeCurso: string;
  idUo: number;
};

export type EstudanteCoordenadorData = {
  id: number;
  nome: string;
  email: string;
  numEstudanteLogin: string | null;
  numBi: string | null;
  telefone: string | null;
  status: string;
  dataCriacao: string;
  cursos: {
    idCurso: number;
    curso: { id: number; nomeCurso: string };
  }[];
  matriculas: {
    id: number;
    numProcesso: string;
    anoLectivo: number;
    isMentor: boolean;
    turma: {
      id: number;
      nomeTurma: string;
      anoCurricular: number;
      periodo: string;
      curso: { id: number; nomeCurso: string };
    };
  }[];
  _count?: {
    presencas?: number;
    historicoAcademico?: number;
    projetosAutor?: number;
    publicacoesCriadas?: number;
    tentativasProvas?: number;
  };
};

interface GerenciadorEstudantesCoordenadorProps {
  cursos: CursoSimples[];
  estudantes: EstudanteCoordenadorData[];
}

const prioridades: { valor: string; rotulo: string }[] = [
  { valor: "normal", rotulo: "Normal" },
  { valor: "alta", rotulo: "Alta" },
  { valor: "baixa", rotulo: "Baixa" },
];

export function GerenciadorEstudantesCoordenador({
  cursos,
  estudantes,
}: GerenciadorEstudantesCoordenadorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [termoBusca, setTermoBusca] = useState("");
  const [cursoSelecionado, setCursoSelecionado] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

  const [notificacao, setNotificacao] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);

  const [modalDetalhe, setModalDetalhe] = useState<EstudanteCoordenadorData | null>(null);

  const [modalNotificar, setModalNotificar] = useState<{
    estudante: EstudanteCoordenadorData;
    titulo: string;
    mensagem: string;
    prioridade: string;
  } | null>(null);

  const [modalEliminar, setModalEliminar] = useState<{
    estudante: EstudanteCoordenadorData;
  } | null>(null);

  const [idEmProcessamento, setIdEmProcessamento] = useState<number | null>(null);

  const estudantesFiltrados = useMemo(() => {
    const busca = termoBusca.trim().toLowerCase();
    return estudantes.filter((estudante) => {
      const matchBusca =
        !busca ||
        estudante.nome.toLowerCase().includes(busca) ||
        estudante.email.toLowerCase().includes(busca) ||
        (estudante.numEstudanteLogin || "").toLowerCase().includes(busca);

      const idCursosDoEstudante = new Set([
        ...estudante.cursos.map((curso) => curso.idCurso),
        ...estudante.matriculas.map((matricula) => matricula.turma.curso.id),
      ]);
      const matchCurso =
        cursoSelecionado === "todos" || idCursosDoEstudante.has(Number(cursoSelecionado));

      const matchStatus = filtroStatus === "todos" || estudante.status === filtroStatus;

      return matchBusca && matchCurso && matchStatus;
    });
  }, [estudantes, termoBusca, cursoSelecionado, filtroStatus]);

  const contarCursosDoEstudante = (estudante: EstudanteCoordenadorData) => {
    const idCursos = new Set([
      ...estudante.cursos.map((curso) => curso.idCurso),
      ...estudante.matriculas.map((matricula) => matricula.turma.curso.id),
    ]);
    return idCursos.size;
  };

  const alternarEstado = (estudante: EstudanteCoordenadorData) => {
    const novoEstado = estudante.status === "suspenso" ? "ativo" : "suspenso";
    setIdEmProcessamento(estudante.id);
    startTransition(async () => {
      const res = await alterarEstadoEstudanteServer(estudante.id, novoEstado);

      if (res.success) {
        setNotificacao({
          tipo: "sucesso",
          texto:
            novoEstado === "suspenso"
              ? `Acesso de ${estudante.nome} bloqueado com sucesso.`
              : `Acesso de ${estudante.nome} restabelecido com sucesso.`,
        });
        router.refresh();
      } else {
        setNotificacao({ tipo: "erro", texto: res.error || "Não foi possível alterar o estado." });
      }
      setIdEmProcessamento(null);
    });
  };

  const ehMentor = (estudante: EstudanteCoordenadorData): boolean =>
    estudante.matriculas.some((matricula) => matricula.isMentor);

  const alternarMentor = (estudante: EstudanteCoordenadorData) => {
    const mentor = !ehMentor(estudante);
    setIdEmProcessamento(estudante.id);
    startTransition(async () => {
      const res = await alterarMentorEstudanteServer(estudante.id, mentor);

      if (res.success) {
        setNotificacao({
          tipo: "sucesso",
          texto: mentor
            ? `${estudante.nome} foi selecionado como mentor.`
            : `${estudante.nome} foi removido da lista de mentores.`,
        });
        router.refresh();
      } else {
        setNotificacao({ tipo: "erro", texto: res.error || "Não foi possível alterar o papel de mentor." });
      }
      setIdEmProcessamento(null);
    });
  };

  const submeterNotificacao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalNotificar) return;

    startTransition(async () => {
      const res = await notificarEstudanteServer({
        idEstudante: modalNotificar.estudante.id,
        titulo: modalNotificar.titulo,
        mensagem: modalNotificar.mensagem,
        prioridade: modalNotificar.prioridade,
      });

      if (res.success) {
        setNotificacao({
          tipo: "sucesso",
          texto: `Notificação enviada a ${modalNotificar.estudante.nome}.`,
        });
        setModalNotificar(null);
        router.refresh();
      } else {
        setNotificacao({ tipo: "erro", texto: res.error || "Não foi possível enviar a notificação." });
      }
    });
  };

  const confirmarEliminacao = () => {
    if (!modalEliminar) return;
    const estudante = modalEliminar.estudante;
    setIdEmProcessamento(estudante.id);
    startTransition(async () => {
      const res = await eliminarEstudanteServer(estudante.id);

      if (res.success) {
        setNotificacao({
          tipo: "sucesso",
          texto: `Estudante ${estudante.nome} eliminado e desvinculado de todos os registos.`,
        });
        setModalEliminar(null);
        router.refresh();
      } else {
        setNotificacao({ tipo: "erro", texto: res.error || "Não foi possível eliminar o estudante." });
      }
      setIdEmProcessamento(null);
    });
  };

  const renderizarEstado = (estado: string) => {
    if (estado === "suspenso") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 ring-1 ring-inset ring-rose-200">
          <Lock className="h-3 w-3" /> Bloqueado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
        <CheckCircle2 className="h-3 w-3" /> Activo
      </span>
    );
  };

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
          <button onClick={() => setNotificacao(null)} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Cartão de Gestão de Estudantes */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/70 p-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
                <GraduationCap className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-slate-800">Gestão de Estudantes</h3>
              <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                {estudantesFiltrados.length} de {estudantes.length}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Bloqueie acessos, consulte detalhes, notifique e remova estudantes da faculdade.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {cursos.length > 1 && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-600">Curso:</label>
                <select
                  value={cursoSelecionado}
                  onChange={(e) => setCursoSelecionado(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:border-brand-blue focus:outline-none"
                >
                  <option value="todos">Todos os Cursos</option>
                  {cursos.map((curso) => (
                    <option key={curso.id} value={String(curso.id)}>
                      {curso.nomeCurso}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Barra de Busca e Estado */}
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between px-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              placeholder="Buscar por nome, email ou nº de estudante..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-xs sm:text-sm text-slate-800 placeholder-slate-400 transition focus:border-brand-blue focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Estado:</span>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="todos">Todos</option>
              <option value="ativo">Activos</option>
              <option value="suspenso">Bloqueados</option>
            </select>
          </div>
        </div>

        {/* Tabela de Estudantes */}
        <div className="p-6">
          {estudantesFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <GraduationCap className="h-12 w-12 text-slate-300" />
              <h4 className="mt-3 text-base font-bold text-slate-700">Nenhum estudante encontrado</h4>
              <p className="mt-1 text-xs text-slate-400">
                {termoBusca || cursoSelecionado !== "todos" || filtroStatus !== "todos"
                  ? "Tente ajustar os filtros de pesquisa."
                  : "Ainda não existem estudantes vinculados aos cursos sob a sua coordenação."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="pb-3 pl-2">Estudante</th>
                    <th className="pb-3">Curso(s)</th>
                    <th className="pb-3">Nº de Estudante</th>
                    <th className="pb-3">Estado</th>
                    <th className="pb-3 text-right pr-2">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {estudantesFiltrados.map((estudante) => {
                    const aProcessar = isPending && idEmProcessamento === estudante.id;
                    return (
                      <tr key={estudante.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 pl-2">
                          <div className="flex items-center gap-2.5">
                            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue shrink-0">
                              <UserRound className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate max-w-[220px] flex items-center gap-2">
                                <span className="truncate">{estudante.nome}</span>
                                {ehMentor(estudante) && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 shrink-0">
                                    <Award className="h-3 w-3" /> Mentor
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-slate-400 truncate max-w-[220px]">{estudante.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-start gap-1.5 max-w-[220px]">
                            <Building2 className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                            <span className="text-xs font-medium text-slate-600 line-clamp-2">
                              {Array.from(
                                new Set([
                                  ...estudante.cursos.map((curso) => curso.curso.nomeCurso),
                                  ...estudante.matriculas.map((matricula) => matricula.turma.curso.nomeCurso),
                                ])
                              ).join(", ") || "Sem curso atribuído"}
                            </span>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                            <Inbox className="h-3 w-3 text-slate-500" />
                            {estudante.numEstudanteLogin || "—"}
                          </span>
                        </td>
                        <td className="py-4">{renderizarEstado(estudante.status)}</td>
                        <td className="py-4 text-right pr-2">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => setModalDetalhe(estudante)}
                              title="Ver detalhes"
                              className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-brand-blue"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setModalNotificar({ estudante, titulo: "", mensagem: "", prioridade: "normal" })}
                              title="Notificar estudante"
                              className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-brand-green"
                            >
                              <BellRing className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => alternarEstado(estudante)}
                              title={estudante.status === "suspenso" ? "Desbloquear acesso" : "Bloquear acesso"}
                              disabled={aProcessar}
                              className="rounded-xl p-2 text-slate-500 transition hover:bg-amber-50 hover:text-amber-600 disabled:opacity-50"
                            >
                              {estudante.status === "suspenso" ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Lock className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => alternarMentor(estudante)}
                              title={ehMentor(estudante) ? "Remover como mentor" : "Selecionar como mentor"}
                              disabled={aProcessar}
                              className={`rounded-xl p-2 transition disabled:opacity-50 ${
                                ehMentor(estudante)
                                  ? "text-amber-600 hover:bg-amber-50"
                                  : "text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                              }`}
                            >
                              <Award className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setModalEliminar({ estudante })}
                              title="Eliminar estudante"
                              disabled={aProcessar}
                              className="rounded-xl p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
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

      {/* ────────────────── MODAL DETALHES ────────────────── */}
      {modalDetalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-brand-green text-white">
                  <UserRound className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{modalDetalhe.nome}</h3>
                  <p className="text-xs text-slate-500">{modalDetalhe.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {ehMentor(modalDetalhe) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-700">
                    <Award className="h-3 w-3" /> Mentor
                  </span>
                )}
                {renderizarEstado(modalDetalhe.status)}
                <button
                  onClick={() => setModalDetalhe(null)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-6">
              {/* Dados pessoais */}
              <section>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Dados pessoais</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Inbox className="h-3 w-3" /> Nº de estudante
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-800">{modalDetalhe.numEstudanteLogin || "—"}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nº de BI</p>
                    <p className="mt-1 text-sm font-bold text-slate-800">{modalDetalhe.numBi || "—"}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Telefone
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-800">{modalDetalhe.telefone || "—"}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Mail className="h-3 w-3" /> Email
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-800 break-words">{modalDetalhe.email}</p>
                  </div>
                </div>
              </section>

              {/* Cursos e Matrículas */}
              <section>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Cursos ({contarCursosDoEstudante(modalDetalhe)})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Array.from(
                    new Set([
                      ...modalDetalhe.cursos.map((curso) => curso.curso.nomeCurso),
                      ...modalDetalhe.matriculas.map((matricula) => matricula.turma.curso.nomeCurso),
                    ])
                  ).map((nomeCurso) => (
                    <span
                      key={nomeCurso}
                      className="inline-flex items-center gap-1.5 rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-bold text-brand-blue"
                    >
                      <Building2 className="h-3 w-3" /> {nomeCurso}
                    </span>
                  ))}
                </div>

                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 mt-5">
                  Matrículas ({modalDetalhe.matriculas.length})
                </h4>
                {modalDetalhe.matriculas.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                    Este estudante ainda não possui matrículas registadas.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {modalDetalhe.matriculas.map((matricula) => (
                      <div
                        key={matricula.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 shrink-0">
                          <GraduationCap className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-800">
                            Turma {matricula.turma.nomeTurma} · {matricula.turma.curso.nomeCurso}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3" />
                            {matricula.turma.anoCurricular}º ano · {matricula.turma.periodo} · Ano lectivo {matricula.anoLectivo}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600 shrink-0">
                          Proc. {matricula.numProcesso}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Indicadores de atividade */}
              <section>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Actividade na plataforma</h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { rotulo: "Presenças", valor: modalDetalhe._count?.presencas || 0 },
                    { rotulo: "Histórico", valor: modalDetalhe._count?.historicoAcademico || 0 },
                    { rotulo: "Projetos", valor: modalDetalhe._count?.projetosAutor || 0 },
                    { rotulo: "Publicações", valor: modalDetalhe._count?.publicacoesCriadas || 0 },
                    { rotulo: "Provas", valor: modalDetalhe._count?.tentativasProvas || 0 },
                  ].map((item) => (
                    <div key={item.rotulo} className="rounded-2xl border border-slate-100 bg-white p-3 text-center">
                      <p className="text-xl font-black text-slate-900">{item.valor}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">{item.rotulo}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Conta criada em {modalDetalhe.dataCriacao ? new Date(modalDetalhe.dataCriacao).toLocaleDateString("pt-PT") : "—"}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setModalNotificar({ estudante: modalDetalhe, titulo: "", mensagem: "", prioridade: "normal" })}
                  className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                >
                  <BellRing className="h-4 w-4" /> Notificar
                </button>
                <button
                  onClick={() => {
                    const copia = { ...modalDetalhe };
                    setModalDetalhe(null);
                    alternarEstado(copia);
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100"
                >
                  <Lock className="h-4 w-4" />
                  {modalDetalhe.status === "suspenso" ? "Desbloquear" : "Bloquear"}
                </button>
                <button
                  onClick={() => setModalDetalhe(null)}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── MODAL NOTIFICAR ────────────────── */}
      {modalNotificar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <BellRing className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Notificar Estudante</h3>
                  <p className="text-xs text-slate-500">Enviar uma notificação para {modalNotificar.estudante.nome}.</p>
                </div>
              </div>
              <button
                onClick={() => setModalNotificar(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submeterNotificacao} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Título *
                </label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  value={modalNotificar.titulo}
                  onChange={(e) => setModalNotificar({ ...modalNotificar, titulo: e.target.value })}
                  placeholder="Ex: Reunião obrigatória de turma"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Mensagem *
                </label>
                <textarea
                  required
                  maxLength={1000}
                  rows={4}
                  value={modalNotificar.mensagem}
                  onChange={(e) => setModalNotificar({ ...modalNotificar, mensagem: e.target.value })}
                  placeholder="Escreva a mensagem que o estudante irá receber na plataforma..."
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-brand-blue focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Prioridade
                </label>
                <select
                  value={modalNotificar.prioridade}
                  onChange={(e) => setModalNotificar({ ...modalNotificar, prioridade: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
                >
                  {prioridades.map((prioridade) => (
                    <option key={prioridade.valor} value={prioridade.valor}>
                      {prioridade.rotulo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNotificar(null)}
                  className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-2xl bg-brand-green px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-green/90 disabled:opacity-60"
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Enviar Notificação</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────── MODAL ELIMINAÇÃO ────────────────── */}
      {modalEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Eliminar Estudante</h3>
            </div>

            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Tem a certeza de que deseja eliminar o estudante{" "}
              <strong className="text-slate-900 font-bold">{modalEliminar.estudante.nome}</strong>?
            </p>

            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-800 leading-relaxed">
              O estudante será desvinculado de <strong>todas as tabelas</strong> associadas: matrículas,
              cursos, presenças, histórico académico, grupos, publicações, mensagens, notificações e
              demais registos. Esta ação é <strong>irreversível</strong>.
            </div>

            {modalEliminar.estudante._count &&
              (modalEliminar.estudante._count.tentativasProvas ||
                modalEliminar.estudante._count.historicoAcademico ||
                modalEliminar.estudante._count.presencas ||
                modalEliminar.estudante._count.projetosAutor ||
                modalEliminar.estudante._count.publicacoesCriadas) && (
                <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-800 leading-relaxed flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    Este estudante possui historial de uso no sistema. Ao eliminar, todos estes registos
                    serão removidos permanentemente.
                  </span>
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