import { prisma } from "@/lib/prisma";
import type { ComentarioFeed, PublicacaoFeed } from "../types";

const autorComentario = {
  select: {
    id: true,
    nome: true,
    fotoPerfil: true,
  },
} as const;

function gostosDoUtilizador(idUsuario?: number) {
  return idUsuario ? { where: { idUsuario }, select: { idUsuario: true } } : false;
}

function respostasComentario(idUsuario?: number) {
  return {
    where: { estado: "publicado" },
    include: {
      autor: autorComentario,
      gostos: gostosDoUtilizador(idUsuario),
      _count: { select: { gostos: true } },
      respostas: {
        where: { estado: "publicado" },
        include: {
          autor: autorComentario,
          gostos: gostosDoUtilizador(idUsuario),
          _count: { select: { gostos: true } },
          respostas: {
            where: { estado: "publicado" },
            include: {
              autor: autorComentario,
              gostos: gostosDoUtilizador(idUsuario),
              _count: { select: { gostos: true } },
            },
            orderBy: { dataPublicacao: "asc" as const },
            take: 20,
          },
        },
        orderBy: { dataPublicacao: "asc" as const },
        take: 20,
      },
    },
    orderBy: { dataPublicacao: "asc" as const },
    take: 20,
  };
}

function serializarComentario(comentario: any): ComentarioFeed {
  return {
    id: comentario.id,
    conteudo: comentario.conteudo,
    dataPublicacao:
      comentario.dataPublicacao instanceof Date
        ? comentario.dataPublicacao.toISOString()
        : String(comentario.dataPublicacao),
    estado: comentario.estado,
    autor: {
      id: comentario.autor.id,
      nome: comentario.autor.nome,
      fotoPerfil: comentario.autor.fotoPerfil,
    },
    gostou: Array.isArray(comentario.gostos) ? comentario.gostos.length > 0 : false,
    _count: { gostos: comentario._count?.gostos ?? 0 },
    respostas: Array.isArray(comentario.respostas)
      ? comentario.respostas.map(serializarComentario)
      : [],
  };
}

export function serializarPublicacao(publicacao: any): PublicacaoFeed {
  const seguidores = publicacao.autor?.seguidores;

  return {
    id: publicacao.id,
    conteudo: publicacao.conteudo,
    urlImagem: publicacao.urlImagem,
    dataPublicacao:
      publicacao.dataPublicacao instanceof Date
        ? publicacao.dataPublicacao.toISOString()
        : String(publicacao.dataPublicacao),
    estado: publicacao.estado,
    autor: {
      id: publicacao.autor.id,
      nome: publicacao.autor.nome,
      fotoPerfil: publicacao.autor.fotoPerfil,
      estaAAcompanhar: Array.isArray(seguidores) ? seguidores.length > 0 : undefined,
    },
    comentarios: Array.isArray(publicacao.comentarios)
      ? publicacao.comentarios.map(serializarComentario)
      : [],
    gostou: Array.isArray(publicacao.gostos) ? publicacao.gostos.length > 0 : false,
    _count: {
      gostos: publicacao._count?.gostos ?? 0,
      comentarios: publicacao._count?.comentarios ?? 0,
    },
  };
}

export const FeedRepository = {
  async obterPublicacao(idPublicacao: number, idUsuario?: number) {
    return prisma.publicacao.findFirst({
      where: {
        id: idPublicacao,
        estado: "publicado",
      },
      include: {
        autor: {
          select: {
            id: true,
            nome: true,
            fotoPerfil: true,
          },
        },
        comentarios: {
          where: {
            estado: "publicado",
            idComentarioPai: null,
          },
          include: {
            autor: autorComentario,
            gostos: gostosDoUtilizador(idUsuario),
            _count: { select: { gostos: true } },
            respostas: respostasComentario(idUsuario),
          },
          orderBy: {
            dataPublicacao: "asc",
          },
        },
        gostos: {
          where: idUsuario ? { idUsuario } : undefined,
          select: {
            idUsuario: true,
          },
        },
        _count: {
          select: {
            gostos: true,
            comentarios: {
              where: {
                estado: "publicado",
              },
            },
          },
        },
      },
    });
  },

  async listarPublicacoesFeed(opcoes: { idUsuario?: number; cursorId?: number | null; limite?: number }) {
    const { idUsuario, cursorId, limite = 10 } = opcoes;

    return prisma.publicacao.findMany({
      where: {
        OR: [
          { estado: "publicado" },
          ...(idUsuario ? [{ idAutor: idUsuario }] : []),
        ],
      },
      include: {
        autor: {
          select: {
            id: true,
            nome: true,
            fotoPerfil: true,
            seguidores: idUsuario
              ? { where: { idSeguidor: idUsuario }, select: { idSeguidor: true } }
              : false,
          },
        },
        comentarios: {
          where: {
            estado: "publicado",
            idComentarioPai: null,
          },
          include: {
            autor: autorComentario,
            gostos: gostosDoUtilizador(idUsuario),
            _count: { select: { gostos: true } },
            respostas: respostasComentario(idUsuario),
          },
          orderBy: {
            dataPublicacao: "asc",
          },
          take: 5,
        },
        gostos: {
          where: idUsuario ? { idUsuario } : undefined,
          select: {
            idUsuario: true,
          },
        },
        _count: {
          select: {
            gostos: true,
            comentarios: {
              where: {
                estado: "publicado",
              },
            },
          },
        },
      },
      orderBy: {
        id: "desc",
      },
      take: limite,
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
    });
  },

  async obterInteracoesPublicacao(idPublicacao: number) {
    const [gostos, comentarios] = await Promise.all([
      prisma.gostoPublicacao.findMany({
        where: { idPublicacao },
        include: {
          usuario: { select: { id: true, nome: true, fotoPerfil: true } },
        },
        orderBy: { dataGosto: "desc" },
      }),
      prisma.comentarioPublicacao.findMany({
        where: { idPublicacao, estado: "publicado" },
        include: {
          autor: { select: { id: true, nome: true, fotoPerfil: true } },
        },
        orderBy: { dataPublicacao: "desc" },
      }),
    ]);

    const comentaristasUnicos = new Map<number, { id: number; nome: string; fotoPerfil: string | null }>();
    for (const comentario of comentarios) {
      if (!comentaristasUnicos.has(comentario.autor.id)) {
        comentaristasUnicos.set(comentario.autor.id, comentario.autor);
      }
    }

    return {
      gostos: gostos.map((gosto) => gosto.usuario),
      comentarios: Array.from(comentaristasUnicos.values()),
    };
  },

  async listarPublicacoesPublicas(idUsuario?: number) {
    return prisma.publicacao.findMany({
      where: {
        estado: "publicado",
      },
      include: {
        autor: {
          select: {
            id: true,
            nome: true,
            fotoPerfil: true,
          },
        },
        comentarios: {
          where: {
            estado: "publicado",
            idComentarioPai: null,
          },
          include: {
            autor: autorComentario,
            gostos: gostosDoUtilizador(idUsuario),
            _count: { select: { gostos: true } },
            respostas: respostasComentario(idUsuario),
          },
          orderBy: {
            dataPublicacao: "asc",
          },
          take: 5,
        },
        gostos: {
          where: idUsuario ? { idUsuario } : undefined,
          select: {
            idUsuario: true,
          },
        },
        _count: {
          select: {
            gostos: true,
            comentarios: {
              where: {
                estado: "publicado",
              },
            },
          },
        },
      },
      orderBy: {
        dataPublicacao: "desc",
      },
      take: 20,
    });
  },

  async listarPublicacoesParaModeracao() {
    return prisma.publicacao.findMany({
      include: {
        autor: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        _count: {
          select: {
            gostos: true,
            comentarios: true,
          },
        },
      },
      orderBy: {
        dataPublicacao: "desc",
      },
      take: 100,
    });
  },
};
