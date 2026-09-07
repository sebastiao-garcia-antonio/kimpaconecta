import { prisma } from "@/lib/prisma";

export class AuthRepository {
  static async findUserByIdentifier(identifier: string) {
    return prisma.usuario.findFirst({
      where: {
        OR: [
          { email: identifier },
          { numEstudanteLogin: identifier }
        ]
      },
      include: {
        perfis: {
          include: {
            perfil: true
          }
        }
      }
    });
  }

  static async findUserById(id: number) {
    return prisma.usuario.findUnique({
      where: { id },
      include: {
        perfis: {
          include: {
            perfil: true
          }
        }
      }
    });
  }

  static async registrarSolicitacaoAcesso(data: {
    nomeCompleto: string;
    email: string;
    numEstudante: string;
    numBi?: string;
    telefone?: string;
    senhaProvisoria: string;
    idCurso: number;
    idTurma?: number;
  }) {
    return prisma.solicitacaoAcesso.create({
      data: {
        nomeCompleto: data.nomeCompleto,
        email: data.email,
        numEstudante: data.numEstudante,
        numBi: data.numBi || null,
        telefone: data.telefone || null,
        senhaProvisoria: data.senhaProvisoria,
        idTurma: data.idTurma || null,
        idCurso: data.idCurso,
        status: "pendente"
      }
    });
  }

  static async listarUnidadesOrganicas() {
    return prisma.unidadeOrganica.findMany({
      orderBy: { nomeUo: "asc" }
    });
  }

  static async listarCursosPorUnidade(idUo: number) {
    return prisma.curso.findMany({
      where: { idUo },
      include: {
        unidade: true
      },
      orderBy: { nomeCurso: "asc" }
    });
  }

  static async listarTurmasPorCurso(idCurso: number) {
    return prisma.turma.findMany({
      where: { idCurso },
      orderBy: [
        { anoCurricular: "asc" },
        { nomeTurma: "asc" }
      ]
    });
  }

  static async obterCursoComCoordenador(idCurso: number) {
    return prisma.curso.findUnique({
      where: { id: idCurso },
      include: {
        unidade: true,
        coordenador: { select: { id: true, nome: true, email: true } }
      }
    });
  }

  static async countUsuarios() {
    return prisma.usuario.count();
  }

  static async inicializarPerfis() {
    const perfisPadrao = ["admin", "coordenador", "professor", "estudante"];
    for (const nome of perfisPadrao) {
      await prisma.perfil.upsert({
        where: { nomePerfil: nome },
        update: {},
        create: { nomePerfil: nome }
      });
    }
  }

  static async registrarUsuarioDireto(data: {
    nome: string;
    email: string;
    senha: string;
    numEstudanteLogin?: string;
    numBi?: string;
    telefone?: string;
    bio?: string;
    perfilNome: string;
  }) {
    const perfil = await prisma.perfil.findUnique({
      where: { nomePerfil: data.perfilNome }
    });

    if (!perfil) {
      throw new Error(`Perfil '${data.perfilNome}' não encontrado.`);
    }

    return prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          nome: data.nome,
          email: data.email,
          senha: data.senha,
          numEstudanteLogin: data.numEstudanteLogin || null,
          numBi: data.numBi || null,
          telefone: data.telefone || null,
          bio: data.bio || null,
          status: "ativo"
        }
      });

      await tx.usuarioPerfil.create({
        data: {
          idUsuario: usuario.id,
          idPerfil: perfil.id
        }
      });

      return usuario;
    });
  }
}
