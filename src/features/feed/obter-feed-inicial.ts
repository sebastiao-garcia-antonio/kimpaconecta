import { prisma } from "@/lib/prisma";
import { FeedRepository, serializarPublicacao } from "./repositories/feed.repository";
import type { PublicacaoFeed, UsuarioAtualFeed } from "./types";

export const LIMITE_FEED = 10;

type OpcoesFeedInicial = {
  idUsuario?: number;
  nome?: string | null;
  papeis?: string[];
};

export type FeedInicial = {
  publicacoes: PublicacaoFeed[];
  proximoCursor: number | null;
  usuarioAtual?: UsuarioAtualFeed;
};

export async function obterFeedInicial({
  idUsuario,
  nome,
  papeis = [],
}: OpcoesFeedInicial): Promise<FeedInicial> {
  let fotoPerfil: string | null = null;

  if (idUsuario) {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id: idUsuario },
        select: { fotoPerfil: true },
      });
      fotoPerfil = usuario?.fotoPerfil ?? null;
    } catch {
      fotoPerfil = null;
    }
  }

  let publicacoes: PublicacaoFeed[] = [];
  let proximoCursor: number | null = null;

  try {
    const itens = await FeedRepository.listarPublicacoesFeed({ idUsuario, limite: LIMITE_FEED });
    publicacoes = itens.map(serializarPublicacao);
    proximoCursor = itens.length === LIMITE_FEED ? itens[itens.length - 1].id : null;
  } catch {
    publicacoes = [];
    proximoCursor = null;
  }

  const usuarioAtual: UsuarioAtualFeed | undefined =
    idUsuario && nome ? { id: idUsuario, nome, fotoPerfil, papeis } : undefined;

  return { publicacoes, proximoCursor, usuarioAtual };
}
