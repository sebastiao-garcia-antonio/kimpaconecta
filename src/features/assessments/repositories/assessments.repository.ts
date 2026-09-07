import { prisma } from "@/lib/prisma";

export class AssessmentsRepository {
  static async getAvaliacaoWithQuestions(idAvaliacao: number) {
    return prisma.avaliacao.findUnique({
      where: { id: idAvaliacao },
      include: {
        questoes: {
          include: {
            alternativas: {
              select: { id: true, textoAlternativa: true }
            }
          }
        }
      }
    });
  }

  static async iniciarTentativa(idAvaliacao: number, idEstudante: number) {
    return prisma.tentativaAvaliacao.create({
      data: {
        idAvaliacao,
        idEstudante,
        statusTentativa: "em_curso"
      }
    });
  }

  static async registrarLogSeguranca(idTentativa: number, tipoEvento: string, descricao: string) {
    return prisma.logsSeguranca.create({
      data: {
        idTentativa,
        tipoEvento,
        descricao
      }
    });
  }

  static async submeterTentativa(idTentativa: number, respostas: Array<{ idQuestao: number; idAlternativaEscolhida?: number; textoResposta?: string }>) {
    return prisma.$transaction(async (tx) => {
      for (const resp of respostas) {
        await tx.respostaEstudante.create({
          data: {
            idTentativa,
            idQuestao: resp.idQuestao,
            idAlternativaEscolhida: resp.idAlternativaEscolhida || null,
            textoResposta: resp.textoResposta || null
          }
        });
      }

      return tx.tentativaAvaliacao.update({
        where: { id: idTentativa },
        data: {
          submetidoEm: new Date(),
          statusTentativa: "submetida"
        }
      });
    });
  }

  static async listarLogsProctoring() {
    const logs = await prisma.logsSeguranca.findMany({
      include: {
        tentativa: {
          include: {
            estudante: {
              select: { id: true, nome: true, email: true, numEstudanteLogin: true }
            },
            avaliacao: {
              select: { id: true, titulo: true }
            }
          }
        }
      },
      orderBy: { dataRegisto: "desc" },
      take: 100
    });

    return logs.map((log) => ({
      id: Number(log.id),
      idTentativa: log.idTentativa,
      tipoEvento: log.tipoEvento,
      descricao: log.descricao,
      dataRegisto: log.dataRegisto.toISOString(),
      estudanteNome: log.tentativa.estudante.nome,
      estudanteEmail: log.tentativa.estudante.email,
      numEstudante: log.tentativa.estudante.numEstudanteLogin,
      avaliacaoTitulo: log.tentativa.avaliacao.titulo
    }));
  }
}
