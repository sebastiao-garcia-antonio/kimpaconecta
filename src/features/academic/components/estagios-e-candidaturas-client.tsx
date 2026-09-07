"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Building2, Calendar, CheckCircle2, Clock, Plus, Search, Send, Sparkles, UserCheck, AlertCircle, Loader2 } from "lucide-react";
import { candidatarAEstagioServer, atualizarEstadoCandidaturaServer } from "../careers.actions";
import { criarOportunidadeServer } from "../actions";

export type OportunidadeItem = {
  id: number;
  titulo: string;
  descricao: string;
  tipo: string;
  empresa: string;
  requisitos?: string | null;
  dataLimite?: string | null;
  criadorNome?: string;
  candidaturaAtual?: {
    idCandidatura: number;
    estado: string;
    dataCandidatura: string;
  } | null;
  totalCandidaturas?: number;
};

export type CandidaturaItem = {
  idCandidatura: number;
  idOportunidade: number;
  tituloVaga: string;
  empresa: string;
  tipo: string;
  estado: string;
  dataCandidatura: string;
  estudanteNome?: string;
  estudanteEmail?: string;
};

interface EstagiosECandidaturasClientProps {
  oportunidades: OportunidadeItem[];
  minhasCandidaturas: CandidaturaItem[];
  todasCandidaturasParaDocente?: CandidaturaItem[];
  usuarioAtual: {
    id: number;
    nome: string;
    papeis: string[];
  };
}

export function EstagiosECandidaturasClient({
  oportunidades,
  minhasCandidaturas,
  todasCandidaturasParaDocente = [],
  usuarioAtual,
}: EstagiosECandidaturasClientProps) {
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<"vagas" | "minhas" | "gestao">("vagas");
  const [filtro, setFiltro] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("TODOS");
  const [modalPublicar, setModalPublicar] = useState(false);
  const [tituloVaga, setTituloVaga] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [tipoVaga, setTipoVaga] = useState("estagio");
  const [requisitos, setRequisitos] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataLimite, setDataLimite] = useState("");

  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [pendente, iniciarTransicao] = useTransition();

  const ehDocenteOuStaff = usuarioAtual.papeis.some((p) => ["admin", "coordenador", "professor"].includes(p));

  const submeterCandidatura = (idOportunidade: number) => {
    setErro(null);
    setSucesso(null);

    iniciarTransicao(async () => {
      const res = await candidatarAEstagioServer(idOportunidade);
      if (res.error) {
        setErro(res.error);
        return;
      }

      setSucesso("Candidatura submetida com sucesso! O recrutador foi notificado.");
      router.refresh();
    });
  };

  const alterarEstado = (idCandidatura: number, novoEstado: string) => {
    setErro(null);
    setSucesso(null);

    iniciarTransicao(async () => {
      const res = await atualizarEstadoCandidaturaServer(idCandidatura, novoEstado);
      if (res.error) {
        setErro(res.error);
        return;
      }

      setSucesso(`Estado da candidatura atualizado para: ${novoEstado.toUpperCase()}`);
      router.refresh();
    });
  };

  const publicarNovaVaga = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setSucesso(null);

    if (!tituloVaga.trim() || !descricao.trim()) {
      setErro("Preencha os campos obrigatórios do anúncio.");
      return;
    }

    iniciarTransicao(async () => {
      const res = await criarOportunidadeServer({
        titulo: tituloVaga,
        empresa: empresa || "Universidade Kimpa Vita",
        tipo: tipoVaga,
        descricao,
        requisitos,
        dataLimite: dataLimite ? new Date(dataLimite).toISOString() : undefined,
        criadoPor: usuarioAtual.id,
      });

      if (res.error) {
        setErro(res.error);
        return;
      }

      setSucesso("Oportunidade académica publicada com sucesso!");
      setTituloVaga("");
      setEmpresa("");
      setDescricao("");
      setRequisitos("");
      setModalPublicar(false);
      router.refresh();
    });
  };

  const vagasFiltradas = oportunidades.filter((v) => {
    const combinaTexto =
      v.titulo.toLowerCase().includes(filtro.toLowerCase()) ||
      v.empresa.toLowerCase().includes(filtro.toLowerCase()) ||
      v.descricao.toLowerCase().includes(filtro.toLowerCase());

    const combinaTipo = filtroTipo === "TODOS" || v.tipo === filtroTipo;

    return combinaTexto && combinaTipo;
  });

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "aprovado":
        return <span className="rounded-full bg-emerald-600 text-white px-2.5 py-0.5 text-[10px] font-black">APROVADO</span>;
      case "entrevistado":
        return <span className="rounded-full bg-blue-600 text-white px-2.5 py-0.5 text-[10px] font-black">ENTREVISTADO</span>;
      case "rejeitado":
        return <span className="rounded-full bg-rose-600 text-white px-2.5 py-0.5 text-[10px] font-black">REJEITADO</span>;
      default:
        return <span className="rounded-full bg-amber-500 text-white px-2.5 py-0.5 text-[10px] font-black">PENDENTE</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Alertas */}
      {sucesso && <p className="rounded-2xl bg-emerald-50 p-4 text-xs font-bold text-emerald-800 border border-emerald-200">{sucesso}</p>}
      {erro && <p className="rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-800 border border-rose-200">{erro}</p>}

      {/* Cabeçalho e Abas */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAbaAtiva("vagas")}
            className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
              abaAtiva === "vagas" ? "bg-brand-blue text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Vagas & Oportunidades ({oportunidades.length})
          </button>
          {!ehDocenteOuStaff && (
            <button
              type="button"
              onClick={() => setAbaAtiva("minhas")}
              className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
                abaAtiva === "minhas" ? "bg-brand-blue text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Minhas Candidaturas ({minhasCandidaturas.length})
            </button>
          )}
          {ehDocenteOuStaff && (
            <button
              type="button"
              onClick={() => setAbaAtiva("gestao")}
              className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
                abaAtiva === "gestao" ? "bg-brand-blue text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Gestão de Candidatos ({todasCandidaturasParaDocente.length})
            </button>
          )}
        </div>

        {ehDocenteOuStaff && (
          <button
            type="button"
            onClick={() => setModalPublicar(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
          >
            <Plus className="h-4 w-4" /> Publicar Vaga de Estágio
          </button>
        )}
      </div>

      {/* ABA 1: Vagas Disponíveis */}
      {abaAtiva === "vagas" && (
        <div className="space-y-6">
          {/* Filtros */}
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar por vaga, empresa ou palavra-chave..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Filtrar por tipo:</span>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 outline-none"
              >
                <option value="TODOS">Todos os Tipos</option>
                <option value="estagio">Estágio Académico / Profissional</option>
                <option value="emprego">Oportunidade de Emprego</option>
                <option value="pesquisa">Projeto de Pesquisa / Iniciação</option>
              </select>
            </div>
          </div>

          {/* Cards de Vagas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vagasFiltradas.length > 0 ? (
              vagasFiltradas.map((vaga) => {
                const jaCandidatado = Boolean(vaga.candidaturaAtual);

                return (
                  <div key={vaga.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-brand-blue/30 transition">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-[10px] font-black text-brand-blue uppercase">
                          {vaga.tipo}
                        </span>
                        {vaga.dataLimite && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                            <Clock className="h-3 w-3" /> Limite: {new Date(vaga.dataLimite).toLocaleDateString("pt-AO")}
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-base font-black text-slate-900">{vaga.titulo}</h3>
                        <p className="mt-0.5 text-xs font-bold text-slate-600 flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" /> {vaga.empresa}
                        </p>
                      </div>

                      <p className="text-xs leading-5 text-slate-600 line-clamp-3">{vaga.descricao}</p>

                      {vaga.requisitos && (
                        <div className="rounded-2xl bg-slate-50 p-3 text-[11px] text-slate-600 border border-slate-100">
                          <strong className="font-bold text-slate-700">Requisitos:</strong> {vaga.requisitos}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      {jaCandidatado ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span className="text-xs font-extrabold text-slate-700">Candidatado</span>
                          {vaga.candidaturaAtual && getEstadoBadge(vaga.candidaturaAtual.estado)}
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={pendente || ehDocenteOuStaff}
                          onClick={() => submeterCandidatura(vaga.id)}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-blue px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-brand-blue-dark disabled:opacity-60 transition"
                        >
                          {pendente ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          Candidatar-me a esta Vaga
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
                <Briefcase className="mx-auto h-10 w-10 text-slate-300" />
                <h3 className="mt-3 text-sm font-bold text-slate-800">Nenhuma oportunidade encontrada</h3>
                <p className="mt-1 text-xs text-slate-500">Ajuste os filtros de pesquisa para visualizar outras vagas de estágio e emprego.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 2: Minhas Candidaturas (Para Estudantes) */}
      {abaAtiva === "minhas" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Histórico de Candidaturas</h3>
          <div className="divide-y divide-slate-100">
            {minhasCandidaturas.length > 0 ? (
              minhasCandidaturas.map((c) => (
                <div key={c.idCandidatura} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">{c.tituloVaga}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Empresa: {c.empresa} · Tipo: {c.tipo.toUpperCase()}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Submetida em: {new Date(c.dataCandidatura).toLocaleDateString("pt-AO")}</p>
                  </div>
                  <div>{getEstadoBadge(c.estado)}</div>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-xs text-slate-500 italic">Ainda não submeteu candidaturas a oportunidades de estágio.</p>
            )}
          </div>
        </div>
      )}

      {/* ABA 3: Gestão de Candidatos (Para Docentes/Staff) */}
      {abaAtiva === "gestao" && ehDocenteOuStaff && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Candidaturas Recebidas</h3>
          <div className="divide-y divide-slate-100">
            {todasCandidaturasParaDocente.length > 0 ? (
              todasCandidaturasParaDocente.map((c) => (
                <div key={c.idCandidatura} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">{c.estudanteNome || "Estudante UKV"}</h4>
                    <p className="text-xs text-slate-600 mt-0.5">Vaga: {c.tituloVaga} ({c.empresa})</p>
                    <p className="text-[10px] text-slate-400 mt-1">Email: {c.estudanteEmail || "-"} · Submetida em: {new Date(c.dataCandidatura).toLocaleDateString("pt-AO")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={c.estado}
                      onChange={(e) => alterarEstado(c.idCandidatura, e.target.value)}
                      disabled={pendente}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 outline-none"
                    >
                      <option value="pendente">Pendente</option>
                      <option value="entrevistado">Entrevistado</option>
                      <option value="aprovado">Aprovado</option>
                      <option value="rejeitado">Rejeitado</option>
                    </select>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-xs text-slate-500 italic">Nenhuma candidatura recebida até ao momento.</p>
            )}
          </div>
        </div>
      )}

      {/* Modal de Publicação de Vagas */}
      {modalPublicar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Publicar Vaga de Estágio / Oportunidade</h3>
              <button type="button" onClick={() => setModalPublicar(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={publicarNovaVaga} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Título da Vaga *</label>
                <input
                  type="text"
                  placeholder="Ex: Estágio em Desenvolvimento Web & SQL"
                  value={tituloVaga}
                  onChange={(e) => setTituloVaga(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Empresa / Instituição</label>
                  <input
                    type="text"
                    placeholder="Ex: Universidade Kimpa Vita / Sonangol"
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Tipo de Vaga</label>
                  <select
                    value={tipoVaga}
                    onChange={(e) => setTipoVaga(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 outline-none"
                  >
                    <option value="estagio">Estágio Académico</option>
                    <option value="emprego">Emprego / Trabalho</option>
                    <option value="pesquisa">Projeto de Pesquisa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Requisitos Básicos</label>
                <input
                  type="text"
                  placeholder="Ex: Estudante de 3º/4º ano de Engenharia Informática, conhecimentos de SQL"
                  value={requisitos}
                  onChange={(e) => setRequisitos(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Descrição Detalhada *</label>
                <textarea
                  rows={3}
                  placeholder="Descreva as responsabilidades da vaga..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Data Limite de Candidatura</label>
                <input
                  type="date"
                  value={dataLimite}
                  onChange={(e) => setDataLimite(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setModalPublicar(false)} className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
                <button type="submit" disabled={pendente} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-60">
                  {pendente ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Publicar Anúncio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
