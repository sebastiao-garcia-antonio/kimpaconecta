const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 A semear dados dinâmicos do Feed e Vitrine no PostgreSQL...\n");

  // Buscar utilizadores existentes
  const admin = await prisma.usuario.findFirst({ where: { email: "admin@kimpa.ao" } });
  const professor = await prisma.usuario.findFirst({ where: { email: "professor@kimpa.ao" } });
  const coordenadora = await prisma.usuario.findFirst({ where: { email: "coordenador@kimpa.ao" } });
  const estudante = await prisma.usuario.findFirst({ where: { email: "estudante@kimpa.ao" } });

  if (!admin || !professor || !coordenadora || !estudante) {
    console.log("❌ Utilizadores não encontrados. Execute 'node prisma/seed-users.js' primeiro!");
    return;
  }

  // 1. Semear Publicações no Feed
  const publicacoesCount = await prisma.publicacao.count();
  if (publicacoesCount === 0) {
    await prisma.publicacao.createMany({
      data: [
        {
          idAutor: admin.id,
          conteudo: "📢 Inscrições abertas para o 2º Semestre 2025/2026! Todos os estudantes devem confirmar a matrícula e atualizar a documentação até ao dia 15 de Julho.",
          estado: "publicado",
        },
        {
          idAutor: professor.id,
          conteudo: "💼 A TechAngola abriu candidaturas para estagiários em Desenvolvimento Web (Next.js & Node.js) e Cloud Computing. Candidatem-se na secção de Oportunidades!",
          estado: "publicado",
        },
        {
          idAutor: coordenadora.id,
          conteudo: "📊 Os resultados preliminares do 1º Semestre foram publicados! Taxa de aprovação global: 90%. Parabéns a todos os estudantes e docentes pelo empenho!",
          estado: "publicado",
        },
        {
          idAutor: estudante.id,
          conteudo: "🚀 Orgulho em apresentar o nosso projeto de final de ano: uma plataforma de E-Learning integrativa para a Universidade Kimpa Vita!",
          estado: "publicado",
        },
      ],
    });
    console.log("✅ 4 Publicações dinâmicas semeadas no Feed.");
  } else {
    console.log(`⏭️  Publicações já existem no banco de dados (${publicacoesCount}).`);
  }

  // 2. Semear Projetos na Vitrine
  const projetosCount = await prisma.projetoVitrine.count();
  if (projetosCount === 0) {
    const projeto1 = await prisma.projetoVitrine.create({
      data: {
        tituloProjeto: "Kimpa Connect - Plataforma Integrativa",
        descricao: "Plataforma académica e social desenvolvida com Next.js 15, Prisma e PostgreSQL para a Universidade Kimpa Vita.",
        urlRepositorio: "https://github.com/kimpa/connect",
        urlDemonstracao: "http://localhost:3000",
        idProfessorAutorizador: professor.id,
      },
    });

    await prisma.projetoAutor.create({
      data: {
        idProjeto: projeto1.id,
        idUsuario: estudante.id,
      },
    });

    const projeto2 = await prisma.projetoVitrine.create({
      data: {
        tituloProjeto: "Smart Campus & Presenças por IA",
        descricao: "Sistema de gestão de presenças em sala de aula e monitorização de exames online com anti-fraude.",
        urlRepositorio: "https://github.com/kimpa/smart-campus",
        idProfessorAutorizador: professor.id,
      },
    });

    await prisma.projetoAutor.create({
      data: {
        idProjeto: projeto2.id,
        idUsuario: estudante.id,
      },
    });

    console.log("✅ 2 Projetos semearam a Vitrine de Projetos.");
  } else {
    console.log(`⏭️  Projetos Vitrine já existem (${projetosCount}).`);
  }

  // 3. Semear Oportunidades Académicas
  const oportunidadesCount = await prisma.oportunidadeAcademica.count();
  if (oportunidadesCount === 0) {
    await prisma.oportunidadeAcademica.createMany({
      data: [
        {
          titulo: "Estágio em Desenvolvimento Web Fullstack",
          descricao: "Oportunidade de estágio prático com Next.js, Node.js e PostgreSQL para estudantes do 3º e 4º ano.",
          tipo: "estagio",
          empresa: "TechAngola Solutions",
          requisitos: "Conhecimentos em JavaScript/TypeScript e SQL.",
          criadoPor: professor.id,
        },
        {
          titulo: "Bolsa de Pesquisa em Inteligência Artificial",
          descricao: "Pesquisa aplicada ao desenvolvimento de modelos de suporte à decisão académica.",
          tipo: "pesquisa",
          empresa: "Laboratório de Inovação Kimpa Vita",
          requisitos: "Interesse em IA e Ciência de Dados.",
          criadoPor: coordenadora.id,
        },
      ],
    });
    console.log("✅ 2 Oportunidades académicas semeadas.");
  } else {
    console.log(`⏭️  Oportunidades já existem (${oportunidadesCount}).`);
  }

  console.log("\n🎉 Seed dinâmico concluído com sucesso!");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error("❌ Erro ao semear feed:", e);
    prisma.$disconnect();
    process.exit(1);
  });
