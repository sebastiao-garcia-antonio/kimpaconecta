"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  Loader2,
  MessageCircle,
  Send,
  ShieldOff,
  Sparkles,
  UserPlus,
  UserCheck,
  ImagePlus,
  X,
  FileText,
  Paperclip,
  CornerUpLeft,
} from "lucide-react";
import {
  alternarGostoPublicacaoServer,
  criarComentarioPublicacaoServer,
  criarPublicacaoServer,
  ocultarPublicacaoServer,
} from "@/features/feed/actions";
import { alternarAcompanharUsuarioServer } from "@/features/messaging/actions";

type UsuarioAtual = {
  id: number;
  nome: string;
  papeis: string[];
};

type ComentarioFeed = {
  id: number;
  conteudo: string;
  dataPublicacao: Date | string;
  autor: {
    id: number;
    nome: string;
    fotoPerfil: string | null;
  };
  respostas?: ComentarioFeed[];
};

type PublicacaoFeed = {
  id: number;
  conteudo: string;
  urlImagem: string | null;
  dataPublicacao: Date | string;
  autor: {
    id: number;
    nome: string;
    fotoPerfil: string | null;
    estaAAcompanhar?: boolean;
  };
  comentarios: ComentarioFeed[];
  gostos: Array<{
    idUsuario: number;
  }>;
  _count: {
    gostos: number;
    comentarios: number;
  };
};

interface FeedComunidadeClientProps {
  publicacoes: PublicacaoFeed[];
  usuarioAtual?: UsuarioAtual;
  mostrarComposer?: boolean;
}

const extensoesImagem = /\.(png|jpe?g|webp|gif|svg|bmp)$/i;

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

function formatarData(data: Date | string) {
  return new Intl.DateTimeFormat("pt-AO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(data));
}

function Avatar({ nome, foto, tamanho = "md" }: { nome: string; foto?: string | null; tamanho?: "md" | "sm" }) {
  const classes = tamanho === "sm" ? "h-7 w-7 rounded-lg text-[10px]" : "h-10 w-10 rounded-xl text-xs";

  if (foto) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={foto} alt={`Foto de ${nome}`} className={`${classes} shrink-0 border border-slate-200 object-cover`} />;
  }

  return (
    <div className={`${classes} flex shrink-0 items-center justify-center bg-gradient-to-br from-brand-blue to-brand-green font-black text-white`}>
      {iniciais(nome)}
    </div>
  );
}

function eImagem(url: string) {
  return extensoesImagem.test(url.split("?")[0]);
}

function nomeDoFicheiro(url: string) {
  const segmentos = url.split("/");
  return segmentos[segmentos.length - 1];
}

export function FeedComunidadeClient({ publicacoes, usuarioAtual, mostrarComposer = true }: FeedComunidadeClientProps) {
  const router = useRouter();
  const inputFicheiroRef = useRef<HTMLInputElement | null>(null);

  const [publicacao, setPublicacao] = useState("");
  const [anexoPublicacao, setAnexoPublicacao] = useState<{ url: string; nome: string; tipo: string } | null>(null);
  const [aCarregarAnexo, setACarregarAnexo] = useState(false);
  const [comentariosAbertos, setComentariosAbertos] = useState<Record<number, boolean>>({});
  const [comentarios, setComentarios] = useState<Record<number, string>>({});
  const [respostasAbertas, setRespostasAbertas] = useState<Record<number, boolean>>({});
  const [respostas, setRespostas] = useState<Record<number, string>>({});
  const [seguindoEstado, setSeguindoEstado] = useState<Record<number, boolean>>({});
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciarTransicao] = useTransition();

  const podeModerar = Boolean(usuarioAtual?.papeis.includes("admin"));

  const atualizarFeed = () => {
    router.refresh();
  };

  const publicar = () => {
    setErro(null);
    setMensagem(null);

    iniciarTransicao(async () => {
      const resposta = await criarPublicacaoServer(publicacao, anexoPublicacao?.url);
      if (resposta.erro) {
        setErro(resposta.erro);
        return;
      }

      setPublicacao("");
      setAnexoPublicacao(null);
      setMensagem("Publicação partilhada com a comunidade.");
      atualizarFeed();
    });
  };

  const anexarFicheiro = async (ficheiro: File) => {
    setErro(null);
    setMensagem(null);
    setACarregarAnexo(true);

    try {
      const dados = new FormData();
      dados.append("file", ficheiro);
      dados.append("tipo", "publicacao");

      const resposta = await fetch("/api/upload", { method: "POST", body: dados });
      const resultado = await resposta.json();

      if (!resposta.ok) {
        setErro(resultado.error || "Não foi possível anexar o ficheiro.");
        return;
      }

      setAnexoPublicacao({ url: resultado.url, nome: resultado.nome || ficheiro.name, tipo: resultado.tipo || "" });
    } catch {
      setErro("Erro ao enviar o ficheiro. Tente novamente.");
    } finally {
      setACarregarAnexo(false);
      if (inputFicheiroRef.current) inputFicheiroRef.current.value = "";
    }
  };

  const alternarAcompanhar = (idAutor: number) => {
    if (!usuarioAtual) return;
    setErro(null);

    iniciarTransicao(async () => {
      const resposta = await alternarAcompanharUsuarioServer(idAutor);
      if (resposta.error) {
        setErro(resposta.error);
        return;
      }

      setSeguindoEstado((prev) => ({ ...prev, [idAutor]: resposta.seguindo ?? false }));
      setMensagem(resposta.seguindo ? "Passou a acompanhar este utilizador! Já pode conversar em privado." : "Deixou de acompanhar.");
      atualizarFeed();
    });
  };

  const alternarGosto = (idPublicacao: number) => {
    setErro(null);

    iniciarTransicao(async () => {
      const resposta = await alternarGostoPublicacaoServer(idPublicacao);
      if (resposta.erro) {
        setErro(resposta.erro);
        return;
      }

      atualizarFeed();
    });
  };

  const comentar = (idPublicacao: number) => {
    const conteudo = comentarios[idPublicacao] || "";
    setErro(null);
    setMensagem(null);

    iniciarTransicao(async () => {
      const resposta = await criarComentarioPublicacaoServer(idPublicacao, conteudo);
      if (resposta.erro) {
        setErro(resposta.erro);
        return;
      }

      setComentarios((estadoActual) => ({ ...estadoActual, [idPublicacao]: "" }));
      setMensagem("Comentário publicado.");
      atualizarFeed();
    });
  };

  const responder = (idPublicacao: number, idComentario: number) => {
    const conteudo = respostas[idComentario] || "";
    setErro(null);
    setMensagem(null);

    iniciarTransicao(async () => {
      const resposta = await criarComentarioPublicacaoServer(idPublicacao, conteudo, idComentario);
      if (resposta.erro) {
        setErro(resposta.erro);
        return;
      }

      setRespostas((estadoActual) => ({ ...estadoActual, [idComentario]: "" }));
      setRespostasAbertas((estadoActual) => ({ ...estadoActual, [idComentario]: false }));
      setMensagem("Resposta enviada.");
      atualizarFeed();
    });
  };

  const ocultar = (idPublicacao: number) => {
    setErro(null);
    setMensagem(null);

    iniciarTransicao(async () => {
      const resposta = await ocultarPublicacaoServer(idPublicacao);
      if (resposta.erro) {
        setErro(resposta.erro);
        return;
      }

      setMensagem("Publicação ocultada da área pública.");
      atualizarFeed();
    });
  };

  const renderizarComentario = (comentario: ComentarioFeed, idPublicacao: number, nivel = 0) => {
    const respostaAberta = respostasAbertas[comentario.id];
    const maxRecuo = 4;

    return (
      <div key={comentario.id} className={`rounded-xl bg-white p-3 ${nivel > 0 ? "ml-3 border-l-2 border-slate-100" : ""}`}>
        <div className="flex items-center gap-2.5">
          <Link href={`/perfil/${comentario.autor.id}`} className="shrink-0 transition hover:opacity-80">
            <Avatar nome={comentario.autor.nome} foto={comentario.autor.fotoPerfil} tamanho="sm" />
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={`/perfil/${comentario.autor.id}`} className="text-sm font-bold text-slate-800 hover:text-brand-blue">
              {comentario.autor.nome}
            </Link>
          </div>
          <span className="text-[11px] text-slate-400">{formatarData(comentario.dataPublicacao)}</span>
        </div>
        <p className="mt-1 text-sm leading-6 text-slate-600">{comentario.conteudo}</p>

        {usuarioAtual && (
          <button
            type="button"
            onClick={() => setRespostasAbertas((estadoActual) => ({ ...estadoActual, [comentario.id]: !respostaAberta }))}
            className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-brand-blue"
          >
            <CornerUpLeft className="h-3.5 w-3.5" /> Responder
          </button>
        )}

        {respostaAberta && usuarioAtual && (
          <form
            className="mt-2 flex gap-2"
            onSubmit={(evento) => {
              evento.preventDefault();
              responder(idPublicacao, comentario.id);
            }}
          >
            <label htmlFor={`resposta-${comentario.id}`} className="sr-only">Responder ao comentário</label>
            <input
              id={`resposta-${comentario.id}`}
              value={respostas[comentario.id] || ""}
              onChange={(evento) => setRespostas((estadoActual) => ({ ...estadoActual, [comentario.id]: evento.target.value }))}
              maxLength={500}
              placeholder={`Responder a ${comentario.autor.nome}...`}
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus-visible:outline-brand-blue"
            />
            <button
              type="submit"
              disabled={pendente || !(respostas[comentario.id] || "").trim()}
              className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Enviar
            </button>
          </form>
        )}

        {comentario.respostas && comentario.respostas.length > 0 && (
          <div className={`space-y-2 ${nivel >= maxRecuo ? "" : "ml-3 border-l-2 border-slate-100 pl-3"} ${nivel > 0 ? "mt-2" : "mt-2"}`}>
            {comentario.respostas.map((resposta) => renderizarComentario(resposta, idPublicacao, nivel + 1))}
          </div>
        )}
      </div>
    );
  };

  const contarComentariosVisiveis = (comentarios: ComentarioFeed[]): number =>
    comentarios.reduce((total, comentario) => total + 1 + contarComentariosVisiveis(comentario.respostas || []), 0);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Comunidade</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">Feed da comunidade</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Partilha avisos, conquistas, oportunidades e ideias com a Universidade Kimpa Vita.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue/10 px-3 py-2 text-xs font-bold text-brand-blue">
          <Sparkles className="h-4 w-4" /> {publicacoes.length} publicação(ões)
        </div>
      </div>

      <div aria-live="polite" className="mt-4 space-y-2">
        {mensagem && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{mensagem}</p>}
        {erro && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">{erro}</p>}
      </div>

      {usuarioAtual && mostrarComposer ? (
        <form
          className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4"
          onSubmit={(evento) => {
            evento.preventDefault();
            publicar();
          }}
        >
          <label htmlFor="nova-publicacao" className="text-sm font-bold text-slate-700">Partilhar com a comunidade</label>
          <textarea
            id="nova-publicacao"
            value={publicacao}
            onChange={(evento) => setPublicacao(evento.target.value)}
            maxLength={1200}
            rows={4}
            placeholder="Escreve uma novidade, oportunidade ou conquista académica..."
            className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 focus-visible:outline-brand-blue"
          />

          {anexoPublicacao && (
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
              {eImagem(anexoPublicacao.url) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={anexoPublicacao.url}
                  alt="Pré-visualização do anexo"
                  className="h-16 w-16 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
                  <FileText className="h-7 w-7" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">{anexoPublicacao.nome}</p>
                <p className="text-xs text-slate-500">Anexo pronto para publicar</p>
              </div>
              <button
                type="button"
                onClick={() => setAnexoPublicacao(null)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                aria-label="Remover anexo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{publicacao.length}/1200 caracteres</span>
              <span className="text-slate-300">|</span>
              <input
                ref={inputFicheiroRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,application/zip"
                className="hidden"
                onChange={(evento) => {
                  const ficheiro = evento.target.files?.[0];
                  if (ficheiro) anexarFicheiro(ficheiro);
                }}
              />
              <button
                type="button"
                disabled={aCarregarAnexo || pendente}
                onClick={() => inputFicheiroRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                title="Anexar imagem ou ficheiro"
              >
                {aCarregarAnexo ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ImagePlus className="h-3.5 w-3.5" />
                )}
                Anexar
              </button>
            </div>
            <button
              type="submit"
              disabled={pendente || (!publicacao.trim() && !anexoPublicacao)}
              className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendente ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Publicar
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-5 rounded-2xl border border-brand-blue/15 bg-brand-blue/5 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">Queres participar na conversa?</p>
          <Link href="/login" className="mt-2 inline-flex font-semibold text-brand-blue hover:underline">Inicia sessão para publicar, gostar e comentar.</Link>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {publicacoes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <h3 className="font-bold text-slate-800">Ainda não existem publicações</h3>
            <p className="mt-2 text-sm text-slate-500">A primeira partilha da comunidade aparecerá aqui.</p>
          </div>
        ) : (
          publicacoes.map((item) => {
            const gostou = Boolean(usuarioAtual && item.gostos.some((gosto) => gosto.idUsuario === usuarioAtual.id));
            const comentariosVisiveis = comentariosAbertos[item.id];
            const eProprioAutor = usuarioAtual?.id === item.autor.id;
            const aAcompanhar = seguindoEstado[item.autor.id] ?? item.autor.estaAAcompanhar ?? false;

            return (
              <article key={item.id} className="rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Link href={`/perfil/${item.autor.id}`} className="shrink-0 transition hover:opacity-80">
                      <Avatar nome={item.autor.nome} foto={item.autor.fotoPerfil} />
                    </Link>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-bold text-slate-800">
                          <Link href={`/perfil/${item.autor.id}`} className="hover:text-brand-blue">
                            {item.autor.nome}
                          </Link>
                        </h3>
                        {usuarioAtual && !eProprioAutor && (
                          <button
                            type="button"
                            disabled={pendente}
                            onClick={() => alternarAcompanhar(item.autor.id)}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold transition ${
                              aAcompanhar
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60 hover:bg-emerald-100"
                                : "bg-brand-blue/10 text-brand-blue hover:bg-brand-blue hover:text-white"
                            } disabled:opacity-60`}
                            title={aAcompanhar ? "A acompanhar (Clique para deixar de seguir)" : "Clique para Acompanhar e interagir no Chat"}
                          >
                            {aAcompanhar ? (
                              <>
                                <UserCheck className="h-3 w-3" /> A acompanhar
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-3 w-3" /> Acompanhar
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{formatarData(item.dataPublicacao)}</p>
                    </div>
                  </div>
                  {podeModerar && (
                    <button
                      type="button"
                      disabled={pendente}
                      onClick={() => ocultar(item.id)}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60"
                    >
                      <ShieldOff className="h-3.5 w-3.5" /> Ocultar
                    </button>
                  )}
                </div>

                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{item.conteudo}</p>

                {item.urlImagem && (
                  <div className="mt-3">
                    {eImagem(item.urlImagem) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.urlImagem}
                        alt="Anexo da publicação"
                        className="max-h-96 w-full rounded-2xl border border-slate-100 object-cover"
                      />
                    ) : (
                      <a
                        href={item.urlImagem}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-brand-blue transition hover:bg-brand-blue/5"
                      >
                        <Paperclip className="h-4 w-4" /> {nomeDoFicheiro(item.urlImagem)}
                      </a>
                    )}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    disabled={pendente || !usuarioAtual}
                    onClick={() => alternarGosto(item.id)}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${
                      gostou ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <Heart className={`h-4 w-4 ${gostou ? "fill-current" : ""}`} /> {item._count.gostos}
                  </button>
                  <button
                    type="button"
                    onClick={() => setComentariosAbertos((estadoActual) => ({ ...estadoActual, [item.id]: !comentariosVisiveis }))}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
                  >
                    <MessageCircle className="h-4 w-4" /> {item._count.comentarios}
                  </button>
                </div>

                {comentariosVisiveis && (
                  <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4">
                    {item.comentarios.map((comentario) => renderizarComentario(comentario, item.id))}
                    {item._count.comentarios > contarComentariosVisiveis(item.comentarios) && (
                      <p className="text-xs text-slate-500">Só são apresentados os comentários mais recentes.</p>
                    )}
                    {item.comentarios.length === 0 && <p className="text-sm text-slate-500">Ainda não existem comentários.</p>}

                    {usuarioAtual && (
                      <form
                        className="flex gap-2"
                        onSubmit={(evento) => {
                          evento.preventDefault();
                          comentar(item.id);
                        }}
                      >
                        <label htmlFor={`comentario-${item.id}`} className="sr-only">Adicionar comentário</label>
                        <input
                          id={`comentario-${item.id}`}
                          value={comentarios[item.id] || ""}
                          onChange={(evento) => setComentarios((estadoActual) => ({ ...estadoActual, [item.id]: evento.target.value }))}
                          maxLength={500}
                          placeholder="Escreve um comentário..."
                          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus-visible:outline-brand-blue"
                        />
                        <button
                          type="submit"
                          disabled={pendente || !(comentarios[item.id] || "").trim()}
                          className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Enviar
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}