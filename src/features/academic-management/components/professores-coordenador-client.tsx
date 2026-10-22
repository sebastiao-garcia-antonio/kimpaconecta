"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  MessageSquare,
  Search,
  User,
  Users,
  XCircle,
} from "lucide-react";

type ProfessorCurso = {
  idCurso: number;
  nomeCurso: string;
  dataVinculo: string;
};

type Professor = {
  id: number;
  nome: string;
  email: string;
  status: string;
  cursos: ProfessorCurso[];
  totalAvaliacoes: number;
  totalMateriais: number;
  totalDiarios: number;
};

interface Props {
  professores: Professor[];
  cursos: { id: number; nomeCurso: string }[];
}

export function ProfessoresCoordenadorClient({ professores, cursos }: Props) {
  const [pesquisa, setPesquisa] = useState("");
  const [filtroCurso, setFiltroCurso] = useState("todos");

  const filtrados = professores.filter((p) => {
    const termo = pesquisa.toLowerCase();
    const combinaPesquisa =
      !termo || p.nome.toLowerCase().includes(termo) || p.email.toLowerCase().includes(termo);
    const combinaCurso =
      filtroCurso === "todos" || p.cursos.some((c) => String(c.idCurso) === filtroCurso);
    return combinaPesquisa && combinaCurso;
  });

  return (
    <div className="space-y-6">
      {/* Barra de pesquisa e filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar professor por nome ou e-mail..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-blue focus:bg-white focus:outline-none"
          />
        </div>
        {cursos.length > 0 && (
          <select
            value={filtroCurso}
            onChange={(e) => setFiltroCurso(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 focus:border-brand-blue focus:outline-none"
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

      {/* Tabela */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50">
            <tr className="text-slate-500">
              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Professor</th>
              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Cursos vinculados</th>
              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Produção</th>
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
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1.5">
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
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                        {professor.totalAvaliacoes} avaliações
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                        {professor.totalMateriais} materiais
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                        {professor.totalDiarios} diários
                      </span>
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
                      {professor.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <Link
                      href="/mensagens"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Mensagem
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtrados.length > 0 && (
        <p className="text-xs text-slate-400 text-right">
          {filtrados.length} professor{filtrados.length !== 1 ? "es" : ""} encontrado{filtrados.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
