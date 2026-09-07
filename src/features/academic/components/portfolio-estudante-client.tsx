"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Award, FolderGit2, GraduationCap, Star, Sparkles, CheckCircle2, Code, ShieldCheck, Loader2, Save } from "lucide-react";
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
  totalCurtidas: number;
  dataPublicacao: string;
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
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <FolderGit2 className="h-4 w-4 text-brand-blue" /> Projetos da Vitrine
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projetos.length > 0 ? (
            projetos.map((proj) => (
              <div key={proj.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
                <h4 className="text-sm font-extrabold text-slate-900">{proj.tituloProjeto}</h4>
                <p className="text-xs text-slate-600 line-clamp-2">{proj.descricao}</p>
                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{proj.totalCurtidas} curtidas</span>
                  {proj.urlRepositorio && (
                    <a href={proj.urlRepositorio} target="_blank" rel="noreferrer" className="font-bold text-brand-blue hover:underline">
                      Ver Repositório GitHub ↗
                    </a>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="col-span-full py-4 text-center text-xs text-slate-500 italic">Ainda não publicou projetos na Vitrine Académica.</p>
          )}
        </div>
      </div>
    </div>
  );
}
