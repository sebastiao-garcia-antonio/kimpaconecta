import { prisma } from "@/lib/prisma";

function chaveDaConversa(idPrimeiroUsuario: number, idSegundoUsuario: number) {
  const [menorId, maiorId] = [idPrimeiroUsuario, idSegundoUsuario].sort((a, b) => a - b);
  return `conversa-${menorId}-${maiorId}`;
}

export class MessagingRepository {
  static async listarContactosDisponiveis(idUsuario: number) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: idUsuario },
      include: {
        perfis: { include: { perfil: true } },
        matriculas: {
          include: {
            turma: {
              include: {
                curso: { select: { id: true, idCoordenador: true } },
              },
            },
          },
        },
        seguindo: { select: { idSeguido: true } },
      },
    });

    if (!usuario) return [];

    const isAdminOuStaff = usuario.perfis.some((p) =>
      ["admin", "coordenador", "professor"].includes(p.perfil.nomePerfil)
    );

    if (isAdminOuStaff) {
      // Admin, coordenadores e professores vêem todos os utilizadores ativos
      return prisma.usuario.findMany({
        where: { id: { not: idUsuario }, status: "ativo" },
        select: { id: true, nome: true, email: true, fotoPerfil: true },
        orderBy: { nome: "asc" },
        take: 50,
      });
    }

    // Regra para Estudante:
    // 1. Coordenador do Curso do Estudante
    const idsPermitidos = new Set<number>();

    for (const mat of usuario.matriculas) {
      if (mat.turma?.curso?.idCoordenador) {
        idsPermitidos.add(mat.turma.curso.idCoordenador);
      }
    }

    // 2. Pessoas que o Estudante Acompanha (Seguidos via botão 'Acompanhar')
    for (const seg of usuario.seguindo) {
      idsPermitidos.add(seg.idSeguido);
    }

    // Se ainda não tiver nenhum específico, disponibilizar coordenadores gerais
    if (idsPermitidos.size === 0) {
      const coordenadores = await prisma.usuarioPerfil.findMany({
        where: { perfil: { nomePerfil: "coordenador" } },
        select: { idUsuario: true },
      });
      coordenadores.forEach((c) => idsPermitidos.add(c.idUsuario));
    }

    idsPermitidos.delete(idUsuario);

    return prisma.usuario.findMany({
      where: { id: { in: Array.from(idsPermitidos) }, status: "ativo" },
      select: { id: true, nome: true, email: true, fotoPerfil: true },
      orderBy: { nome: "asc" },
      take: 50,
    });
  }

  static async alternarAcompanhar(idSeguidor: number, idSeguido: number) {
    if (idSeguidor === idSeguido) return { erro: "Não pode acompanhar o seu próprio perfil." };

    const existente = await prisma.seguidorUsuario.findUnique({
      where: { idSeguidor_idSeguido: { idSeguidor, idSeguido } },
    });

    if (existente) {
      await prisma.seguidorUsuario.delete({
        where: { idSeguidor_idSeguido: { idSeguidor, idSeguido } },
      });
      return { seguindo: false };
    } else {
      await prisma.seguidorUsuario.create({
        data: { idSeguidor, idSeguido },
      });
      return { seguindo: true };
    }
  }

  static async verificarEstaAAcompanhar(idSeguidor: number, idSeguido: number) {
    const reg = await prisma.seguidorUsuario.findUnique({
      where: { idSeguidor_idSeguido: { idSeguidor, idSeguido } },
    });
    return !!reg;
  }

  static async listarConversasDiretas(idUsuario: number) {
    return prisma.grupo.findMany({
      where: { tipoGrupo: "conversa", membros: { some: { idUsuario } } },
      include: {
        membros: {
          where: { idUsuario: { not: idUsuario } },
          include: { usuario: { select: { id: true, nome: true, email: true, fotoPerfil: true } } },
        },
        mensagens: {
          orderBy: { dataEnvio: "desc" },
          take: 1,
          select: { conteudo: true, dataEnvio: true, idEmissor: true },
        },
      },
      orderBy: { id: "desc" },
      take: 50,
    });
  }

  static async obterConversaDireta(idGrupo: number, idUsuario: number) {
    return prisma.grupo.findFirst({
      where: { id: idGrupo, tipoGrupo: "conversa", membros: { some: { idUsuario } } },
      include: {
        membros: {
          include: { usuario: { select: { id: true, nome: true, email: true, fotoPerfil: true } } },
        },
        mensagens: {
          orderBy: { dataEnvio: "asc" },
          take: 100,
          include: { emissor: { select: { id: true, nome: true, fotoPerfil: true } } },
        },
      },
    });
  }

  static async criarOuObterConversaDireta(idUsuario: number, idDestinatario: number) {
    const chaveConversa = chaveDaConversa(idUsuario, idDestinatario);
    const existente = await prisma.grupo.findUnique({ where: { chaveConversa } });
    if (existente) return existente;

    try {
      return await prisma.grupo.create({
        data: {
          nomeGrupo: "Conversa privada",
          tipoGrupo: "conversa",
          chaveConversa,
          idCriador: idUsuario,
          membros: {
            create: [
              { idUsuario, funcaoNoGrupo: "membro" },
              { idUsuario: idDestinatario, funcaoNoGrupo: "membro" },
            ],
          },
        },
      });
    } catch (error: any) {
      if (error?.code !== "P2002") throw error;
      const conversa = await prisma.grupo.findUnique({ where: { chaveConversa } });
      if (!conversa) throw error;
      return conversa;
    }
  }

  static async destinatarioExiste(idUsuario: number) {
    return prisma.usuario.findFirst({ where: { id: idUsuario, status: "ativo" }, select: { id: true } });
  }

  static async criarMensagemDireta(idGrupo: number, idEmissor: number, conteudo: string) {
    return prisma.mensagem.create({
      data: { idGrupo, idEmissor, conteudo, tipoConteudo: "texto" },
      include: { emissor: { select: { id: true, nome: true, fotoPerfil: true } } },
    });
  }
}