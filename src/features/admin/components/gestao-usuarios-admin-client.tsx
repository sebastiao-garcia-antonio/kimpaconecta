"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Ban,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  Pencil,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User,
  UserCheck,
  UserCog,
  UserPlus,
  X,
  AlertTriangle,
  BookOpen
} from "lucide-react";
import {
  alterarEstadoUtilizador,
  criarCoordenadorManual,
  editarUtilizador,
  excluirUtilizador,
} from "@/features/admin/admin.actions";

export type CursoDisponivel = {
  id: number;
  nomeCurso: string;
  idCoordenador: number | null;
  unidadeSigla?: string;
  unidadeNome?: string;
};

export type UtilizadorAdmin = {
  id: number;
  nome: string;
  email: string;
  status: string;
  numEstudanteLogin: string | null;
  perfis: Array<{ perfil: { nomePerfil: string } }>;
  cursoCoordenado?: { id: number; nomeCurso: string } | null;
};

export interface GestaoUsuariosAdminClientProps {
  usuarios: UtilizadorAdmin[];
  idUsuarioLogado: number;
  cursosDisponiveis: CursoDisponivel[];
}

const PERFIS_DISPONIVEIS = [
  { valor: "coordenador", rotulo: "Coordenador" },
  { valor: "professor", rotulo: "Professor" },
  { valor: "estudante", rotulo: "Estudante" },
  { valor: "admin", rotulo: "Administrador" }
];

export function GestaoUsuariosAdminClient({
  usuarios,
  idUsuarioLogado,
  cursosDisponiveis
}: GestaoUsuariosAdminClientProps) {
  const router = useRouter();
  const [pendente, iniciarTransicao] = useTransition();
  const [mensagem, setMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);

  // Termo de pesquisa e filtro de perfil
  const [pesquisa, setPesquisa] = useState("");
  const [filtroPapel, setFiltroPapel] = useState("todos");

  // Modais de Controle
  const [modalNovo, setModalNovo] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState<UtilizadorAdmin | null>(null);
  const [usuarioEliminar, setUsuarioEliminar] = useState<UtilizadorAdmin | null>(null);
  const [usuarioEstado, setUsuarioEstado] = useState<{ usuario: UtilizadorAdmin; novoEstado: string } | null>(null);

  // Estado do Formulário Novo Coordenador
  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [novoIdCurso, setNovoIdCurso] = useState<string>("");

  // Estado do Formulário Editar Utilizador
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPerfil, setEditPerfil] = useState("");
  const [editIdCurso, setEditIdCurso] = useState<string>("");

  const notificar = (tipo: "sucesso" | "erro", texto: string) => {
    setMensagem({ tipo, texto });
    setTimeout(() => {
      setMensagem(null);
    }, 6000);
  };

  // Abrir Modal Novo Coordenador
  const abrirModalNovo = () => {
    setNovoNome("");
    setNovoEmail("");
    setNovaSenha("");
    // Pré-selecionar o primeiro curso disponível caso exista
    setNovoIdCurso(cursosDisponiveis.length > 0 ? String(cursosDisponiveis[0].id) : "");
    setMensagem(null);
    setModalNovo(true);
  };

  // Submeter Novo Coordenador
  const criarCoordenador = (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem(null);

    if (!novoNome.trim() || !novoEmail.trim() || !novaSenha.trim()) {
      notificar("erro", "Preencha todos os campos obrigatórios.");
      return;
    }

    if (novaSenha.trim().length < 6) {
      notificar("erro", "A senha provisória deve conter no mínimo 6 caracteres.");
      return;
    }

    if (!novoIdCurso) {
      notificar("erro", "Selecione o curso que o coordenador irá coordenar.");
      return;
    }

    iniciarTransicao(async () => {
      const resultado = await criarCoordenadorManual({
        nome: novoNome.trim(),
        email: novoEmail.trim(),
        senhaProvisoria: novaSenha.trim(),
        idCurso: Number(novoIdCurso),
      });

      if (resultado.success) {
        setModalNovo(false);
        notificar("sucesso", "Coordenador criado e associado ao curso com sucesso.");
        router.refresh();
      } else {
        notificar("erro", resultado.error || "Não foi possível registar o coordenador.");
      }
    });
  };

  // Abrir Modal de Edição
  const abrirModalEditar = (usuario: UtilizadorAdmin) => {
    setUsuarioEditar(usuario);
    setEditNome(usuario.nome);
    setEditEmail(usuario.email);
    const papel = usuario.perfis[0]?.perfil.nomePerfil || "estudante";
    setEditPerfil(papel);
    setEditIdCurso(usuario.cursoCoordenado?.id ? String(usuario.cursoCoordenado.id) : "");
    setMensagem(null);
  };

  // Submeter Edição
  const submeterEdicao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioEditar) return;
    setMensagem(null);

    if (!editNome.trim() || !editEmail.trim()) {
      notificar("erro", "Nome e e-mail são obrigatórios.");
      return;
    }

    if (editPerfil === "coordenador" && !editIdCurso) {
      notificar("erro", "Selecione o curso para o coordenador.");
      return;
    }

    iniciarTransicao(async () => {
      const resultado = await editarUtilizador({
        idUsuario: usuarioEditar.id,
        nome: editNome.trim(),
        email: editEmail.trim(),
        perfilNome: editPerfil,
        idCurso: editPerfil === "coordenador" && editIdCurso ? Number(editIdCurso) : null,
      });

      if (resultado.success) {
        setUsuarioEditar(null);
        notificar("sucesso", "Utilizador atualizado com sucesso.");
        router.refresh();
      } else {
        notificar("erro", resultado.error || "Não foi possível atualizar o utilizador.");
      }
    });
  };

  // Confirmar e Executar Alteração de Estado (Ativar/Desativar)
  const executarAlteracaoEstado = () => {
    if (!usuarioEstado) return;
    const { usuario, novoEstado } = usuarioEstado;

    if (usuario.id === idUsuarioLogado) {
      notificar("erro", "Não é permitido desativar a sua própria conta de administrador.");
      setUsuarioEstado(null);
      return;
    }

    iniciarTransicao(async () => {
      const resultado = await alterarEstadoUtilizador(usuario.id, novoEstado);
      if (resultado.success) {
        setUsuarioEstado(null);
        notificar("sucesso", novoEstado === "ativo" ? `Conta de ${usuario.nome} ativada.` : `Conta de ${usuario.nome} desativada.`);
        router.refresh();
      } else {
        notificar("erro", resultado.error || "Não foi possível atualizar o estado.");
      }
    });
  };

  // Confirmar e Executar Exclusão
  const executarExclusao = () => {
    if (!usuarioEliminar) return;

    if (usuarioEliminar.id === idUsuarioLogado) {
      notificar("erro", "Não é permitido eliminar a sua própria conta de administrador.");
      setUsuarioEliminar(null);
      return;
    }

    iniciarTransicao(async () => {
      const resultado = await excluirUtilizador(usuarioEliminar.id);
      if (resultado.success) {
        setUsuarioEliminar(null);
        notificar("sucesso", `Utilizador "${usuarioEliminar.nome}" eliminado com sucesso.`);
        router.refresh();
      } else {
        notificar("erro", resultado.error || "Não foi possível eliminar o utilizador.");
      }
    });
  };

  // Cursos exibidos para a Edição: cursos disponíveis + curso que o usuário já coordena
  const cursosParaEdicao = [...cursosDisponiveis];
  if (
    usuarioEditar?.cursoCoordenado &&
    !cursosParaEdicao.some((c) => c.id === usuarioEditar.cursoCoordenado?.id)
  ) {
    cursosParaEdicao.unshift({
      id: usuarioEditar.cursoCoordenado.id,
      nomeCurso: usuarioEditar.cursoCoordenado.nomeCurso,
      idCoordenador: usuarioEditar.id,
    });
  }

  // Filtragem da tabela
  const usuariosFiltrados = usuarios.filter((usuario) => {
    const papel = usuario.perfis[0]?.perfil.nomePerfil || "";
    const termo = pesquisa.toLowerCase().trim();

    const combinaPesquisa =
      !termo ||
      usuario.nome.toLowerCase().includes(termo) ||
      usuario.email.toLowerCase().includes(termo) ||
      papel.toLowerCase().includes(termo) ||
      (usuario.cursoCoordenado?.nomeCurso && usuario.cursoCoordenado.nomeCurso.toLowerCase().includes(termo));

    const combinaPapel = filtroPapel === "todos" || papel === filtroPapel;

    return combinaPesquisa && combinaPapel;
  });

  return (
    <div className="space-y-6">
      {/* Toast / Alerta de Notificação */}
      {mensagem && (
        <div
          role="alert"
          className={`flex items-center gap-3 rounded-2xl border p-4 text-sm font-semibold transition ${
            mensagem.tipo === "sucesso"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          {mensagem.tipo === "sucesso" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span>{mensagem.texto}</span>
        </div>
      )}

      {/* Top Header & Controles de Ação */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-900">Lista de Utilizadores</h3>
          <p className="mt-1 text-sm text-slate-500">
            Gerencie coordenadores, docentes, estudantes e credenciais de acesso ao Kimpa Conecta.
          </p>
        </div>

        <button
          type="button"
          onClick={abrirModalNovo}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-blue px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-blue/20 transition hover:bg-brand-blue-dark active:scale-[0.98]"
        >
          <UserPlus className="h-4 w-4" />
          Novo utilizador
        </button>
      </div>

      {/* Barra de Pesquisa e Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar por nome, e-mail ou curso..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-blue focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Filtrar:</span>
          <select
            value={filtroPapel}
            onChange={(e) => setFiltroPapel(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 focus:border-brand-blue focus:outline-none"
          >
            <option value="todos">Todos os papéis</option>
            <option value="coordenador">Coordenadores</option>
            <option value="professor">Professores</option>
            <option value="estudante">Estudantes</option>
            <option value="admin">Administradores</option>
          </select>
        </div>
      </div>

      {/* Tabela de Utilizadores */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
          <thead className="bg-slate-50/80">
            <tr className="text-slate-500">
              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider">Utilizador</th>
              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider">Papel & Atribuição</th>
              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider">Estado</th>
              <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuariosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <User className="h-8 w-8 text-slate-300" />
                    <p className="font-semibold">Nenhum utilizador encontrado.</p>
                  </div>
                </td>
              </tr>
            ) : (
              usuariosFiltrados.map((usuario) => {
                const papelAtual = usuario.perfis[0]?.perfil.nomePerfil || "sem perfil";
                const ehProprioAdmin = usuario.id === idUsuarioLogado;

                return (
                  <tr
                    key={usuario.id}
                    className={`transition hover:bg-slate-50/60 ${
                      ehProprioAdmin ? "bg-blue-50/30" : ""
                    }`}
                  >
                    {/* Nome & Email */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 font-bold text-slate-700">
                          {usuario.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{usuario.nome}</span>
                            {ehProprioAdmin && (
                              <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-700">
                                Você
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500">{usuario.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Papel & Curso */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 capitalize">
                          {papelAtual === "coordenador" ? (
                            <GraduationCap className="h-3.5 w-3.5 text-blue-600" />
                          ) : papelAtual === "admin" ? (
                            <Shield className="h-3.5 w-3.5 text-indigo-600" />
                          ) : (
                            <User className="h-3.5 w-3.5 text-slate-500" />
                          )}
                          {papelAtual}
                        </span>

                        {papelAtual === "coordenador" && usuario.cursoCoordenado && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                            <BookOpen className="h-3 w-3 text-slate-400" />
                            {usuario.cursoCoordenado.nomeCurso}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ${
                          usuario.status === "ativo"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {usuario.status === "ativo" ? (
                          <ShieldCheck className="h-3.5 w-3.5" />
                        ) : (
                          <ShieldAlert className="h-3.5 w-3.5" />
                        )}
                        {usuario.status}
                      </span>
                    </td>

                    {/* Ações */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Editar */}
                        <button
                          type="button"
                          onClick={() => abrirModalEditar(usuario)}
                          title="Editar utilizador"
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span>Editar</span>
                        </button>

                        {/* Ativar / Desativar */}
                        {usuario.status === "ativo" ? (
                          <button
                            type="button"
                            disabled={ehProprioAdmin || pendente}
                            onClick={() =>
                              setUsuarioEstado({ usuario, novoEstado: "desativo" })
                            }
                            title={
                              ehProprioAdmin
                                ? "Não pode desativar a sua própria conta"
                                : "Desativar utilizador"
                            }
                            className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition ${
                              ehProprioAdmin
                                ? "border-slate-200 bg-slate-50 text-slate-400 opacity-50 cursor-not-allowed"
                                : "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 active:scale-95"
                            }`}
                          >
                            <Ban className="h-3.5 w-3.5" />
                            <span>Desativar</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={ehProprioAdmin || pendente}
                            onClick={() =>
                              setUsuarioEstado({ usuario, novoEstado: "ativo" })
                            }
                            title={
                              ehProprioAdmin
                                ? "Não pode alterar o estado da sua própria conta"
                                : "Ativar utilizador"
                            }
                            className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition ${
                              ehProprioAdmin
                                ? "border-slate-200 bg-slate-50 text-slate-400 opacity-50 cursor-not-allowed"
                                : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 active:scale-95"
                            }`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Ativar</span>
                          </button>
                        )}

                        {/* Eliminar */}
                        <button
                          type="button"
                          disabled={ehProprioAdmin || pendente}
                          onClick={() => setUsuarioEliminar(usuario)}
                          title={
                            ehProprioAdmin
                              ? "Não pode eliminar a sua própria conta"
                              : "Eliminar utilizador"
                          }
                          className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition ${
                            ehProprioAdmin
                              ? "border-slate-200 bg-slate-50 text-slate-400 opacity-50 cursor-not-allowed"
                              : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 active:scale-95"
                          }`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================================================= */}
      {/* 1. MODAL: NOVO UTILIZADOR (SOMENTE PARA ADICIONAR COORDENADOR DE CURSO) */}
      {/* ========================================================================= */}
      {modalNovo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl sm:p-8">
            <div className="mb-6 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  <UserPlus className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900">Novo Coordenador</h4>
                  <p className="text-xs text-slate-500">
                    Cadastrar coordenador e atribuir a um curso vago.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalNovo(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {cursosDisponiveis.length === 0 ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-medium text-amber-900">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="font-bold text-amber-950">Não há cursos disponíveis</p>
                    <p className="mt-1">
                      Todos os cursos já possuem um coordenador atribuído. Cada curso só pode ter
                      um único coordenador. Para adicionar outro coordenador, crie um novo curso em
                      Gestão Académica ou remova a atribuição de um curso existente.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setModalNovo(false)}
                    className="rounded-2xl bg-slate-100 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={criarCoordenador} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={novoNome}
                      onChange={(e) => setNovoNome(e.target.value)}
                      placeholder="Ex.: Prof. Dr. António Silva"
                      className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    E-mail Institucional / Pessoal
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={novoEmail}
                      onChange={(e) => setNovoEmail(e.target.value)}
                      placeholder="coordenador@kimpaconecta.ao"
                      className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Senha Provisória
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      minLength={6}
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      placeholder="Mínimo de 6 caracteres"
                      className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-mono text-slate-800 placeholder:font-sans placeholder:text-slate-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    O coordenador poderá alterar esta senha provisória após o primeiro login.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Curso sob Coordenação (Obrigatório)
                  </label>
                  <div className="relative">
                    <BookOpen className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <select
                      required
                      value={novoIdCurso}
                      onChange={(e) => setNovoIdCurso(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                    >
                      <option value="" disabled>
                        Selecione um curso disponível...
                      </option>
                      {cursosDisponiveis.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.unidadeSigla ? `[${c.unidadeSigla}] ` : ""}
                          {c.nomeCurso}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Apenas cursos sem coordenador são listados. Cada curso tem um único coordenador.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalNovo(false)}
                    className="rounded-2xl bg-slate-100 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={pendente}
                    className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-blue/20 hover:bg-brand-blue-dark transition disabled:opacity-60"
                  >
                    {pendente ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Criar Coordenador
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MODAL: EDITAR UTILIZADOR */}
      {/* ========================================================================= */}
      {usuarioEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl sm:p-8">
            <div className="mb-6 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <Pencil className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900">Editar Utilizador</h4>
                  <p className="text-xs text-slate-500">
                    Altere os dados, papel de acesso ou o curso atribuído.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUsuarioEditar(null)}
                className="rounded-full bg-slate-100 p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={submeterEdicao} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Papel / Função
                </label>
                <select
                  value={editPerfil}
                  onChange={(e) => setEditPerfil(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 px-3 text-sm text-slate-800 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                >
                  {PERFIS_DISPONIVEIS.map((p) => (
                    <option key={p.valor} value={p.valor}>
                      {p.rotulo}
                    </option>
                  ))}
                </select>
              </div>

              {editPerfil === "coordenador" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Curso sob Coordenação
                  </label>
                  <div className="relative">
                    <BookOpen className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <select
                      value={editIdCurso}
                      onChange={(e) => setEditIdCurso(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                    >
                      <option value="">Sem curso atribuído</option>
                      {cursosParaEdicao.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.unidadeSigla ? `[${c.unidadeSigla}] ` : ""}
                          {c.nomeCurso}
                          {c.idCoordenador === usuarioEditar.id ? " (Atualmente coordenando)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Apenas cursos disponíveis sem outro coordenador são exibidos.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUsuarioEditar(null)}
                  className="rounded-2xl bg-slate-100 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pendente}
                  className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-blue/20 hover:bg-brand-blue-dark transition disabled:opacity-60"
                >
                  {pendente ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                  Guardar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODAL DE CONFIRMAÇÃO: DESATIVAR / ATIVAR UTILIZADOR */}
      {/* ========================================================================= */}
      {usuarioEstado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div
                className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${
                  usuarioEstado.novoEstado === "desativo"
                    ? "bg-amber-100 text-amber-600"
                    : "bg-emerald-100 text-emerald-600"
                }`}
              >
                {usuarioEstado.novoEstado === "desativo" ? (
                  <Ban className="h-7 w-7" />
                ) : (
                  <CheckCircle2 className="h-7 w-7" />
                )}
              </div>

              <h4 className="text-lg font-black text-slate-900">
                {usuarioEstado.novoEstado === "desativo"
                  ? "Desativar Utilizador"
                  : "Ativar Utilizador"}
              </h4>

              <p className="mt-2 text-sm text-slate-600">
                {usuarioEstado.novoEstado === "desativo" ? (
                  <>
                    Tem a certeza que deseja desativar o acesso de{" "}
                    <strong className="text-slate-900">{usuarioEstado.usuario.nome}</strong>?
                    O utilizador ficará bloqueado e não conseguirá aceder ao sistema.
                  </>
                ) : (
                  <>
                    Deseja restaurar e ativar o acesso de{" "}
                    <strong className="text-slate-900">{usuarioEstado.usuario.nome}</strong>?
                    O utilizador poderá aceder à plataforma normalmente.
                  </>
                )}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setUsuarioEstado(null)}
                className="rounded-2xl bg-slate-100 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={pendente}
                onClick={executarAlteracaoEstado}
                className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold text-white shadow-md transition disabled:opacity-60 ${
                  usuarioEstado.novoEstado === "desativo"
                    ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                }`}
              >
                {pendente && <Loader2 className="h-4 w-4 animate-spin" />}
                {usuarioEstado.novoEstado === "desativo" ? "Confirmar Desativação" : "Confirmar Ativação"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL DE CONFIRMAÇÃO: ELIMINAR UTILIZADOR */}
      {/* ========================================================================= */}
      {usuarioEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                <Trash2 className="h-7 w-7" />
              </div>

              <h4 className="text-lg font-black text-slate-900">Eliminar Utilizador</h4>

              <p className="mt-2 text-sm text-slate-600">
                Tem a certeza que deseja eliminar permanentemente a conta de{" "}
                <strong className="text-slate-900">{usuarioEliminar.nome}</strong> (
                {usuarioEliminar.email})?
              </p>

              <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 text-left">
                <strong>Atenção:</strong> Esta ação é irreversível. Todas as associações e
                credenciais deste utilizador serão removidas.
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setUsuarioEliminar(null)}
                className="rounded-2xl bg-slate-100 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={pendente}
                onClick={executarExclusao}
                className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 transition disabled:opacity-60"
              >
                {pendente && <Loader2 className="h-4 w-4 animate-spin" />}
                Sim, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}