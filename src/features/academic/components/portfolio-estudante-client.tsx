"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Award, FolderGit2, GraduationCap, Star, Sparkles, CheckCircle2, Code, ShieldCheck, Loader2, Save, Plus, Send, Clock, X, FileText, Image as ImageIcon, ExternalLink } from "lucide-react";
import { criarProjetoVitrineServer } from "@/features/feed/actions";
import { atualizarHabilidadesEstudanteServer } from "../careers.actions";

export type HabilidadeItem = {
  idHabilidade: number;
  nomeHabilidade: string;
  nomeCompetencia: string;
  nivel: number;
};

export type ProjetoVitrineItem = {
  id: number;
  tituloProjeto: string;
  descricao: string;
  urlRepositorio?: string | null;
  urlDemonstracao?: string | null;
  urlImagem?: string | null;
  urlAnexo?: string | null;
  totalCurtidas: number;
  dataPublicacao: string;
  autorizado: boolean;
};

interface PortfolioEstudanteClientProps {
  estudante: {
    id: number;
    nome: string;
    email: string;
    numEstudante?: string | null;
    numBi?: string | null;
    fotoPerfil?: string | null;
    bio?: string | null;
    cursoNome?: string;
  };
  reputacao: {
    pontos: number;
    nivel: string;
    mentoriasRealizadas: number;
    projetosPublicados: number;
    feedbackPositivo: number;
  };
  habilidades: HabilidadeItem[];
  todasHabilidadesDisponiveis: Array<{
    idHabilidade: number;
    nomeHabilidade: string;
    nomeCompetencia: string;
  }>;
  projetos: ProjetoVitrineItem[];
}

export function PortfolioEstudanteClient({
  estudante,
  reputacao,
  habilidades: habilidadesIniciais,
  todasHabilidadesDisponiveis,
  projetos,
}: PortfolioEstudanteClientProps) {
  const router = useRouter();
  const [habilidades, setHabilidades] = useState<HabilidadeItem[]>(habilidadesIniciais);
  const [editando, setEditando] = useState(false);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciarTransicao] = useTransition();

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [tituloNovo, setTituloNovo] = useState("");
  const [descricaoNova, setDescricaoNova] = useState("");
  const [repoNovo, setRepoNovo] = useState("");
  const [demoNova, setDemoNova] = useState("");
  const [imagemNova, setImagemNova] = useState("");
  const [anexoNovo, setAnexoNovo] = useState("");
  const [aSubirFicheiro, setASubirFicheiro] = useState("");

  const subirFicheiro = async (ficheiro: File, tipo: "imagem" | "anexo") => {
    setErro(null);
    setSucesso(null);
    setASubirFicheiro(tipo);

    try {
      const formData = new FormData();
      formData.append("file", ficheiro);
      formData.append("tipo", "projeto");

      const resposta = await fetch("/api/upload", { method: "POST", body: formData });
      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.error || "Erro ao carregar o ficheiro.");
        return;
      }

      if (tipo === "imagem") setImagemNova(dados.url);
      else setAnexoNovo(dados.url);
    } catch {
      setErro("Erro ao carregar o ficheiro. Tente novamente.");
    } finally {
      setASubirFicheiro("");
    }
  };

  const submeterProjeto = () => {
    setErro(null);
    setSucesso(null);

    iniciarTransicao(async () => {
      const res = await criarProjetoVitrineServer({
        tituloProjeto: tituloNovo,
        descricao: descricaoNova,
        urlRepositorio: repoNovo.trim() ? repoNovo : undefined,
        urlDemonstracao: demoNova.trim() ? demoNova : undefined,
        urlImagem: imagemNova.trim() ? imagemNova : undefined,
        urlAnexo: anexoNovo.trim() ? anexoNovo : undefined,
      });
      if (res.erro) {
        setErro(res.erro);
        return;
      }

      setSucesso("Projeto submetido! Ficou registado na sua vitrine e será analisado por um professor para autorização.");
      setMostrarFormulario(false);
      setTituloNovo("");
      setDescricaoNova("");
      setRepoNovo("");
      setDemoNova("");
      setImagemNova("");
      setAnexoNovo("");
      router.refresh();
    });
  };

  const alterarNivelHabilidade = (idHabilidade: number, novoNivel: number) => {
    setHabilidades((prev) => {
      const idx = prev.findIndex((h) => h.idHabilidade === idHabilidade);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], nivel: novoNivel };
        return copy;
      } else {
        const itemInfo = todasHabilidadesDisponiveis.find((h) => h.idHabilidade === idHabilidade);
        if (!itemInfo) return prev;
        return [...prev, { ...itemInfo, nivel: novoNivel }];
      }
    });
  };

  const guardarHabilidades = () => {
    setErro(null);
    setSucesso(null);

    iniciarTransicao(async () => {
      const payload = habilidades.map((h) => ({ idHabilidade: h.idHabilidade, nivel: h.nivel }));
      const res = await atualizarHabilidadesEstudanteServer(payload);
      if (res.error) {
        setErro(res.error);
        return;
      }

      setSucesso("Habilidades e proficiências atualizadas no seu portfólio!");
      setEditando(false);
      router.refresh();
    });
  };

  const getBadgeMedalha = (nivel: string) => {
    switch (nivel.toLowerCase()) {
      case "ouro":
        return <span className="rounded-full bg-amber-500 text-white px-3 py-1 text-xs font-black shadow-xs">🥇 NÍVEL OURO</span>;
      case "prata":
        return <span className="rounded-full bg-slate-400 text-white px-3 py-1 text-xs font-black shadow-xs">🥈 NÍVEL PRATA</span>;
      case "bronze":
        return <span className="rounded-full bg-amber-700 text-white px-3 py-1 text-xs font-black shadow-xs">🥉 NÍVEL BRONZE</span>;
      default:
        return <span className="rounded-full bg-brand-blue text-white px-3 py-1 text-xs font-black shadow-xs">🎓 INICIANTE</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Alertas */}
      {sucesso && <p className="rounded-2xl bg-emerald-50 p-4 text-xs font-bold text-emerald-800 border border-emerald-200">{sucesso}</p>}
      {erro && <p className="rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-800 border border-rose-200">{erro}</p>}

      {/* Cartão de Identidade Académica & Reputação */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-blue to-brand-green text-2xl font-black text-white shadow-md">
            {estudante.nome.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">{estudante.nome}</h2>
              {getBadgeMedalha(reputacao.nivel)}
            </div>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              Nº Estudante: <strong className="text-slate-700">{estudante.numEstudante || "-"}</strong> · Curso: <strong className="text-slate-700">{estudante.cursoNome || "Engenharia / UKV"}</strong>
            </p>
            <p className="mt-0.5 text-xs text-slate-400 font-mono">BI: {estudante.numBi || "000000000UE000"}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pontos UKV</p>
            <p className="text-xl font-black text-brand-blue">{reputacao.pontos}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mentorias</p>
            <p className="text-xl font-black text-emerald-600">{reputacao.mentoriasRealizadas}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Projetos</p>
            <p className="text-xl font-black text-purple-600">{reputacao.projetosPublicados}</p>
          </div>
        </div>
      </div>

      {/* Portfólio de Habilidades */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Code className="h-4 w-4 text-brand-blue" /> Competências & Habilidades Técnicas
          </h3>
          {editando ? (
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setEditando(false)} className="rounded-2xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600">Cancelar</button>
              <button type="button" disabled={pendente} onClick={guardarHabilidades} className="inline-flex items-center gap-1.5 rounded-2xl bg-brand-blue px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-brand-blue-dark">
                {pendente ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Guardar
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setEditando(true)} className="rounded-2xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200">
              Editar Habilidades
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {habilidades.length > 0 ? (
            habilidades.map((h) => (
              <div key={h.idHabilidade} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-900">{h.nomeHabilidade}</span>
                  <span className="font-bold text-brand-blue">Nível {h.nivel}/5</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full bg-gradient-to-r from-brand-blue to-brand-green" style={{ width: `${(h.nivel / 5) * 100}%` }} />
                </div>
                {editando && (
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={h.nivel}
                    onChange={(e) => alterarNivelHabilidade(h.idHabilidade, Number(e.target.value))}
                    className="w-full accent-brand-blue cursor-pointer"
                  />
                )}
              </div>
            ))
          ) : (
            <p className="col-span-full py-4 text-center text-xs text-slate-500 italic">Nenhuma habilidade adicionada ao seu portfólio.</p>
          )}
        </div>
      </div>

      {/* Vitrine de Projetos Publicados */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <FolderGit2 className="h-4 w-4 text-brand-blue" /> Projetos da Vitrine
          </h3>
          <button
            type="button"
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-brand-blue px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-brand-blue-dark"
          >
            {mostrarFormulario ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {mostrarFormulario ? "Fechar" : "Submeter projeto"}
          </button>
        </div>

        {mostrarFormulario && (
          <form
            className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-4"
            onSubmit={(evento) => {
              evento.preventDefault();
              submeterProjeto();
            }}
          >
            <p className="text-xs font-bold text-slate-700">
              Submete o teu projeto. Depois de submetido, um professor autoriza a publicação pública na vitrine.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="titulo-projeto" className="text-xs font-bold text-slate-600">Título do projeto *</label>
                <input
                  id="titulo-projeto"
                  value={tituloNovo}
                  onChange={(e) => setTituloNovo(e.target.value)}
                  maxLength={150}
                  required
                  placeholder="Ex.: Portal de Matrículas Académicas"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus-visible:outline-brand-blue"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="descricao-projeto" className="text-xs font-bold text-slate-600">Descrição *</label>
                <textarea
                  id="descricao-projeto"
                  value={descricaoNova}
                  onChange={(e) => setDescricaoNova(e.target.value)}
                  maxLength={2000}
                  required
                  rows={4}
                  placeholder="Explica o objetivo, tecnologias e resultados do projeto..."
                  className="mt-1 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus-visible:outline-brand-blue"
                />
              </div>
              <div>
                <label htmlFor="repo-projeto" className="text-xs font-bold text-slate-600">Repositório (GitHub)</label>
                <input
                  id="repo-projeto"
                  value={repoNovo}
                  onChange={(e) => setRepoNovo(e.target.value)}
                  maxLength={255}
                  placeholder="https://github.com/..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus-visible:outline-brand-blue"
                />
              </div>
              <div>
                <label htmlFor="demo-projeto" className="text-xs font-bold text-slate-600">Demonstração (URL)</label>
                <input
                  id="demo-projeto"
                  value={demoNova}
                  onChange={(e) => setDemoNova(e.target.value)}
                  maxLength={255}
                  placeholder="https://demo.domain.ao"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus-visible:outline-brand-blue"
                />
              </div>
              <div>
                <label htmlFor="imagem-projeto" className="text-xs font-bold text-slate-600">Imagem de capa</label>
                <div className="mt-1 flex items-center gap-2">
                  <label htmlFor="imagem-projeto" className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:border-brand-blue hover:text-brand-blue">
                    {aSubirFicheiro === "imagem" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
                    {imagemNova ? "Alterar imagem" : "Escolher imagem (PNG, JPG, WEBP)"}
                    {imagemNova && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                  </label>
                  {imagemNova && (
                    <button type="button" onClick={() => setImagemNova("")} title="Remover imagem" className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:text-rose-600">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <input
                  id="imagem-projeto"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  className="hidden"
                  disabled={aSubirFicheiro === "imagem"}
                  onChange={async (e) => {
                    const ficheiro = e.target.files?.[0];
                    if (ficheiro) await subirFicheiro(ficheiro, "imagem");
                    e.target.value = "";
                  }}
                />
                {imagemNova && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagemNova} alt="Pré-visualização" className="mt-2 h-28 w-full rounded-xl object-cover border border-slate-200" />
                )}
              </div>
              <div>
                <label htmlFor="anexo-projeto" className="text-xs font-bold text-slate-600">Documento (PDF, DOC, XLS, PPT, ZIP)</label>
                <div className="mt-1 flex items-center gap-2">
                  <label htmlFor="anexo-projeto" className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:border-brand-blue hover:text-brand-blue">
                    {aSubirFicheiro === "anexo" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                    {anexoNovo ? "Alterar documento" : "Escolher documento (máx. 10MB)"}
                    {anexoNovo && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                  </label>
                  {anexoNovo && (
                    <button type="button" onClick={() => setAnexoNovo("")} title="Remover documento" className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:text-rose-600">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <input
                  id="anexo-projeto"
                  type="file"
                  accept="application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
                  className="hidden"
                  disabled={aSubirFicheiro === "anexo"}
                  onChange={async (e) => {
                    const ficheiro = e.target.files?.[0];
                    if (ficheiro) await subirFicheiro(ficheiro, "anexo");
                    e.target.value = "";
                  }}
                />
                {anexoNovo && (
                  <a href={anexoNovo} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-brand-blue hover:underline">
                    <FileText className="h-3.5 w-3.5" /> Ver documento carregado <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={pendente || !tituloNovo.trim() || !descricaoNova.trim()}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-brand-blue px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pendente ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Submeter para análise
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projetos.length > 0 ? (
            projetos.map((proj) => (
              <div key={proj.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/70 space-y-0">
                {proj.urlImagem && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={proj.urlImagem} alt={proj.tituloProjeto} className="h-32 w-full object-cover" />
                )}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-extrabold text-slate-900">{proj.tituloProjeto}</h4>
                    {proj.autorizado ? (
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" /> Autorizado
                      </span>
                    ) : (
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                        <Clock className="h-3 w-3" /> Em análise
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{proj.descricao}</p>
                  {proj.urlAnexo && (
                    <a href={proj.urlAnexo} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-brand-blue hover:underline">
                      <FileText className="h-3.5 w-3.5" /> Ver documento <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{proj.totalCurtidas} curtidas</span>
                    {proj.urlRepositorio && (
                      <a href={proj.urlRepositorio} target="_blank" rel="noreferrer" className="font-bold text-brand-blue hover:underline">
                        Ver Repositório GitHub ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="col-span-full py-4 text-center text-xs text-slate-500 italic">
              Ainda não publicou projetos na Vitrine Académica. Submeta o seu primeiro projeto!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
