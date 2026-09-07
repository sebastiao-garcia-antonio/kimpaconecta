import { prisma } from "@/lib/prisma";

export type LinhaPautaEstudante = {
  idEstudante: number;
  nomeEstudante: string;
  numEstudante: string | null;
  numBi: string | null;
  presencasPorcentagem: number;
  totalAulas: number;
  totalPresencas: number;
  notasAvaliacoes: Array<{
    idAvaliacao: number;
    titulo: string;
    notaObtida: number | null;
    notaMaxima: number;
  }>;
  mediaFrequencia: number;
  notaExame: number | null;
  notaFinal: number;
  estadoAcademico: "APROVADO" | "RECURSO" | "REPROVADO";
};

export type PautaAcademica = {
  disciplina: {
    id: number;
    nomeDisciplina: string;
    semestre: number;
    nomeCurso: string;
    nomeUo: string;
  };
  turma?: {
    id: number;
    nomeTurma: string;
    anoCurricular: number;
    periodo: string;
  } | null;
  docente?: {
    nome: string;
    email: string;
  } | null;
  coordenador?: {
    nome: string;
    email: string;
  } | null;
  estudantes: LinhaPautaEstudante[];
  estatisticas: {
    totalEstudantes: number;
    aprovados: number;
    recurso: number;
    reprovados: number;
    taxaAprovacao: number;
    mediaTurma: number;
  };
};

export class ReportsRepository {
  static async obterPautaDisciplina(idDisciplina: number, idTurma?: number): Promise<PautaAcademica | null> {
    const disciplina = await prisma.disciplina.findUnique({
      where: { id: idDisciplina },
      include: {
        curso: {
          include: {
            unidade: true,
            coordenador: { select: { nome: true, email: true } },
          },
        },
        avaliacoes: {
          orderBy: { dataInicio: "asc" },
          select: { id: true, titulo: true, notaMaxima: true, idProfessor: true },
        },
      },
    });

    if (!disciplina) return null;

    // Buscar docente da primeira avaliação ou diário
    let docenteInfo: { nome: string; email: string } | null = null;
    const primeiroProfId = disciplina.avaliacoes[0]?.idProfessor;
    if (primeiroProfId) {
      const prof = await prisma.usuario.findUnique({
        where: { id: primeiroProfId },
        select: { nome: true, email: true },
      });
      if (prof) docenteInfo = prof;
    }

    // Buscar turma caso especificada
    const turma = idTurma
      ? await prisma.turma.findUnique({
          where: { id: idTurma },
          select: { id: true, nomeTurma: true, anoCurricular: true, periodo: true },
        })
      : null;

    // Buscar matrículas ativas na turma/curso
    const matriculas = await prisma.matricula.findMany({
      where: {
        turma: {
          idCurso: disciplina.idCurso,
          ...(idTurma ? { id: idTurma } : {}),
        },
      },
      include: {
        usuario: {
          select: { id: true, nome: true, numEstudanteLogin: true, numBi: true },
        },
      },
      orderBy: { usuario: { nome: "asc" } },
    });

    const estudanteIds = matriculas.map((m) => m.usuario.id);

    // Buscar tentativas de avaliação dos estudantes nesta disciplina
    const tentativas = await prisma.tentativaAvaliacao.findMany({
      where: {
        idEstudante: { in: estudanteIds },
        avaliacao: { idDisciplina },
        statusTentativa: { in: ["submetida", "corrigida"] },
      },
      select: {
        idEstudante: true,
        idAvaliacao: true,
        notaObtida: true,
      },
    });

    // Buscar diários de aula e presenças
    const diariosCount = await prisma.diarioAula.count({
      where: {
        idDisciplina,
        ...(idTurma ? { idTurma } : {}),
      },
    });

    const presencasBrutas = await prisma.presencaAula.findMany({
      where: {
        idDisciplina,
        idUsuario: { in: estudanteIds },
      },
      select: {
        idUsuario: true,
        presente: true,
      },
    });

    const mapaPresencas = new Map<number, { total: number; presentes: number }>();
    for (const p of presencasBrutas) {
      const atual = mapaPresencas.get(p.idUsuario) || { total: 0, presentes: 0 };
      atual.total += 1;
      if (p.presente) atual.presentes += 1;
      mapaPresencas.set(p.idUsuario, atual);
    }

    const mapaTentativas = new Map<string, number | null>();
    for (const t of tentativas) {
      const chave = `${t.idEstudante}_${t.idAvaliacao}`;
      const notaAtual = mapaTentativas.get(chave);
      const novaNota = t.notaObtida ? Number(t.notaObtida) : null;
      if (notaAtual === undefined || (novaNota !== null && (notaAtual === null || novaNota > notaAtual))) {
        mapaTentativas.set(chave, novaNota);
      }
    }

    let totalAprovados = 0;
    let totalRecurso = 0;
    let totalReprovados = 0;
    let somaNotasFinais = 0;

    const estudantesPauta: LinhaPautaEstudante[] = matriculas.map((mat) => {
      const u = mat.usuario;
      const presInfo = mapaPresencas.get(u.id) || { total: 0, presentes: 0 };
      const totalAulasReal = diariosCount > 0 ? diariosCount : presInfo.total;
      const presPorcentagem = totalAulasReal > 0 ? Math.round((presInfo.presentes / totalAulasReal) * 100) : 100;

      const notasAvaliacoes = disciplina.avaliacoes.map((av: { id: number; titulo: string; notaMaxima: any }) => {
        const chave = `${u.id}_${av.id}`;
        const nota = mapaTentativas.get(chave) ?? null;
        return {
          idAvaliacao: av.id,
          titulo: av.titulo,
          notaObtida: nota,
          notaMaxima: Number(av.notaMaxima),
        };
      });

      const notasValidas = notasAvaliacoes.map((n: { notaObtida: number | null }) => n.notaObtida).filter((n: number | null): n is number => n !== null);
      const mediaFreq = notasValidas.length > 0
        ? Number((notasValidas.reduce((a: number, b: number) => a + b, 0) / notasValidas.length).toFixed(1))
        : 0;

      const notaExame = null;
      const notaFinal = mediaFreq;

      let estado: "APROVADO" | "RECURSO" | "REPROVADO" = "REPROVADO";
      if (notaFinal >= 10.0 && presPorcentagem >= 75) {
        estado = "APROVADO";
        totalAprovados++;
      } else if (notaFinal >= 7.0 && notaFinal < 10.0) {
        estado = "RECURSO";
        totalRecurso++;
      } else {
        estado = "REPROVADO";
        totalReprovados++;
      }

      somaNotasFinais += notaFinal;

      return {
        idEstudante: u.id,
        nomeEstudante: u.nome,
        numEstudante: u.numEstudanteLogin,
        numBi: u.numBi,
        presencasPorcentagem: presPorcentagem,
        totalAulas: totalAulasReal,
        totalPresencas: presInfo.presentes,
        notasAvaliacoes,
        mediaFrequencia: mediaFreq,
        notaExame,
        notaFinal,
        estadoAcademico: estado,
      };
    });

    const totalEst = estudantesPauta.length;
    const mediaTurma = totalEst > 0 ? Number((somaNotasFinais / totalEst).toFixed(1)) : 0;
    const taxaAprov = totalEst > 0 ? Math.round((totalAprovados / totalEst) * 100) : 0;

    return {
      disciplina: {
        id: disciplina.id,
        nomeDisciplina: disciplina.nomeDisciplina,
        semestre: disciplina.semestre,
        nomeCurso: disciplina.curso.nomeCurso,
        nomeUo: disciplina.curso.unidade.nomeUo,
      },
      turma,
      docente: docenteInfo,
      coordenador: disciplina.curso.coordenador || null,
      estudantes: estudantesPauta,
      estatisticas: {
        totalEstudantes: totalEst,
        aprovados: totalAprovados,
        recurso: totalRecurso,
        reprovados: totalReprovados,
        taxaAprovacao: taxaAprov,
        mediaTurma,
      },
    };
  }
}
