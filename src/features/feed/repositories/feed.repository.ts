import { prisma } from "@/lib/prisma";

export const FeedRepository = {
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
          },
          include: {
            autor: {
              select: {
                id: true,
                nome: true,
                fotoPerfil: true,
              },
            },
          },
          orderBy: {
            dataPublicacao: "asc",
          },
          take: 3,
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
