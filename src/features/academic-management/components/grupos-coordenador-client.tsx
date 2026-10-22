"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  MessageSquare,
  Search,
  Users,
} from "lucide-react";

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

interface Props {
  grupos: Grupo[];
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

export function GruposCoordenadorClient({ grupos }: Props) {
  const [pesquisa, setPesquisa] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");

  const filtrados = grupos.filter((g) => {
    const termo = pesquisa.toLowerCase();
    const combinaPesquisa =
      !termo ||
      g.nomeGrupo.toLowerCase().includes(termo) ||
      g.criadorNome.toLowerCase().includes(termo) ||
      g.disciplina?.nome.toLowerCase().includes(termo) ||
      g.turma?.nome.toLowerCase().includes(termo);
    const combinaTipo = filtroTipo === "todos" || g.tipoGrupo === filtroTipo;
    return combinaPesquisa && combinaTipo;
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
            placeholder="Pesquisar grupo, criador ou disciplina..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-blue focus:bg-white focus:outline-none"
          />
        </div>
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
      </div>

      {/* Grid de grupos */}
      {filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <Users className="h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-sm font-bold text-slate-700">Nenhum grupo encontrado.</h3>
          <p className="mt-1 text-xs text-slate-400">
            Os grupos de turma, disciplina, trabalho e mentoria do curso aparecem aqui.
          </p>
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
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${badgeClass}`}
                    >
                      {rotulo}
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold">
                      {grupo.totalMembros} membro{grupo.totalMembros !== 1 ? "s" : ""}
                    </span>
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
    </div>
  );
}
