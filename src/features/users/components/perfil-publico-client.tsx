"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Award,
  Briefcase,
  CalendarDays,
  FileText,
  GraduationCap,
  Heart,
  Link as LinkIcon,
  MessageCircle,
  MessagesSquare,
  PenLine,
  Phone,
  Sparkles,
  ThumbsUp,
  User as UserIcon,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { alternarAcompanharUsuarioServer } from "@/features/messaging/actions";

type PerfilPublicoData = {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  numBi: string | null;
  numEstudanteLogin: string | null;
  fotoPerfil: string | null;
  bio: string | null;
  dataCriacao: string;
  perfis: { perfil: { nomePerfil: string } }[];
  reputacao: {
    pontos: number;
    nivel: string;
    mentoriasRealizadas: number;
    projetosPublicados: number;
    feedbackPositivo: number;
  }[];
  habilidades: {
    nivelProficiencia: number;
    habilidade: { nomeHabilidade: string; competencia: { nomeCompetencia: string } };
  }[];
  cursos: { curso: { nomeCurso: string } }[];
  matriculas: {
    anoLectivo: number;
    isMentor: boolean;
    turma: { nomeTurma: string; anoCurricular: number; periodo: string; curso: { nomeCurso: string } };
  }[];
  publicacoesCriadas: {
    id: number;
    conteudo: string;
    urlImagem: string | null;
    dataPublicacao: string;
    _count: { gostos: number; comentarios: number };
  }[];
  comentariosCriados: {
    id: number;
    conteudo: string;
    dataPublicacao: string;
    publicacao: { id: number; conteudo: string; autor: { id: number; nome: string } };
  }[];
  projetosAutor: {
    projeto: {
      id: number;
      tituloProjeto: string;
      descricao: string;
      urlRepositorio: string | null;
      urlDemonstracao: string | null;
      urlImagem: string | null;
      urlAnexo: string | null;
      dataPublicacao: string;
      disciplina: { nomeDisciplina: string } | null;
      _count: { curtidores: number };
      autores: { usuario: { id: number; nome: string } }[];
    };
  }[];
  mentorSessoes: { id: number }[];
  alunoSessoes: { id: number }[];
  seguidores: { seguidor: { id: number; nome: string; fotoPerfil: string | null } }[];
  seguindo: { seguido: { id: number; nome: string; fotoPerfil: string | null } }[];
  _count: { seguidores: number; seguindo: number; gostosPublicacoes: number };
  segue: boolean;
  seguidoPeloVisitante: boolean;
};

type Aba = "publicacoes" | "sobre" | "projetos" | "habilidades" | "formacao" | "amigos";

const abas: { id: Aba; rotulo: string }[] = [
  { id: "publicacoes", rotulo: "Publicações" },
  { id: "sobre", rotulo: "Sobre" },
  { id: "projetos", rotulo: "Projetos" },
  { id: "habilidades", rotulo: "Habilidades" },
  { id: "formacao", rotulo: "Formação" },
  { id: "amigos", rotulo: "Rede" },
];

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

function formatarData(data: string | Date) {
  return new Intl.DateTimeFormat("pt-AO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(data));
}

function Abreviar(texto: string, max = 200) {
  const limpo = texto.replace(/\s+/g, " ").trim();
  return limpo.length > max ? limpo.slice(0, max) + "…" : limpo;
}

function FotoMembro({ nome, foto }: { nome: string; foto: string | null }) {
  if (foto) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={foto} alt={`Foto de ${nome}`} className="h-10 w-10 rounded-xl border border-slate-200 object-cover" />;
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-green text-xs font-black text-white">
      {iniciais(nome)}
    </div>
  );
}

const rotulosNivel = ["", "Iniciante", "Básico", "Médio", "Avançado", "Especialista"];

export function PerfilPublicoClient({
  perfil,
  visitanteAutenticado,
  visitaPropria,
}: {
  perfil: PerfilPublicoData;
  visitanteAutenticado: boolean;
  visitaPropria: boolean;
}) {
  const router = useRouter();
  const [aba, setAba] = useState<Aba>("publicacoes");
  const [estaSeguindo, setEstaSeguindo] = useState(perfil.segue);
  const [pendente, setPendente] = useState(false);
  const [, transicao] = useTransition();

  const reputacao = perfil.reputacao[0];
  const papeis = perfil.perfis.map((p) => p.perfil.nomePerfil);
  const ehMentor = perfil.matriculas.some((m) => m.isMentor) || perfil.mentorSessoes.length > 0;
  const temBio = Boolean(perfil.bio?.trim());

  function alternarSeguir() {
    setPendente(true);
    transicao(async () => {
      const resultado = await alternarAcompanharUsuarioServer(perfil.id);
      if (resultado.success !== undefined) {
        setEstaSeguindo(Boolean(resultado.seguindo));
        router.refresh();
      }
      setPendente(false);
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
      {/* Capa + avatar + ações */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        <div className="relative">
          <div className="h-44 bg-gradient-to-r from-brand-blue via-slate-200 to-brand-green sm:h-56" />
          <div className="absolute -bottom-7 left-6">
            {perfil.fotoPerfil ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={perfil.fotoPerfil}
                alt={`Foto de ${perfil.nome}`}
                className="h-28 w-28 rounded-2xl border-4 border-white bg-white object-cover shadow-lg sm:h-32 sm:w-32"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-brand-blue to-brand-green text-3xl font-black text-white shadow-lg sm:h-32 sm:w-32">
                {iniciais(perfil.nome)}
              </div>
            )}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 px-6 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">{perfil.nome}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {papeis.map((papel) => (
                <span
                  key={papel}
                  className="rounded-full border border-brand-blue/20 bg-brand-blue/10 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-blue"
                >
                  {papel}
                </span>
              ))}
              {ehMentor && (
                <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  Mentor
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {visitaPropria ? (
              <Link
                href="/perfil"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <PenLine className="h-4 w-4" /> Editar perfil
              </Link>
            ) : visitanteAutenticado ? (
              <button
                type="button"
                onClick={alternarSeguir}
                disabled={pendente}
                className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:opacity-60 ${
                  estaSeguindo
                    ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    : "bg-brand-blue text-white hover:bg-brand-blue/90"
                }`}
              >
                {pendente ? (
                  "Aguarde…"
                ) : estaSeguindo ? (
                  <>
                    <UserCheck className="h-4 w-4" /> A acompanhar
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" /> Seguir
                  </>
                )}
              </button>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-blue/90"
              >
                <UserPlus className="h-4 w-4" /> Entrar para seguir
              </Link>
            )}
          </div>
        </div>

        {/* Separadores */}
        <div className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 pt-0">
          {abas.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setAba(item.id)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold transition ${
                aba === item.id
                  ? "border-brand-blue text-brand-blue"
                  : "border-transparent text-slate-500 hover:bg-slate-50"
              }`}
            >
              {item.rotulo}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Coluna lateral */}
        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserIcon className="h-4 w-4 text-brand-blue" />
              <h3 className="text-sm font-black text-slate-900">Sobre</h3>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <p className="leading-relaxed text-slate-600">
                {temBio ? perfil.bio : "Este utilizador ainda não adicionou uma descrição."}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <GraduationCap className="h-4 w-4 shrink-0 text-brand-blue" />
                <span className="truncate">
                  {perfil.matriculas[0] ? perfil.matriculas[0].turma.curso.nomeCurso : "Membro da comunidade"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAba("sobre")}
                className="w-full rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
              >
                Ver informações completas
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-brand-blue" />
                <h3 className="text-sm font-black text-slate-900">Rede</h3>
              </div>
              <button type="button" onClick={() => setAba("amigos")} className="text-xs font-bold text-brand-blue hover:underline">
                Ver tudo
              </button>
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <p className="text-xs text-slate-500">
                <span className="font-black text-slate-800">{perfil._count.seguidores}</span> seguidores ·{" "}
                <span className="font-black text-slate-800">{perfil._count.seguindo}</span> a seguir
              </p>
              <div className="flex flex-wrap gap-2">
                {perfil.seguidores.slice(0, 8).map((s) => (
                  <Link key={s.seguidor.id} href={`/perfil/${s.seguidor.id}`} title={s.seguidor.nome} className="transition hover:opacity-80">
                    <FotoMembro nome={s.seguidor.nome} foto={s.seguidor.fotoPerfil} />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {reputacao && (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Award className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-black text-slate-900">Reputação</h3>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Pontos</span>
                  <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-black text-brand-blue">{reputacao.pontos}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Nível</span>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black capitalize text-amber-700">{reputacao.nivel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Mentorias</span>
                  <span className="text-sm font-black text-slate-800">{reputacao.mentoriasRealizadas}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Feedback +</span>
                  <span className="text-sm font-black text-emerald-600">{reputacao.feedbackPositivo}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAba("sobre")}
                  className="w-full rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                >
                  Ver reputação completa
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* Coluna principal */}
        <section className="min-w-0 space-y-6">
          {aba === "publicacoes" && (
            <>
              {perfil.publicacoesCriadas.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
                  <MessagesSquare className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-sm font-bold text-slate-700">Ainda não existem publicações</p>
                  <p className="mt-1 text-xs text-slate-500">As partilhas de {perfil.nome.split(" ")[0]} aparecerão aqui.</p>
                </div>
              ) : (
                perfil.publicacoesCriadas.map((publicacao) => (
                  <article key={publicacao.id} className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <FotoMembro nome={perfil.nome} foto={perfil.fotoPerfil} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-slate-900">{perfil.nome}</p>
                        <span className="text-xs text-slate-400">{formatarData(publicacao.dataPublicacao)}</span>
                      </div>
                    </div>
                    {publicacao.urlImagem && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={publicacao.urlImagem}
                        alt="Anexo da publicação"
                        className="mt-4 max-h-80 w-full rounded-2xl border border-slate-200 bg-white object-cover"
                      />
                    )}
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{publicacao.conteudo}</p>
                    <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3 text-xs font-bold text-slate-400">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3.5 w-3.5 text-brand-blue" /> {publicacao._count.gostos} gostos
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5 text-brand-green" /> {publicacao._count.comentarios} comentários
                      </span>
                    </div>
                  </article>
                ))
              )}
            </>
          )}

          {aba === "sobre" && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <h3 className="text-base font-black text-slate-900">Informações completas</h3>
                <div className="mt-5 space-y-4 text-sm">
                  <div className="flex items-center gap-3">
                    <UserIcon className="h-4 w-4 shrink-0 text-brand-blue" />
                    <span className="text-slate-500">Nome</span>
                    <span className="ml-auto font-bold text-slate-800">{perfil.nome}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-4 w-4 shrink-0 text-brand-blue" />
                    <span className="text-slate-500">Email</span>
                    <span className="ml-auto font-bold text-slate-800">{perfil.email}</span>
                  </div>
                  {perfil.telefone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 shrink-0 text-brand-blue" />
                      <span className="text-slate-500">Telefone</span>
                      <span className="ml-auto font-bold text-slate-800">{perfil.telefone}</span>
                    </div>
                  )}
                  {perfil.numEstudanteLogin && (
                    <div className="flex items-center gap-3">
                      <GraduationCap className="h-4 w-4 shrink-0 text-brand-blue" />
                      <span className="text-slate-500">Nº de estudante</span>
                      <span className="ml-auto font-bold text-slate-800">{perfil.numEstudanteLogin}</span>
                    </div>
                  )}
                  {perfil.numBi && (
                    <div className="flex items-center gap-3">
                      <UserIcon className="h-4 w-4 shrink-0 text-brand-blue" />
                      <span className="text-slate-500">Nº do BI</span>
                      <span className="ml-auto font-bold text-slate-800">{perfil.numBi}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-4 w-4 shrink-0 text-brand-blue" />
                    <span className="text-slate-500">Membro desde</span>
                    <span className="ml-auto font-bold text-slate-800">{formatarData(perfil.dataCriacao)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Award className="h-4 w-4 shrink-0 text-brand-blue" />
                    <span className="text-slate-500">Papéis</span>
                    <span className="ml-auto font-bold uppercase tracking-wider text-slate-800">{papeis.join(" · ")}</span>
                  </div>
                </div>
              </div>

              {reputacao && (
                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
                  <h3 className="text-base font-black text-slate-900">Reputação académica</h3>
                  <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-5">
                    {[
                      { rotulo: "Pontos", valor: String(reputacao.pontos), cor: "text-slate-900" },
                      { rotulo: "Nível", valor: reputacao.nivel, cor: "text-brand-blue capitalize" },
                      { rotulo: "Mentorias", valor: String(reputacao.mentoriasRealizadas), cor: "text-slate-900" },
                      { rotulo: "Projetos", valor: String(reputacao.projetosPublicados), cor: "text-slate-900" },
                      { rotulo: "Feedback +", valor: String(reputacao.feedbackPositivo), cor: "text-emerald-600" },
                    ].map((box) => (
                      <div key={box.rotulo} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                        <p className={`text-2xl font-black ${box.cor}`}>{box.valor}</p>
                        <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">{box.rotulo}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {aba === "projetos" && (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Projetos</h3>
                  <p className="mt-0.5 text-xs text-slate-500">{perfil.projetosAutor.length} projeto(s) na vitrine.</p>
                </div>
                <div className="rounded-xl bg-brand-green/10 p-2 text-brand-green">
                  <Briefcase className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {perfil.projetosAutor.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 md:col-span-2">
                    Ainda não participou em projetos da vitrine.
                  </p>
                ) : (
                  perfil.projetosAutor.map(({ projeto }) => (
                    <div key={projeto.id} className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
                      {projeto.urlImagem && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={projeto.urlImagem} alt={projeto.tituloProjeto} className="h-32 w-full object-cover" />
                      )}
                      <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-base font-black text-slate-900">{projeto.tituloProjeto}</p>
                          <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            {projeto.disciplina ? projeto.disciplina.nomeDisciplina : "Projeto"}
                          </p>
                        </div>
                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600">
                          <Heart className="h-3 w-3" /> {projeto._count.curtidores}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-slate-600">{Abreviar(projeto.descricao, 180)}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {projeto.autores.map(({ usuario }) => (
                          <Link
                            key={usuario.id}
                            href={`/perfil/${usuario.id}`}
                            className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 transition hover:bg-brand-blue/10 hover:text-brand-blue"
                          >
                            {usuario.nome}
                          </Link>
                        ))}
                      </div>
                      {(projeto.urlRepositorio || projeto.urlDemonstracao || projeto.urlAnexo) && (
                        <div className="mt-3 flex flex-wrap gap-3">
                          {projeto.urlRepositorio && (
                            <a
                              href={projeto.urlRepositorio}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-bold text-brand-blue hover:underline"
                            >
                              <LinkIcon className="h-3.5 w-3.5" /> Código
                            </a>
                          )}
                          {projeto.urlDemonstracao && (
                            <a
                              href={projeto.urlDemonstracao}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-bold text-brand-green hover:underline"
                            >
                              <Sparkles className="h-3.5 w-3.5" /> Demo
                            </a>
                          )}
                          {projeto.urlAnexo && (
                            <a
                              href={projeto.urlAnexo}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
                            >
                              <FileText className="h-3.5 w-3.5" /> Documento
                            </a>
                          )}
                        </div>
                      )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {aba === "habilidades" && (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Habilidades</h3>
                  <p className="mt-0.5 text-xs text-slate-500">Competências técnicas registadas.</p>
                </div>
                <div className="rounded-xl bg-violet-50 p-2 text-violet-600">
                  <Award className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {perfil.habilidades.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                    Sem habilidades registadas.
                  </p>
                ) : (
                  perfil.habilidades.map((h, index) => (
                    <div
                      key={`habilidade-${index}`}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800">{h.habilidade.nomeHabilidade}</p>
                        <p className="text-[11px] text-slate-400">{h.habilidade.competencia.nomeCompetencia}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-brand-blue/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-blue">
                        {rotulosNivel[h.nivelProficiencia] || "Médio"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {aba === "formacao" && (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Formação académica</h3>
                  <p className="mt-0.5 text-xs text-slate-500">Cursos, turmas e vínculos atuais.</p>
                </div>
                <div className="rounded-xl bg-brand-blue/10 p-2 text-brand-blue">
                  <GraduationCap className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {perfil.matriculas.length === 0 && perfil.cursos.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                    Sem vínculos académicos registados.
                  </p>
                ) : (
                  <>
                    {perfil.matriculas.map((m, index) => (
                      <div key={`matricula-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-bold text-slate-800">{m.turma.curso.nomeCurso}</p>
                          {m.isMentor && (
                            <span className="shrink-0 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                              Mentor
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Turma {m.turma.nomeTurma} · Ano curricular {m.turma.anoCurricular} · {m.turma.periodo}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">Ano letivo {m.anoLectivo}</p>
                      </div>
                    ))}
                    {perfil.cursos
                      .filter((c) => !perfil.matriculas.some((m) => m.turma.curso.nomeCurso === c.curso.nomeCurso))
                      .map((c, index) => (
                        <div
                          key={`curso-${index}`}
                          className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-sm font-bold text-slate-800"
                        >
                          {c.curso.nomeCurso}
                        </div>
                      ))}
                  </>
                )}
              </div>
            </div>
          )}

          {aba === "amigos" && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <h3 className="text-base font-black text-slate-900">
                  Seguidores <span className="text-slate-400">({perfil._count.seguidores})</span>
                </h3>
                {perfil.seguidores.length === 0 ? (
                  <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                    Ainda sem seguidores.
                  </p>
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {perfil.seguidores.map((s) => (
                      <Link
                        key={s.seguidor.id}
                        href={`/perfil/${s.seguidor.id}`}
                        className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3 transition hover:border-brand-blue/30 hover:bg-white"
                      >
                        <FotoMembro nome={s.seguidor.nome} foto={s.seguidor.fotoPerfil} />
                        <span className="min-w-0 truncate text-sm font-bold text-slate-800">{s.seguidor.nome}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <h3 className="text-base font-black text-slate-900">
                  A seguir <span className="text-slate-400">({perfil._count.seguindo})</span>
                </h3>
                {perfil.seguindo.length === 0 ? (
                  <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                    Ainda não acompanha ninguém.
                  </p>
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {perfil.seguindo.map((s) => (
                      <Link
                        key={s.seguido.id}
                        href={`/perfil/${s.seguido.id}`}
                        className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3 transition hover:border-brand-blue/30 hover:bg-white"
                      >
                        <FotoMembro nome={s.seguido.nome} foto={s.seguido.fotoPerfil} />
                        <span className="min-w-0 truncate text-sm font-bold text-slate-800">{s.seguido.nome}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <h3 className="text-base font-black text-slate-900">Atividade recente</h3>
                <div className="mt-4 space-y-3">
                  {perfil.comentariosCriados.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                      Sem atividade recente.
                    </p>
                  ) : (
                    perfil.comentariosCriados.map((comentario) => (
                      <Link
                        key={comentario.id}
                        href={`/publicacao/${comentario.publicacao.id}`}
                        className="block rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition hover:border-brand-blue/30 hover:bg-white"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-bold text-slate-800">{comentario.publicacao.autor.nome}</p>
                          <span className="shrink-0 text-[11px] text-slate-400">{formatarData(comentario.dataPublicacao)}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Em: {Abreviar(comentario.publicacao.conteudo, 80)}</p>
                        <p className="mt-2 text-sm leading-relaxed text-slate-700">"{Abreviar(comentario.conteudo, 130)}"</p>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}