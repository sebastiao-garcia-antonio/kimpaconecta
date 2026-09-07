import { prisma } from "@/lib/prisma";

export class UsersRepository {
  static async getEntity(id: number) {
    return { id, status: "ok" };
  }

  static async obterPerfil(idUsuario: number) {
    return prisma.usuario.findUnique({
      where: { id: idUsuario },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        numBi: true,
        fotoPerfil: true,
        bio: true,
      },
    });
  }

  static async obterPerfilEstudante(idUsuario: number) {
    return prisma.usuario.findUnique({
      where: { id: idUsuario },
      include: {
        habilidades: {
          include: {
            habilidade: {
              include: {
                competencia: true,
              },
            },
          },
        },
      },
    });
  }

  static async obterCompetenciasEHabilidades() {
    return prisma.competencia.findMany({
      include: {
        habilidades: true,
      },
      orderBy: { nomeCompetencia: "asc" },
    });
  }

  static async atualizarPerfilBase(data: {
    idUsuario: number;
    nome: string;
    bio?: string;
    telefone?: string;
    numBi?: string;
    fotoPerfil?: string;
  }) {
    return prisma.usuario.update({
      where: { id: data.idUsuario },
      data: {
        nome: data.nome,
        bio: data.bio || null,
        telefone: data.telefone || null,
        numBi: data.numBi || null,
        fotoPerfil: data.fotoPerfil || null,
      },
    });
  }

  static async atualizarPerfilEstudante(data: {
    idUsuario: number;
    nome: string;
    bio?: string;
    telefone?: string;
    numBi?: string;
    fotoPerfil?: string;
    habilidadeIds: number[];
  }) {
    return prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.update({
        where: { id: data.idUsuario },
        data: {
          nome: data.nome,
          bio: data.bio || null,
          telefone: data.telefone || null,
          numBi: data.numBi || null,
          fotoPerfil: data.fotoPerfil || null,
        },
      });

      await tx.estudanteHabilidade.deleteMany({
        where: { idUsuario: data.idUsuario },
      });

      if (data.habilidadeIds.length > 0) {
        await tx.estudanteHabilidade.createMany({
          data: data.habilidadeIds.map((idHabilidade) => ({
            idUsuario: data.idUsuario,
            idHabilidade,
            nivelProficiencia: 3,
          })),
        });
      }

      return usuario;
    });
  }
}