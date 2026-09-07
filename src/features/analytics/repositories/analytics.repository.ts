import { prisma } from "@/lib/prisma";

export class AnalyticsRepository {
  static async getEntity(id: number) {
    return { id, status: "ok" };
  }

  static async obterResumoAcademico() {
    const [
      totalCursos,
      totalDisciplinas,
      totalTurmas,
      totalEstudantes,
      totalAvaliacoes,
      totalOportunidades,
      totalCandidaturas,
      totalPresencas,
    ] = await Promise.all([
      prisma.curso.count(),
      prisma.disciplina.count(),
      prisma.turma.count(),
      prisma.usuario.count({
        where: {
          perfis: {
            some: {
              perfil: { nomePerfil: "estudante" }
            }
          }
        }
      }),
      prisma.avaliacao.count(),
      prisma.oportunidadeAcademica.count(),
      prisma.candidaturaOportunidade.count(),
      prisma.presencaAula.count(),
    ]);

    const cursos = await prisma.curso.findMany({
      include: {
        disciplinas: true,
        turmas: {
          include: {
            matriculas: true
          }
        }
      },
      orderBy: { nomeCurso: "asc" }
    });

    const desempenhoPorCurso = cursos.map((curso) => ({
      idCurso: curso.id,
      nomeCurso: curso.nomeCurso,
      totalDisciplinas: curso.disciplinas.length,
      totalTurmas: curso.turmas.length,
      totalEstudantes: curso.turmas.reduce((total, turma) => total + turma.matriculas.length, 0),
    }));

    return {
      totalCursos,
      totalDisciplinas,
      totalTurmas,
      totalEstudantes,
      totalAvaliacoes,
      totalOportunidades,
      totalCandidaturas,
      totalPresencas,
      desempenhoPorCurso,
    };
  }
}
