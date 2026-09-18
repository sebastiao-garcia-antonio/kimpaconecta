"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle2, Loader2, Pencil, Plus, ShieldAlert, ShieldCheck, Trash2, UserPlus, X } from "lucide-react";
import {
  alterarEstadoUtilizador,
  alterarPapelUtilizador,
  criarUtilizadorManual,
  excluirUtilizador,
} from "@/features/admin/admin.actions";

type UtilizadorAdmin = {
  id: number;
  nome: string;
  email: string;
  status: string;
  numEstudanteLogin: string | null;
  perfis: Array<{ perfil: { nomePerfil: string } }>;
};

interface GestaoUsuariosAdminClientProps {
  usuarios: UtilizadorAdmin[];
}

const PERFIS = ["estudante", "professor", "coordenador", "admin"];

export function GestaoUsuariosAdminClient({ usuarios }: GestaoUsuariosAdminClientProps) {
  const router = useRouter();
  const [pendente, iniciarTransicao] = useTransition();
  const [mensagem, setMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  const [modal, setModal] = useState(false);
  const [idEmAcao, setIdEmAcao] = useState<number | null>(null);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [numEstudante, setNumEstudante] = useState("");
  const [perfilNovo, setPerfilNovo] = useState("estudante");

  const notificar = (tipo: "sucesso" | "erro", texto: string) => {
    setMensagem({ tipo, texto });
  };

  const criar = (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem(null);

    if (!nome.trim() || !email.trim() || !senha.trim()) {
      notificar("erro", "Preencha nome, e-mail e senha provisória.");
      return;
    }

    iniciarTransicao(async () => {
      const resultado = await criarUtilizadorManual({
        nome: nome.trim(),
        email: email.trim(),
        senhaProvisoria: senha,
        numEstudanteLogin: numEstudante.trim() || undefined,
        perfilNome: perfilNovo,
      });

      if (resultado.success) {
        setNome("");
        setEmail("");
        setSenha("");
        setNumEstudante("");
        setModal(false);
        notificar("sucesso", "Utilizador criado com sucesso.");
        router.refresh();
      } else {
        notificar("erro", resultado.error || "Não foi possível criar o utilizador.");
      }
    });
  };

  const alterarPapel = (idUsuario: number, perfilNomeNovo: string) => {
    setIdEmAcao(idUsuario);
    iniciarTransicao(async () => {
      const resultado = await alterarPapelUtilizador(idUsuario, perfilNomeNovo);
      if (resultado.success) {
        notificar("sucesso", "Papel atualizado.");
        router.refresh();
      } else {
        notificar("erro", resultado.error || "Não foi possível alterar o papel.");
      }
      setIdEmAcao(null);
    });
  };

  const alterarEstado = (idUsuario: number, novoEstado: string) => {
    setIdEmAcao(idUsuario);
    iniciarTransicao(async () => {
      const resultado = await alterarEstadoUtilizador(idUsuario, novoEstado);
      if (resultado.success) {
        notificar("sucesso", novoEstado === "ativo" ? "Conta ativada." : "Conta desativada.");
        router.refresh();
      } else {
        notificar("erro", resultado.error || "Não foi possível atualizar o estado.");
      }
      setIdEmAcao(null);
    });
  };

  const eliminar = (idUsuario: number, nomeUtilizador: string) => {
    if (!window.confirm(`Tem a certeza que deseja eliminar "${nomeUtilizador}"? Esta ação não pode ser desfeita.`)) {
      return;
    }
    setIdEmAcao(idUsuario);
    iniciarTransicao(async () => {
      const resultado = await excluirUtilizador(idUsuario);
      if (resultado.success) {
        notificar("sucesso", "Utilizador eliminado.");
        router.refresh();
      } else {
        notificar("erro", resultado.error || "Não foi possível eliminar o utilizador.");
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-slate-900">Lista de utilizadores</h3>
          <p className="mt-1 text-sm text-slate-500">Criar contas, alterar papéis e gerir o estado de acesso.</p>
        </div>
        <button
          type="button"
          onClick={() => setModal(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-blue-dark"
        >
          <UserPlus className="h-4 w-4" /> Novo utilizador
        </button>
      </div>

      {modal && (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="font-bold text-slate-800">Criar utilizador manualmente</h4>
            <button type="button" onClick={() => setModal(false)} className="rounded-full bg-slate-200 p-1.5 text-slate-500 hover:bg-slate-300">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={criar} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Nome completo
              <input value={nome} onChange={(e) => setNome(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" placeholder="Ex.: Maria João" />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              E-mail
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" placeholder="maria@kimpaconnect.ao" />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Senha provisória
              <input type="text" value={senha} onChange={(e) => setSenha(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" placeholder="Mínimo 6 caracteres" />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Nº de estudante (opcional)
              <input value={numEstudante} onChange={(e) => setNumEstudante(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" placeholder="Ex.: 2020XXXXX" />
            </label>
            <label className="text-sm font-semibold text-slate-700 md:col-span-2">
              Perfil
              <select value={perfilNovo} onChange={(e) => setPerfilNovo(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
                {PERFIS.map((perfil) => (
                  <option key={perfil} value={perfil}>{perfil}</option>
                ))}
              </select>
            </label>
            <div className="flex gap-3 md:col-span-2">
              <button type="submit" disabled={pendente} className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-blue-dark disabled:opacity-60">
                {pendente ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Criar utilizador
              </button>
              <button type="button" onClick={() => setModal(false)} className="rounded-2xl bg-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-300">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400">
              <th className="px-4 py-3 font-bold uppercase tracking-[0.18em]">Nome</th>
              <th className="px-4 py-3 font-bold uppercase tracking-[0.18em]">E-mail</th>
              <th className="px-4 py-3 font-bold uppercase tracking-[0.18em]">Perfil</th>
              <th className="px-4 py-3 font-bold uppercase tracking-[0.18em]">Estado</th>
              <th className="px-4 py-3 font-bold uppercase tracking-[0.18em]">Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => {
              const papelAtual = usuario.perfis[0]?.perfil.nomePerfil || "sem perfil";
              return (
                <tr key={usuario.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-4 font-semibold text-slate-800">
                    {usuario.nome}
                    {usuario.numEstudanteLogin && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{usuario.numEstudanteLogin}</span>}
                  </td>
                  <td className="px-4 py-4 text-slate-500">{usuario.email}</td>
                  <td className="px-4 py-4">
                    <select
                      value={papelAtual}
                      disabled={pendente && idEmAcao === usuario.id}
                      onChange={(e) => alterarPapel(usuario.id, e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-brand-blue"
                    >
                      {PERFIS.map((perfil) => (
                        <option key={perfil} value={perfil}>{perfil}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${usuario.status === "ativo" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                      {usuario.status === "ativo" ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                      {usuario.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {usuario.status === "ativo" ? (
                        <button
                          type="button"
                          onClick={() => alterarEstado(usuario.id, "desativo")}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-bold text-amber-700 transition hover:bg-amber-100"
                        >
                          <Ban className="h-3 w-3" /> Desativar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => alterarEstado(usuario.id, "ativo")}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Ativar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => eliminar(usuario.id, usuario.nome)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-700 transition hover:bg-rose-100"
                      >
                        <Trash2 className="h-3 w-3" /> Eliminar
                      </button>
                      {pendente && idEmAcao === usuario.id && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}