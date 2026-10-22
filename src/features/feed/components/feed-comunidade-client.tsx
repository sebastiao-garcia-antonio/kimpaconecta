"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  Heart,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  UserPlus,
  UserCheck,
  ImagePlus,
  X,
  FileText,
  Paperclip,
  CornerUpLeft,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  Users,
} from "lucide-react";
import {
  alternarGostoPublicacaoServer,
  alternarGostoComentarioServer,
  carregarPublicacoesFeedServer,
  criarComentarioPublicacaoServer,
  criarPublicacaoServer,
  editarComentarioServer,
  editarPublicacaoServer,
  eliminarComentarioServer,
  eliminarPublicacaoServer,
  obterInteracoesPublicacaoServer,
  ocultarPublicacaoServer,
  mostrarPublicacaoServer,
} from "@/features/feed/actions";
import { alternarAcompanharUsuarioServer } from "@/features/messaging/actions";
import type { ComentarioFeed, PublicacaoFeed, UsuarioAtualFeed } from "@/features/feed/types";

interface FeedComunidadeClientProps {
  publicacoes: PublicacaoFeed[];
  proximoCursor?: number | null;
  usuarioAtual?: UsuarioAtualFeed;
  mostrarComposer?: boolean;
}

type InteracaoUsuario = { id: number; nome: string; fotoPerfil: string | null };

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

function eImagem(url: string) {
  return extensoesImagem.test(url.split("?")[0]);
}

function nomeDoFicheiro(url: string) {
  const segmentos = url.split("/");
  return segmentos[segmentos.length - 1];
}

function contarComentarios(comentarios: ComentarioFeed[]): number {
  return comentarios.reduce((total, comentario) => total + 1 + contarComentarios(comentario.respostas || []), 0);
}

function atualizarComentarioEmArvore(
  comentarios: ComentarioFeed[],
  id: number,
  updater: (comentario: ComentarioFeed) => ComentarioFeed
): ComentarioFeed[] {
  return comentarios.map((comentario) => {
    if (comentario.id === id) return updater(comentario);
    if (comentario.respostas && comentario.respostas.length > 0) {
      return { ...comentario, respostas: atualizarComentarioEmArvore(comentario.respostas, id, updater) };
    }
    return comentario;
  });
}

function removerComentarioDaArvore(comentarios: ComentarioFeed[], id: number): ComentarioFeed[] {
  return comentarios
    .filter((comentario) => comentario.id !== id)
    .map((comentario) =>
      comentario.respostas && comentario.respostas.length > 0
        ? { ...comentario, respostas: removerComentarioDaArvore(comentario.respostas, id) }
        : comentario
    );
}

function adicionarRespostaNaArvore(
  comentarios: ComentarioFeed[],
  idPai: number,
  resposta: ComentarioFeed
): ComentarioFeed[] {
  return comentarios.map((comentario) => {
    if (comentario.id === idPai) {
      return { ...comentario, respostas: [...(comentario.respostas || []), resposta] };
    }
    if (comentario.respostas && comentario.respostas.length > 0) {
      return { ...comentario, respostas: adicionarRespostaNaArvore(comentario.respostas, idPai, resposta) };
    }
    return comentario;
  });
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

export function FeedComunidadeClient({
  publicacoes,
  proximoCursor = null,
  usuarioAtual,
  mostrarComposer = true,
}: FeedComunidadeClientProps) {
  const inputFicheiroRef = useRef<HTMLInputElement | null>(null);
  const inputFicheiroEdicaoRef = useRef<HTMLInputElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const [itens, setItens] = useState<PublicacaoFeed[]>(publicacoes);
  const [cursor, setCursor] = useState<number | null>(proximoCursor);
  const [aCarregarMais, setACarregarMais] = useState(false);

  const [publicacao, setPublicacao] = useState("");
  const [anexoPublicacao, setAnexoPublicacao] = useState<{ url: string; nome: string } | null>(null);
  const [aCarregarAnexo, setACarregarAnexo] = useState(false);
  const [composerAberto, setComposerAberto] = useState(false);

  const [comentariosAbertos, setComentariosAbertos] = useState<Record<number, boolean>>({});
  const [comentarios, setComentarios] = useState<Record<number, string>>({});
  const [respostasAbertas, setRespostasAbertas] = useState<Record<number, boolean>>({});
  const [respostas, setRespostas] = useState<Record<number, string>>({});
  const [seguindoEstado, setSeguindoEstado] = useState<Record<number, boolean>>({});
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciarTransicao] = useTransition();

  const [menuAberto, setMenuAberto] = useState<number | null>(null);

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editarConteudo, setEditarConteudo] = useState("");
  const [editarAnexo, setEditarAnexo] = useState<{ url: string; nome: string } | null>(null);

  const [comentarioEditandoId, setComentarioEditandoId] = useState<number | null>(null);
  const [comentarioEditarTexto, setComentarioEditarTexto] = useState("");

  const [interacoesAberta, setInteracoesAberta] = useState<number | null>(null);
  const [interacoes, setInteracoes] = useState<{ gostos: InteracaoUsuario[]; comentarios: InteracaoUsuario[] } | null>(null);
  const [aCarregarInteracoes, setACarregarInteracoes] = useState(false);

  const atualizarPublicacaoLocal = (id: number, updater: (publicacao: PublicacaoFeed) => PublicacaoFeed) => {
    setItens((prev) => prev.map((item) => (item.id === id ? updater(item) : item)));
  };

  const carregarMais = async () => {
    if (aCarregarMais || cursor === null) return;
    setACarregarMais(true);
    try {
      const resposta = await carregarPublicacoesFeedServer(cursor);
      if (resposta?.erro) {
        setErro(resposta.erro);
        return;
      }
      if (resposta?.publicacoes) {
        setItens((prev) => {
          const ids = new Set(prev.map((item) => item.id));
          return [...prev, ...resposta.publicacoes.filter((item) => !ids.has(item.id))];
        });
        setCursor(resposta.proximoCursor ?? null);
      }
    } catch {
      setErro("Não foi possível carregar mais publicações.");
    } finally {
      setACarregarMais(false);
    }
  };

  useEffect(() => {
    const elemento = sentinelRef.current;
    if (!elemento || cursor === null) return;

    const container = typeof document !== "undefined" ? document.getElementById("conteudo-principal") : null;

    const observer = new IntersectionObserver(
      (entradas) => {
        if (entradas[0]?.isIntersecting) carregarMais();
      },
      { root: container, rootMargin: "400px" }
    );
    observer.observe(elemento);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, aCarregarMais]);

  const publicar = () => {
    setErro(null);
    setMensagem(null);

    iniciarTransicao(async () => {
      const resposta = await criarPublicacaoServer(publicacao, anexoPublicacao?.url);
      if (resposta.erro) {
        setErro(resposta.erro);
        return;
      }
      if (resposta.publicacao) {
        setItens((prev) => [resposta.publicacao as PublicacaoFeed, ...prev]);
      }
      setPublicacao("");
      setAnexoPublicacao(null);
      setComposerAberto(false);
      setMensagem("Publicação partilhada com a comunidade.");
    });
  };

  const carregarFicheiro = async (
    ficheiro: File,
    definir: (valor: { url: string; nome: string } | null) => void,
    definirCarregamento: (valor: boolean) => void
  ) => {
    setErro(null);
    setMensagem(null);
    definirCarregamento(true);
    try {
      const dados = new FormData();
      dados.append("file", ficheiro);
      dados.append("tipo", "publicacao");

      const resposta = await fetch("/api/upload", { method: "POST", body: dados });
      const resultado = await resposta.json();

      if (!resposta.ok) {
        setErro(resultado.error || "Não foi possível anexar a imagem.");
        return;
      }
      definir({ url: resultado.url, nome: resultado.nome || ficheiro.name });
    } catch {
      setErro("Erro ao enviar a imagem. Tente novamente.");
    } finally {
      definirCarregamento(false);
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
      setMensagem(resposta.seguindo ? "Passou a acompanhar este utilizador!" : "Deixou de acompanhar.");
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
      atualizarPublicacaoLocal(idPublicacao, (item) => ({
        ...item,
        gostou: resposta.gostou,
        _count: { ...item._count, gostos: Math.max(0, item._count.gostos + (resposta.gostou ? 1 : -1)) },
      }));
    });
  };

  const comentar = (idPublicacao: number) => {
    const conteudo = comentarios[idPublicacao] || "";
    setErro(null);
    setMensagem(null);

    iniciarTransicao(async () => {
      const resposta = await criarComentarioPublicacaoServer(idPublicacao, conteudo);
      if (resposta.erro || !resposta.comentario) {
        setErro(resposta.erro || "Não foi possível comentar.");
        return;
      }
      setComentarios((estado) => ({ ...estado, [idPublicacao]: "" }));
      atualizarPublicacaoLocal(idPublicacao, (item) => ({
        ...item,
        comentarios: [...item.comentarios, resposta.comentario as ComentarioFeed],
        _count: { ...item._count, comentarios: item._count.comentarios + 1 },
      }));
      setComentariosAbertos((estado) => ({ ...estado, [idPublicacao]: true }));
      setMensagem("Comentário publicado.");
    });
  };

  const responder = (idPublicacao: number, idComentario: number) => {
    const conteudo = respostas[idComentario] || "";
    setErro(null);
    setMensagem(null);

    iniciarTransicao(async () => {
      const resposta = await criarComentarioPublicacaoServer(idPublicacao, conteudo, idComentario);
      if (resposta.erro || !resposta.comentario) {
        setErro(resposta.erro || "Não foi possível responder.");
        return;
      }
      setRespostas((estado) => ({ ...estado, [idComentario]: "" }));
      setRespostasAbertas((estado) => ({ ...estado, [idComentario]: false }));
      atualizarPublicacaoLocal(idPublicacao, (item) => ({
        ...item,
        comentarios: adicionarRespostaNaArvore(item.comentarios, idComentario, resposta.comentario as ComentarioFeed),
        _count: { ...item._count, comentarios: item._count.comentarios + 1 },
      }));
      setMensagem("Resposta enviada.");
    });
  };

  const alternarGostoComentario = (idPublicacao: number, idComentario: number) => {
    setErro(null);
    iniciarTransicao(async () => {
      const resposta = await alternarGostoComentarioServer(idComentario);
      if (resposta.erro) {
        setErro(resposta.erro);
        return;
      }
      atualizarPublicacaoLocal(idPublicacao, (item) => ({
        ...item,
        comentarios: atualizarComentarioEmArvore(item.comentarios, idComentario, (comentario) => ({
          ...comentario,
          gostou: resposta.gostou,
          _count: { gostos: Math.max(0, (comentario._count?.gostos ?? 0) + (resposta.gostou ? 1 : -1)) },
        })),
      }));
    });
  };

  const iniciarEdicaoPublicacao = (item: PublicacaoFeed) => {
    setMenuAberto(null);
    setErro(null);
    setEditandoId(item.id);
    setEditarConteudo(item.conteudo);
    setEditarAnexo(item.urlImagem ? { url: item.urlImagem, nome: nomeDoFicheiro(item.urlImagem) } : null);
  };

  const guardarEdicaoPublicacao = (id: number) => {
    setErro(null);
    iniciarTransicao(async () => {
      const resposta = await editarPublicacaoServer(id, editarConteudo, editarAnexo?.url ?? "");
      if (resposta.erro) {
        setErro(resposta.erro);
        return;
      }
      atualizarPublicacaoLocal(id, (item) => ({
        ...item,
        conteudo: resposta.conteudo ?? item.conteudo,
        urlImagem: resposta.urlImagem ?? null,
      }));
      setEditandoId(null);
      setMensagem("Publicação atualizada.");
    });
  };

  const eliminarPublicacao = (id: number) => {
    setMenuAberto(null);
    setErro(null);
    iniciarTransicao(async () => {
      const resposta = await eliminarPublicacaoServer(id);
      if (resposta.erro) {
        setErro(resposta.erro);
        return;
      }
      setItens((prev) => prev.filter((item) => item.id !== id));
      setMensagem("Publicação eliminada.");
    });
  };

  const alternarOcultoPublicacao = (item: PublicacaoFeed) => {
    setMenuAberto(null);
    setErro(null);
    const vaiOcultar = item.estado !== "oculto";
    iniciarTransicao(async () => {
      const resposta = vaiOcultar ? await ocultarPublicacaoServer(item.id) : await mostrarPublicacaoServer(item.id);
      if (resposta.erro) {
        setErro(resposta.erro);
        return;
      }
      atualizarPublicacaoLocal(item.id, (atual) => ({ ...atual, estado: vaiOcultar ? "oculto" : "publicado" }));
      setMensagem(vaiOcultar ? "Publicação ocultada. Só você a consegue ver." : "Publicação visível novamente para a comunidade.");
    });
  };

  const iniciarEdicaoComentario = (comentario: ComentarioFeed) => {
    setErro(null);
    setComentarioEditandoId(comentario.id);
    setComentarioEditarTexto(comentario.conteudo);
  };

  const guardarEdicaoComentario = (idPublicacao: number, idComentario: number) => {
    setErro(null);
    iniciarTransicao(async () => {
      const resposta = await editarComentarioServer(idComentario, comentarioEditarTexto);
      if (resposta.erro) {
        setErro(resposta.erro);
        return;
      }
      atualizarPublicacaoLocal(idPublicacao, (item) => ({
        ...item,
        comentarios: atualizarComentarioEmArvore(item.comentarios, idComentario, (comentario) => ({
          ...comentario,
          conteudo: resposta.conteudo ?? comentario.conteudo,
        })),
      }));
      setComentarioEditandoId(null);
      setMensagem("Comentário atualizado.");
    });
  };

  const eliminarComentario = (idPublicacao: number, idComentario: number) => {
    setErro(null);
    iniciarTransicao(async () => {
      const resposta = await eliminarComentarioServer(idComentario);
      if (resposta.erro) {
        setErro(resposta.erro);
        return;
      }
      atualizarPublicacaoLocal(idPublicacao, (item) => {
        const antes = contarComentarios(item.comentarios);
        const comentariosAtualizados = removerComentarioDaArvore(item.comentarios, idComentario);
        const removidos = antes - contarComentarios(comentariosAtualizados);
        return {
          ...item,
          comentarios: comentariosAtualizados,
          _count: { ...item._count, comentarios: Math.max(0, item._count.comentarios - removidos) },
        };
      });
      setMensagem("Comentário eliminado.");
    });
  };

  const abrirInteracoes = (idPublicacao: number) => {
    setInteracoesAberta(idPublicacao);
    setInteracoes(null);
    setACarregarInteracoes(true);
    obterInteracoesPublicacaoServer(idPublicacao)
      .then((resposta) => {
        if (resposta && "gostos" in resposta && resposta.gostos) {
          setInteracoes({ gostos: resposta.gostos, comentarios: resposta.comentarios });
        }
      })
      .finally(() => setACarregarInteracoes(false));
  };

  const renderizarComentario = (comentario: ComentarioFeed, idPublicacao: number, nivel = 0) => {
    const respostaAberta = respostasAbertas[comentario.id];
    const emEdicao = comentarioEditandoId === comentario.id;
    const maxRecuo = 4;
    const gostou = comentario.gostou ?? false;
    const totalGostos = comentario._count?.gostos ?? 0;
    const podeGerir = Boolean(
      usuarioAtual && (usuarioAtual.id === comentario.autor.id || usuarioAtual.papeis.includes("admin"))
    );

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

        {emEdicao ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={comentarioEditarTexto}
              onChange={(evento) => setComentarioEditarTexto(evento.target.value)}
              maxLength={500}
              rows={2}
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus-visible:outline-brand-blue"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pendente || !comentarioEditarTexto.trim()}
                onClick={() => guardarEdicaoComentario(idPublicacao, comentario.id)}
                className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setComentarioEditandoId(null)}
                className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-1 text-sm leading-6 text-slate-600">{comentario.conteudo}</p>
        )}

        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={pendente || !usuarioAtual}
            onClick={() => alternarGostoComentario(idPublicacao, comentario.id)}
            className={`inline-flex items-center gap-1 text-xs font-semibold transition disabled:opacity-60 ${
              gostou ? "text-rose-600" : "text-slate-500 hover:text-rose-600"
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${gostou ? "fill-current" : ""}`} />
            {totalGostos > 0 ? totalGostos : "Gosto"}
          </button>

          {usuarioAtual && (
            <button
              type="button"
              onClick={() => setRespostasAbertas((estado) => ({ ...estado, [comentario.id]: !respostaAberta }))}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-brand-blue"
            >
              <CornerUpLeft className="h-3.5 w-3.5" /> Responder
            </button>
          )}

          {podeGerir && !emEdicao && (
            <>
              <button
                type="button"
                onClick={() => iniciarEdicaoComentario(comentario)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-brand-blue"
              >
                <Pencil className="h-3.5 w-3.5" /> Editar
              </button>
              <button
                type="button"
                disabled={pendente}
                onClick={() => eliminarComentario(idPublicacao, comentario.id)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-rose-600 disabled:opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" /> Eliminar
              </button>
            </>
          )}
        </div>

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
              onChange={(evento) => setRespostas((estado) => ({ ...estado, [comentario.id]: evento.target.value }))}
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
          <div className={`space-y-2 ${nivel >= maxRecuo ? "" : "ml-3 border-l-2 border-slate-100 pl-3"} mt-2`}>
            {comentario.respostas.map((resposta) => renderizarComentario(resposta, idPublicacao, nivel + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Comunidade</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">Feed da comunidade</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Partilha avisos, conquistas, oportunidades e ideias com a Universidade Kimpa Vita.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue/10 px-3 py-2 text-xs font-bold text-brand-blue">
            <Sparkles className="h-4 w-4" /> {itens.length} publicação(ões)
          </div>
          {usuarioAtual && mostrarComposer && (
            <button
              type="button"
              onClick={() => {
                setErro(null);
                setMensagem(null);
                setComposerAberto(true);
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-blue-dark"
            >
              <Plus className="h-4 w-4" /> Novo feed
            </button>
          )}
        </div>
      </div>

      <div aria-live="polite" className="mt-4 space-y-2">
        {mensagem && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{mensagem}</p>}
        {erro && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">{erro}</p>}
      </div>

      {!usuarioAtual && (
        <div className="mt-5 rounded-2xl border border-brand-blue/15 bg-brand-blue/5 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">Pretende participar na conversa?</p>
          <Link href="/login" className="mt-2 inline-flex font-semibold text-brand-blue hover:underline">Inicie sessão para publicar, gostar e comentar.</Link>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {itens.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <h3 className="font-bold text-slate-800">Ainda não existem publicações</h3>
            <p className="mt-2 text-sm text-slate-500">A primeira partilha da comunidade aparecerá aqui.</p>
          </div>
        ) : (
          itens.map((item) => {
            const gostou = Boolean(item.gostou);
            const comentariosVisiveis = comentariosAbertos[item.id];
            const eProprioAutor = usuarioAtual?.id === item.autor.id;
            const podeModerar = Boolean(usuarioAtual?.papeis.includes("admin"));
            const aAcompanhar = seguindoEstado[item.autor.id] ?? item.autor.estaAAcompanhar ?? false;
            const estaOculto = item.estado === "oculto";

            return (
              <article key={item.id} className={`rounded-2xl border p-5 ${estaOculto ? "border-amber-200 bg-amber-50/40" : "border-slate-200"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Link href={`/perfil/${item.autor.id}`} className="shrink-0 transition hover:opacity-80">
                      <Avatar nome={item.autor.nome} foto={item.autor.fotoPerfil} />
                    </Link>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
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
                            title={aAcompanhar ? "A acompanhar (Clique para deixar de seguir)" : "Clique para Acompanhar"}
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
                        {estaOculto && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                            <EyeOff className="h-3 w-3" /> Oculto
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{formatarData(item.dataPublicacao)}</p>
                    </div>
                  </div>

                  {usuarioAtual && (eProprioAutor || podeModerar) && (
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setMenuAberto((atual) => (atual === item.id ? null : item.id))}
                        className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                        aria-label="Opções da publicação"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                      {menuAberto === item.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuAberto(null)} aria-hidden="true" />
                          <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                            {eProprioAutor && (
                              <button
                                type="button"
                                onClick={() => iniciarEdicaoPublicacao(item)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                              >
                                <Pencil className="h-4 w-4" /> Editar
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => alternarOcultoPublicacao(item)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                            >
                              {estaOculto ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                              {estaOculto ? "Mostrar" : "Ocultar"}
                            </button>
                            {(eProprioAutor || podeModerar) && (
                              <button
                                type="button"
                                onClick={() => eliminarPublicacao(item.id)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                              >
                                <Trash2 className="h-4 w-4" /> Eliminar
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
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
                    onClick={() => setComentariosAbertos((estado) => ({ ...estado, [item.id]: !comentariosVisiveis }))}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
                  >
                    <MessageCircle className="h-4 w-4" /> {item._count.comentarios}
                  </button>
                  {eProprioAutor && (item._count.gostos > 0 || item._count.comentarios > 0) && (
                    <button
                      type="button"
                      onClick={() => abrirInteracoes(item.id)}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
                      title="Ver quem curtiu e comentou"
                    >
                      <Users className="h-4 w-4" /> Quem interagiu
                    </button>
                  )}
                </div>

                {comentariosVisiveis && (
                  <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4">
                    {item.comentarios.map((comentario) => renderizarComentario(comentario, item.id))}
                    {item._count.comentarios > contarComentarios(item.comentarios) && (
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
                          onChange={(evento) => setComentarios((estado) => ({ ...estado, [item.id]: evento.target.value }))}
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

        {cursor !== null && (
          <div ref={sentinelRef} className="flex flex-col items-center justify-center py-6 gap-2">
            {aCarregarMais ? (
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-brand-blue" /> A carregar mais publicações...
              </span>
            ) : (
              <button
                type="button"
                onClick={carregarMais}
                className="rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-brand-blue"
              >
                Carregar mais publicações
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal: Nova publicação */}
      {composerAberto && usuarioAtual && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-lg font-black text-slate-900">Criar nova publicação</h3>
              <button
                type="button"
                onClick={() => setComposerAberto(false)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              className="space-y-4 p-5"
              onSubmit={(evento) => {
                evento.preventDefault();
                publicar();
              }}
            >
              <div className="flex items-center gap-3">
                <Avatar nome={usuarioAtual.nome} foto={usuarioAtual.fotoPerfil} />
                <div>
                  <p className="text-sm font-bold text-slate-800">{usuarioAtual.nome}</p>
                  <p className="text-xs text-slate-400">A partilhar com a comunidade</p>
                </div>
              </div>

              <textarea
                value={publicacao}
                onChange={(evento) => setPublicacao(evento.target.value)}
                maxLength={1200}
                rows={5}
                autoFocus
                placeholder="Escreve uma novidade, oportunidade ou conquista académica..."
                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 focus-visible:outline-brand-blue"
              />

              {anexoPublicacao ? (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  {eImagem(anexoPublicacao.url) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={anexoPublicacao.url} alt="Pré-visualização" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
                      <FileText className="h-7 w-7" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{anexoPublicacao.nome}</p>
                    <p className="text-xs text-slate-500">Imagem pronta para publicar</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAnexoPublicacao(null)}
                    className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Remover imagem"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputFicheiroRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={(evento) => {
                      const ficheiro = evento.target.files?.[0];
                      if (ficheiro) carregarFicheiro(ficheiro, setAnexoPublicacao, setACarregarAnexo);
                      if (inputFicheiroRef.current) inputFicheiroRef.current.value = "";
                    }}
                  />
                  <button
                    type="button"
                    disabled={aCarregarAnexo || pendente}
                    onClick={() => inputFicheiroRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 disabled:opacity-60"
                  >
                    {aCarregarAnexo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                    Imagem (opcional)
                  </button>
                  <span className="text-xs text-slate-400">{publicacao.length}/1200</span>
                </div>
                <button
                  type="submit"
                  disabled={pendente || aCarregarAnexo || (!publicacao.trim() && !anexoPublicacao)}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pendente ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Publicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar publicação */}
      {editandoId !== null && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-lg font-black text-slate-900">Editar publicação</h3>
              <button
                type="button"
                onClick={() => setEditandoId(null)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              className="space-y-4 p-5"
              onSubmit={(evento) => {
                evento.preventDefault();
                guardarEdicaoPublicacao(editandoId);
              }}
            >
              <textarea
                value={editarConteudo}
                onChange={(evento) => setEditarConteudo(evento.target.value)}
                maxLength={1200}
                rows={5}
                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 focus-visible:outline-brand-blue"
              />

              {editarAnexo ? (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  {eImagem(editarAnexo.url) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={editarAnexo.url} alt="Pré-visualização" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
                      <FileText className="h-7 w-7" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{editarAnexo.nome}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditarAnexo(null)}
                    className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Remover imagem"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputFicheiroEdicaoRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={(evento) => {
                      const ficheiro = evento.target.files?.[0];
                      if (ficheiro) carregarFicheiro(ficheiro, setEditarAnexo, setACarregarAnexo);
                      if (inputFicheiroEdicaoRef.current) inputFicheiroEdicaoRef.current.value = "";
                    }}
                  />
                  <button
                    type="button"
                    disabled={aCarregarAnexo || pendente}
                    onClick={() => inputFicheiroEdicaoRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 disabled:opacity-60"
                  >
                    {aCarregarAnexo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                    Trocar imagem
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditandoId(null)}
                    className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={pendente || aCarregarAnexo || !editarConteudo.trim()}
                    className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-blue-dark disabled:opacity-60"
                  >
                    {pendente ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Guardar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Interações */}
      {interacoesAberta !== null && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-lg font-black text-slate-900">Interações</h3>
              <button
                type="button"
                onClick={() => setInteracoesAberta(null)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-5">
              {aCarregarInteracoes ? (
                <div className="flex items-center justify-center py-8 text-sm text-slate-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> A carregar...
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                      <Heart className="h-3.5 w-3.5 text-rose-500" /> Gostos ({interacoes?.gostos.length ?? 0})
                    </h4>
                    <div className="mt-3 space-y-2">
                      {interacoes && interacoes.gostos.length > 0 ? (
                        interacoes.gostos.map((usuario) => (
                          <Link
                            key={`gosto-${usuario.id}`}
                            href={`/perfil/${usuario.id}`}
                            onClick={() => setInteracoesAberta(null)}
                            className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50"
                          >
                            <Avatar nome={usuario.nome} foto={usuario.fotoPerfil} tamanho="sm" />
                            <span className="text-sm font-semibold text-slate-700">{usuario.nome}</span>
                          </Link>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">Ainda ninguém gostou.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                      <MessageCircle className="h-3.5 w-3.5 text-brand-blue" /> Comentários ({interacoes?.comentarios.length ?? 0})
                    </h4>
                    <div className="mt-3 space-y-2">
                      {interacoes && interacoes.comentarios.length > 0 ? (
                        interacoes.comentarios.map((usuario) => (
                          <Link
                            key={`comentario-${usuario.id}`}
                            href={`/perfil/${usuario.id}`}
                            onClick={() => setInteracoesAberta(null)}
                            className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50"
                          >
                            <Avatar nome={usuario.nome} foto={usuario.fotoPerfil} tamanho="sm" />
                            <span className="text-sm font-semibold text-slate-700">{usuario.nome}</span>
                          </Link>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">Ainda ninguém comentou.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
