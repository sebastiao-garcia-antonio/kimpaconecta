"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Lock,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  Unlock,
  User,
  Users,
  X,
  XCircle,
  Loader2,
  GraduationCap,
} from "lucide-react";
import {
  criarProfessorServer,
  editarProfessorServer,
  alternarStatusProfessorServer,
  eliminarProfessorServer,
} from "@/features/academic-management/professores.actions";

export type ProfessorCurso = {
  idCurso: number;
  nomeCurso: string;
  dataVinculo: string;
};

export type DisciplinaSimples = {
  id: number;
  nomeDisciplina: string;
  semestre: number;
  idCurso: number;
  idDocente?: number | null;
  nomeCurso: string;
};

export type ProfessorItem = {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  numBi: string;
  status: string;
  cursos: ProfessorCurso[];
  idsDisciplinas: number[];
  nomesDisciplinas: string[];
  totalAvaliacoes: number;
  totalMateriais: number;
  totalDiarios: number;
};

interface Props {
  professores: ProfessorItem[];
  cursos: { id: number; nomeCurso: string }[];
  disciplinas: DisciplinaSimples[];
}

export function ProfessoresCoordenadorClient({ professores, cursos, disciplinas }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [pesquisa, setPesquisa] = useState("");
  const [filtroCurso, setFiltroCurso] = useState("todos");
  const [notificacao, setNotificacao] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);

  // Modais
  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  const [professorEditar, setProfessorEditar] = useState<ProfessorItem | null>(null);
  const [professorEliminar, setProfessorEliminar] = useState<ProfessorItem | null>(null);

  // Estados do formulário de criação
  const [formNome, setFormNome] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formSenha, setFormSenha] = useState("");
  const [formTelefone, setFormTelefone] = useState("");
  const [formNumBi, setFormNumBi] = useState("");
  const [formCursos, setFormCursos] = useState<number[]>([]);
  const [formDisciplinas, setFormDisciplinas] = useState<number[]>([]);

  // Estados do formulário de edição
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editSenha, setEditSenha] = useState("");
  const [editTelefone, setEditTelefone] = useState("");
  const [editNumBi, setEditNumBi] = useState("");
  const [editCursos, setEditCursos] = useState<number[]>([]);
  const [editDisciplinas, setEditDisciplinas] = useState<number[]>([]);

  const abrirModalCriar = () => {
    setFormNome("");
    setFormEmail("");
    setFormSenha("");
    setFormTelefone("");
    setFormNumBi("");
    setFormCursos(cursos.length > 0 ? [cursos[0].id] : []);
    setFormDisciplinas([]);
    setModalCriarAberto(true);
  };

  const abrirModalEditar = (p: ProfessorItem) => {
    setProfessorEditar(p);
    setEditNome(p.nome);
    setEditEmail(p.email);
    setEditSenha("");
    setEditTelefone(p.telefone || "");
    setEditNumBi(p.numBi || "");
    setEditCursos(p.cursos.map((c) => c.idCurso));
    setEditDisciplinas(p.idsDisciplinas || []);
  };

  const submeterCriacao = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await criarProfessorServer({
        nome: formNome,
        email: formEmail,
        senha: formSenha,
        telefone: formTelefone,
        numBi: formNumBi,
        idsCursos: formCursos,
        idsDisciplinas: formDisciplinas,
      });

      if (res.success) {
        setNotificacao({ tipo: "sucesso", texto: "Professor adicionado com sucesso!" });
        setModalCriarAberto(false);
        router.refresh();
      } else {
        setNotificacao({ tipo: "erro", texto: res.error || "Erro ao adicionar professor." });
      }
    });
  };

  const submeterEdicao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!professorEditar) return;

    startTransition(async () => {
      const res = await editarProfessorServer({
        id: professorEditar.id,
        nome: editNome,
        email: editEmail,
        senha: editSenha || undefined,
        telefone: editTelefone,
        numBi: editNumBi,
        idsCursos: editCursos,
        idsDisciplinas: editDisciplinas,
      });

      if (res.success) {
        setNotificacao({ tipo: "sucesso", texto: "Dados do professor atualizados com sucesso!" });
        setProfessorEditar(null);
        router.refresh();
      } else {
        setNotificacao({ tipo: "erro", texto: res.error || "Erro ao atualizar professor." });
      }
    });
  };

  const alternarBloqueio = (p: ProfessorItem) => {
    startTransition(async () => {
      const res = await alternarStatusProfessorServer(p.id);
      if (res.success) {
        setNotificacao({
          tipo: "sucesso",
          texto: res.status === "ativo" ? "Acesso do professor liberado com sucesso!" : "Acesso do professor bloqueado com sucesso!",
        });
        router.refresh();
      } else {
        setNotificacao({ tipo: "erro", texto: res.error || "Erro ao alterar estado." });
      }
    });
  };

  const confirmarEliminacao = () => {
    if (!professorEliminar) return;

    startTransition(async () => {
      const res = await eliminarProfessorServer(professorEliminar.id);
      if (res.success) {
        setNotificacao({ tipo: "sucesso", texto: "Professor e todos os registros vinculados foram eliminados com sucesso!" });
        setProfessorEliminar(null);
        router.refresh();
      } else {
        setNotificacao({ tipo: "erro", texto: res.error || "Erro ao eliminar professor." });
        setProfessorEliminar(null);
      }
    });
  };

  const alternarSelecaoItem = (
    id: number,
    selecionados: number[],
    setter: (novaLista: number[]) => void
  ) => {
    if (selecionados.includes(id)) {
      setter(selecionados.filter((item) => item !== id));
    } else {
      setter([...selecionados, id]);
    }
  };

  const filtrados = professores.filter((p) => {
    const termo = pesquisa.toLowerCase();
    const combinaPesquisa =
      !termo ||
      p.nome.toLowerCase().includes(termo) ||
      p.email.toLowerCase().includes(termo) ||
      p.nomesDisciplinas.some((d) => d.toLowerCase().includes(termo));
    const combinaCurso =
      filtroCurso === "todos" || p.cursos.some((c) => String(c.idCurso) === filtroCurso);
    return combinaPesquisa && combinaCurso;
  });

  return (
    <div className="space-y-6">
      {/* Alerta de notificação */}
      {notificacao && (
        <div
          className={`flex items-center justify-between rounded-2xl p-4 text-sm font-semibold ${
            notificacao.tipo === "sucesso"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <span>{notificacao.texto}</span>
          <button onClick={() => setNotificacao(null)} className="rounded-lg p-1 hover:bg-black/5">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Barra de pesquisa, filtros e botão de Adicionar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              placeholder="Pesquisar professor por nome, e-mail ou disciplina..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-blue focus:bg-white focus:outline-none"
            />
          </div>

          {cursos.length > 0 && (
            <select
              value={filtroCurso}
              onChange={(e) => setFiltroCurso(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 focus:border-brand-blue focus:outline-none"
            >
              <option value="todos">Todos os cursos</option>
              {cursos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nomeCurso}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          type="button"
          onClick={abrirModalCriar}
          className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-blue/90"
        >
          <Plus className="h-4 w-4" /> Novo Professor
        </button>
      </div>

      {/* Tabela de Professores */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50">
            <tr className="text-slate-500">
              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Professor</th>
              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Cursos Vinculados</th>
              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Disciplinas que Leciona</th>
              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Estado</th>
              <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <User className="h-8 w-8 text-slate-300" />
                    <p className="font-semibold">Nenhum professor encontrado.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtrados.map((professor) => (
                <tr key={professor.id} className="transition hover:bg-slate-50/60">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-100 font-bold text-blue-700">
                        {professor.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{professor.nome}</p>
                        <p className="text-xs text-slate-500">{professor.email}</p>
                        {professor.telefone && (
                          <p className="text-[11px] text-slate-400">{professor.telefone}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1.5 max-w-xs">
                      {professor.cursos.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">Sem cursos</span>
                      ) : (
                        professor.cursos.map((c) => (
                          <span
                            key={c.idCurso}
                            className="inline-flex items-center gap-1 rounded-lg border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700"
                          >
                            <BookOpen className="h-3 w-3" />
                            {c.nomeCurso}
                          </span>
                        ))
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1.5 max-w-xs">
                      {professor.nomesDisciplinas.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">Nenhuma disciplina</span>
                      ) : (
                        professor.nomesDisciplinas.map((nome, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
                          >
                            <GraduationCap className="h-3 w-3" />
                            {nome}
                          </span>
                        ))
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ${
                        professor.status === "ativo"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {professor.status === "ativo" ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      {professor.status === "ativo" ? "Ativo" : "Bloqueado"}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      {/* Bloquear / Liberar acesso */}
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => alternarBloqueio(professor)}
                        title={professor.status === "ativo" ? "Bloquear acesso" : "Liberar acesso"}
                        className={`rounded-xl p-2 transition ${
                          professor.status === "ativo"
                            ? "text-amber-600 hover:bg-amber-50"
                            : "text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {professor.status === "ativo" ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                      </button>

                      {/* Editar */}
                      <button
                        type="button"
                        onClick={() => abrirModalEditar(professor)}
                        title="Editar professor e disciplinas"
                        className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-brand-blue"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      {/* Mensagem */}
                      <Link
                        href="/mensagens"
                        title="Enviar mensagem"
                        className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-brand-blue"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Link>

                      {/* Eliminar com tudo vinculado */}
                      <button
                        type="button"
                        onClick={() => setProfessorEliminar(professor)}
                        title="Eliminar professor com tudo vinculado"
                        className="rounded-xl p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtrados.length > 0 && (
        <p className="text-xs text-slate-400 text-right">
          {filtrados.length} professor{filtrados.length !== 1 ? "es" : ""} listado{filtrados.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* ────────────────── MODAL: NOVO PROFESSOR ────────────────── */}
      {modalCriarAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Novo Professor</h3>
                  <p className="text-xs text-slate-500">Cadastre o docente e associe-o a cursos e disciplinas.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalCriarAberto(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submeterCriacao} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    placeholder="Ex: Prof. Dr. António Silva"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    E-mail Institucional *
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="exemplo@unikimpa.ao"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Senha Provisória *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formSenha}
                    onChange={(e) => setFormSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={formTelefone}
                    onChange={(e) => setFormTelefone(e.target.value)}
                    placeholder="+244 9..."
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    N.º do BI
                  </label>
                  <input
                    type="text"
                    value={formNumBi}
                    onChange={(e) => setFormNumBi(e.target.value)}
                    placeholder="000...BA000"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
                  />
                </div>
              </div>

              {/* Cursos a Vincular */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Cursos a Vincular *
                </label>
                <div className="max-h-32 overflow-y-auto rounded-2xl border border-slate-200 p-3 space-y-2 bg-slate-50/50">
                  {cursos.map((c) => (
                    <label key={c.id} className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formCursos.includes(c.id)}
                        onChange={() => alternarSelecaoItem(c.id, formCursos, setFormCursos)}
                        className="rounded text-brand-blue focus:ring-brand-blue"
                      />
                      <span>{c.nomeCurso}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Disciplinas a Associar */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Disciplinas que Leciona (Opcional)
                </label>
                <div className="max-h-44 overflow-y-auto rounded-2xl border border-slate-200 p-3 space-y-2 bg-slate-50/50">
                  {disciplinas.length === 0 ? (
                    <p className="text-xs text-slate-400">Nenhuma disciplina cadastrada nos cursos.</p>
                  ) : (
                    disciplinas.map((d) => (
                      <label key={d.id} className="flex items-center justify-between text-xs text-slate-700 font-medium cursor-pointer py-0.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formDisciplinas.includes(d.id)}
                            onChange={() => alternarSelecaoItem(d.id, formDisciplinas, setFormDisciplinas)}
                            className="rounded text-brand-blue focus:ring-brand-blue"
                          />
                          <span className="font-semibold text-slate-800">{d.nomeDisciplina}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold">{d.nomeCurso} · {d.semestre}º Sem.</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalCriarAberto(false)}
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
                  Cadastrar Professor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────── MODAL: EDITAR PROFESSOR ────────────────── */}
      {professorEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
                  <Pencil className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Editar Professor</h3>
                  <p className="text-xs text-slate-500">Atualize dados, cursos e as disciplinas que ele leciona.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProfessorEditar(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submeterEdicao} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    E-mail Institucional *
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Nova Senha (opcional)
                  </label>
                  <input
                    type="password"
                    value={editSenha}
                    onChange={(e) => setEditSenha(e.target.value)}
                    placeholder="Em branco p/ manter"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={editTelefone}
                    onChange={(e) => setEditTelefone(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    N.º do BI
                  </label>
                  <input
                    type="text"
                    value={editNumBi}
                    onChange={(e) => setEditNumBi(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
                  />
                </div>
              </div>

              {/* Cursos Vinculados */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Cursos Vinculados
                </label>
                <div className="max-h-32 overflow-y-auto rounded-2xl border border-slate-200 p-3 space-y-2 bg-slate-50/50">
                  {cursos.map((c) => (
                    <label key={c.id} className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editCursos.includes(c.id)}
                        onChange={() => alternarSelecaoItem(c.id, editCursos, setEditCursos)}
                        className="rounded text-brand-blue focus:ring-brand-blue"
                      />
                      <span>{c.nomeCurso}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Disciplinas a Associar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Disciplinas que Leciona
                  </label>
                  <span className="text-[10px] font-bold text-brand-blue">
                    {editDisciplinas.length} selecionada(s)
                  </span>
                </div>
                <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-200 p-3 space-y-2 bg-slate-50/50">
                  {disciplinas.length === 0 ? (
                    <p className="text-xs text-slate-400">Nenhuma disciplina cadastrada nos cursos.</p>
                  ) : (
                    disciplinas.map((d) => (
                      <label key={d.id} className="flex items-center justify-between text-xs text-slate-700 font-medium cursor-pointer py-1 border-b border-slate-100 last:border-none">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editDisciplinas.includes(d.id)}
                            onChange={() => alternarSelecaoItem(d.id, editDisciplinas, setEditDisciplinas)}
                            className="rounded text-brand-blue focus:ring-brand-blue"
                          />
                          <span className="font-semibold text-slate-800">{d.nomeDisciplina}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold">{d.nomeCurso} · {d.semestre}º Sem.</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setProfessorEditar(null)}
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
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────── MODAL: ELIMINAR COM TUDO VINCULADO ────────────────── */}
      {professorEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-rose-100">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 shrink-0">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Eliminar Professor</h3>
                <p className="text-xs text-rose-600 font-semibold">Exclusão permanente com tudo vinculado</p>
              </div>
            </div>

            <div className="rounded-2xl bg-rose-50/50 border border-rose-100 p-4 text-xs text-slate-700 space-y-2">
              <p>
                Tem a certeza de que deseja eliminar o professor <strong>{professorEliminar.nome}</strong>?
              </p>
              <p className="text-rose-700 font-bold">
                Atenção: todas as avaliações, materiais, diários de aula e dados associados a este professor serão removidos em cascata.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProfessorEliminar(null)}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={confirmarEliminacao}
                className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-60"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirmar e Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
