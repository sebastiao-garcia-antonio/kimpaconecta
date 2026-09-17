import { prisma } from "@/lib/prisma";

const autorComentario = {
  select: {
    id: true,
    nome: true,
    fotoPerfil: true,
  },
} as const;

const respostasComentario = {
  where: { estado: "publicado" },
  include: {
    autor: autorComentario,
    respostas: {
      where: { estado: "publicado" },
      include: {
        autor: autorComentario,
        respostas: {
          where: { estado: "publicado" },
          include: {
            autor: autorComentario,
            respostas: {
              where: { estado: "publicado" },
              include: {
                autor: autorComentario,
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
    },
  },
  orderBy: { dataPublicacao: "asc" as const },
  take: 20,
};

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
            respostas: respostasComentario,
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
            respostas: respostasComentario,
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
