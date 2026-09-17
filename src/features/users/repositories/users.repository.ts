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

  static async obterPerfilPublico(idUsuario: number, idVisitante: number) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: idUsuario },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        numBi: true,
        numEstudanteLogin: true,
        fotoPerfil: true,
        bio: true,
        dataCriacao: true,
        perfis: { select: { perfil: { select: { nomePerfil: true } } } },
        reputacao: {
          select: {
            pontos: true,
            nivel: true,
            mentoriasRealizadas: true,
            projetosPublicados: true,
            feedbackPositivo: true,
          },
        },
        habilidades: {
          select: {
            nivelProficiencia: true,
            habilidade: {
              select: { nomeHabilidade: true, competencia: { select: { nomeCompetencia: true } } },
            },
          },
        },
        cursos: { select: { curso: { select: { nomeCurso: true } } } },
        matriculas: {
          select: {
            anoLectivo: true,
            isMentor: true,
            turma: {
              select: {
                nomeTurma: true,
                anoCurricular: true,
                periodo: true,
                curso: { select: { nomeCurso: true } },
              },
            },
          },
        },
        publicacoesCriadas: {
          where: { estado: "publicado" },
          orderBy: { dataPublicacao: "desc" },
          take: 50,
          select: {
            id: true,
            conteudo: true,
            urlImagem: true,
            dataPublicacao: true,
            _count: { select: { gostos: true, comentarios: true } },
          },
        },
        comentariosCriados: {
          orderBy: { dataPublicacao: "desc" },
          take: 20,
          select: {
            id: true,
            conteudo: true,
            dataPublicacao: true,
            publicacao: {
              select: {
                id: true,
                conteudo: true,
                autor: { select: { id: true, nome: true } },
              },
            },
          },
        },
        projetosAutor: {
          include: {
            projeto: {
              select: {
                id: true,
                tituloProjeto: true,
                descricao: true,
                urlRepositorio: true,
                urlDemonstracao: true,
                dataPublicacao: true,
                disciplina: { select: { nomeDisciplina: true } },
                _count: { select: { curtidores: true } },
                autores: {
                  select: { usuario: { select: { id: true, nome: true } } },
                },
              },
            },
          },
        },
        mentorSessoes: { select: { id: true } },
        alunoSessoes: { select: { id: true } },
        seguidores: {
          orderBy: { dataRegisto: "desc" },
          take: 12,
          select: { seguidor: { select: { id: true, nome: true, fotoPerfil: true } } },
        },
        seguindo: {
          orderBy: { dataRegisto: "desc" },
          take: 12,
          select: { seguido: { select: { id: true, nome: true, fotoPerfil: true } } },
        },
        _count: {
          select: {
            seguidores: true,
            seguindo: true,
            gostosPublicacoes: true,
          },
        },
      },
    });

    if (!usuario) return null;

    let segue = false;
    let seguidoPeloVisitante = false;
    if (idUsuario !== idVisitante && idVisitante > 0) {
      const [segueResp, seguidoResp] = await Promise.all([
        prisma.seguidorUsuario.findUnique({
          where: { idSeguidor_idSeguido: { idSeguidor: idVisitante, idSeguido: idUsuario } },
        }),
        prisma.seguidorUsuario.findUnique({
          where: { idSeguidor_idSeguido: { idSeguidor: idUsuario, idSeguido: idVisitante } },
        }),
      ]);
      segue = !!segueResp;
      seguidoPeloVisitante = !!seguidoResp;
    }

    return { ...usuario, segue, seguidoPeloVisitante };
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