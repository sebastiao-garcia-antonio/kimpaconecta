const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function semearAcademico() {
  console.log("🌱 Semeando estrutura académica (UOs, Cursos, Disciplinas, Turmas, Matrículas)...");

  // 1. Criar/obter Unidade Orgânica
  let uo = await prisma.unidadeOrganica.findFirst({
    where: { sigla: "FCT" },
  });
  if (!uo) {
    uo = await prisma.unidadeOrganica.create({
      data: {
        nomeUo: "Faculdade de Ciências e Tecnologia",
        sigla: "FCT",
        localizacao: "Campus Universitário do Uíge",
      },
    });
  }

  // 2. Obter usuários existentes
  const coord = await prisma.usuario.findFirst({ where: { email: "coordenador@kimpa.ao" } });
  const prof = await prisma.usuario.findFirst({ where: { email: "professor@kimpa.ao" } });
  const est1 = await prisma.usuario.findFirst({ where: { email: "estudante@kimpa.ao" } });
  const est2 = await prisma.usuario.findFirst({ where: { email: "estudante2@kimpa.ao" } });

  // 3. Criar Cursos
  let cursoInformatica = await prisma.curso.findFirst({
    where: { nomeCurso: "Engenharia Informática" },
  });
  if (!cursoInformatica) {
    cursoInformatica = await prisma.curso.create({
      data: {
        idUo: uo.id,
        nomeCurso: "Engenharia Informática",
        idCoordenador: coord ? coord.id : null,
      },
    });
  } else if (coord && cursoInformatica.idCoordenador !== coord.id) {
    await prisma.curso.update({
      where: { id: cursoInformatica.id },
      data: { idCoordenador: coord.id },
    });
  }

  let cursoEconomia = await prisma.curso.findFirst({
    where: { nomeCurso: "Economia" },
  });
  if (!cursoEconomia) {
    cursoEconomia = await prisma.curso.create({
      data: {
        idUo: uo.id,
        nomeCurso: "Economia",
      },
    });
  }

  // 4. Vincular coordenador e professor ao curso
  if (coord) {
    const vc = await prisma.usuarioCurso.findFirst({
      where: { idUsuario: coord.id, idCurso: cursoInformatica.id },
    });
    if (!vc) {
      await prisma.usuarioCurso.create({
        data: { idUsuario: coord.id, idCurso: cursoInformatica.id, dataVinculo: new Date() },
      });
    }
  }

  if (prof) {
    const vp = await prisma.usuarioCurso.findFirst({
      where: { idUsuario: prof.id, idCurso: cursoInformatica.id },
    });
    if (!vp) {
      await prisma.usuarioCurso.create({
        data: { idUsuario: prof.id, idCurso: cursoInformatica.id, dataVinculo: new Date() },
      });
    }
  }

  // 5. Criar Disciplinas
  const disciplinasDados = [
    { nome: "Algoritmos e Estruturas de Dados", semestre: 1, idDocente: prof?.id },
    { nome: "Cálculo Infinitesimal I", semestre: 1, idDocente: null },
    { nome: "Arquitetura de Computadores", semestre: 2, idDocente: prof?.id },
    { nome: "Sistemas Operativos", semestre: 3, idDocente: prof?.id },
    { nome: "Bases de Dados Relacionais", semestre: 3, idDocente: null },
    { nome: "Engenharia de Software", semestre: 4, idDocente: null },
  ];

  for (const d of disciplinasDados) {
    const existe = await prisma.disciplina.findFirst({
      where: { idCurso: cursoInformatica.id, nomeDisciplina: d.nome },
    });
    if (!existe) {
      await prisma.disciplina.create({
        data: {
          idCurso: cursoInformatica.id,
          nomeDisciplina: d.nome,
          semestre: d.semestre,
          idDocente: d.idDocente || null,
        },
      });
    } else if (d.idDocente && !existe.idDocente) {
      await prisma.disciplina.update({
        where: { id: existe.id },
        data: { idDocente: d.idDocente },
      });
    }
  }

  // 6. Criar Turmas
  let turma1 = await prisma.turma.findFirst({
    where: { idCurso: cursoInformatica.id, nomeTurma: "EI-1M" },
  });
  if (!turma1) {
    turma1 = await prisma.turma.create({
      data: {
        idCurso: cursoInformatica.id,
        nomeTurma: "EI-1M",
        anoCurricular: 1,
        periodo: "Manhã",
      },
    });
  }

  let turma2 = await prisma.turma.findFirst({
    where: { idCurso: cursoInformatica.id, nomeTurma: "EI-2T" },
  });
  if (!turma2) {
    turma2 = await prisma.turma.create({
      data: {
        idCurso: cursoInformatica.id,
        nomeTurma: "EI-2T",
        anoCurricular: 2,
        periodo: "Tarde",
      },
    });
  }

  // 7. Matrículas (um mentor e um não-mentor)
  if (est1) {
    const mat1 = await prisma.matricula.findFirst({
      where: { idUsuario: est1.id },
    });
    if (!mat1) {
      await prisma.matricula.create({
        data: {
          idUsuario: est1.id,
          idTurma: turma2.id,
          numProcesso: "2026/001",
          anoLectivo: 2026,
          isMentor: true, // Mentor!
        },
      });
    }
  }

  if (est2) {
    const mat2 = await prisma.matricula.findFirst({
      where: { idUsuario: est2.id },
    });
    if (!mat2) {
      await prisma.matricula.create({
        data: {
          idUsuario: est2.id,
          idTurma: turma1.id,
          numProcesso: "2026/002",
          anoLectivo: 2026,
          isMentor: false, // Não mentor
        },
      });
    }
  }

  console.log("✅ Estrutura académica semeada com sucesso!");
}

semearAcademico()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
