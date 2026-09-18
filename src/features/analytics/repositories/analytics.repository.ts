import { prisma } from "@/lib/prisma";

export class AnalyticsRepository {
  static async obterResumoAcademico(idCoordenador?: number) {
    const direitoCurso = idCoordenador ? { idCoordenador } : {};

    const [
      totalCursos,
      totalDisciplinas,
      totalTurmas,
      totalAvaliacoes,
      totalOportunidades,
      totalCandidaturas,
      totalPresencas,
    ] = await Promise.all([
      prisma.curso.count({ where: direitoCurso }),
      prisma.disciplina.count({ where: { curso: direitoCurso } }),
      prisma.turma.count({ where: { curso: direitoCurso } }),
      prisma.avaliacao.count({ where: { disciplina: { curso: direitoCurso } } }),
      idCoordenador
        ? prisma.oportunidadeAcademica.count({ where: { criadoPor: idCoordenador } })
        : prisma.oportunidadeAcademica.count(),
      idCoordenador
        ? prisma.candidaturaOportunidade.count({ where: { oportunidade: { criadoPor: idCoordenador } } })
        : prisma.candidaturaOportunidade.count(),
      prisma.presencaAula.count({ where: { disciplina: { curso: direitoCurso } } }),
    ]);

    const cursos = await prisma.curso.findMany({
      where: direitoCurso,
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

    const [presencasAgrupadas, avaliacoesAgrupadas, alunosPorCurso] = await Promise.all([
      prisma.presencaAula.groupBy({
        by: ["idDisciplina"],
        _count: { _all: true },
        where: { disciplina: { curso: direitoCurso } },
      }),
      prisma.avaliacao.groupBy({
        by: ["idDisciplina"],
        _count: { _all: true },
        where: { disciplina: { curso: direitoCurso } },
      }),
      idCoordenador
        ? prisma.matricula.findMany({
            where: { turma: { idCurso: { in: cursos.map((curso) => curso.id) } } },
            select: { idUsuario: true },
          })
        : Promise.resolve([]),
    ]);

    const presencasPorDisciplina = new Map(
      presencasAgrupadas.map((item) => [item.idDisciplina, item._count._all])
    );
    const avaliacoesPorDisciplina = new Map(
      avaliacoesAgrupadas.map((item) => [item.idDisciplina, item._count._all])
    );

    let totalEstudantes: number;
    if (idCoordenador) {
      totalEstudantes = new Set(alunosPorCurso.map((matricula) => matricula.idUsuario)).size;
    } else {
      totalEstudantes = await prisma.usuario.count({
        where: { perfis: { some: { perfil: { nomePerfil: "estudante" } } } }
      });
    }

    const desempenhoPorCurso = cursos.map((curso) => ({
      idCurso: curso.id,
      nomeCurso: curso.nomeCurso,
      totalDisciplinas: curso.disciplinas.length,
      totalTurmas: curso.turmas.length,
      totalEstudantes: curso.turmas.reduce((total, turma) => total + turma.matriculas.length, 0),
      totalAvaliacoes: curso.disciplinas.reduce(
        (total, disciplina) => total + (avaliacoesPorDisciplina.get(disciplina.id) || 0),
        0
      ),
      totalPresencas: curso.disciplinas.reduce(
        (total, disciplina) => total + (presencasPorDisciplina.get(disciplina.id) || 0),
        0
      ),
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
