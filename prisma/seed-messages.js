const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function chaveDaConversa(id1, id2) {
  const [menor, maior] = [id1, id2].sort((a, b) => a - b);
  return `conversa-${menor}-${maior}`;
}

async function main() {
  console.log("💬 A semear conversas e mensagens privadas no PostgreSQL...\n");

  const admin = await prisma.usuario.findFirst({ where: { email: "admin@kimpa.ao" } });
  const professor = await prisma.usuario.findFirst({ where: { email: "professor@kimpa.ao" } });
  const coordenadora = await prisma.usuario.findFirst({ where: { email: "coordenador@kimpa.ao" } });
  const estudante = await prisma.usuario.findFirst({ where: { email: "estudante@kimpa.ao" } });

  if (!admin || !professor || !coordenadora || !estudante) {
    console.log("❌ Utilizadores não encontrados. Execute 'node prisma/seed-users.js' primeiro!");
    return;
  }

  // 1. Conversa entre Admin e Professor
  const chave1 = chaveDaConversa(admin.id, professor.id);
  let conversa1 = await prisma.grupo.findUnique({ where: { chaveConversa: chave1 } });

  if (!conversa1) {
    conversa1 = await prisma.grupo.create({
      data: {
        nomeGrupo: "Conversa Direta",
        tipoGrupo: "conversa",
        chaveConversa: chave1,
        idCriador: admin.id,
        membros: {
          create: [
            { idUsuario: admin.id, funcaoNoGrupo: "membro" },
            { idUsuario: professor.id, funcaoNoGrupo: "membro" },
          ],
        },
      },
    });

    await prisma.mensagem.createMany({
      data: [
        {
          idGrupo: conversa1.id,
          idEmissor: admin.id,
          conteudo: "Olá Professor! As pautas do 1º Semestre já foram validadas pelo conselho pedagógico.",
          tipoConteudo: "texto",
        },
        {
          idGrupo: conversa1.id,
          idEmissor: professor.id,
          conteudo: "Excelente notícias! Vou disponibilizar as notas na plataforma ainda hoje.",
          tipoConteudo: "texto",
        },
      ],
    });
    console.log("✅ Conversa privada semeada: Admin <-> Professor dos Santos.");
  }

  // 2. Conversa entre Coordenadora e Estudante
  const chave2 = chaveDaConversa(coordenadora.id, estudante.id);
  let conversa2 = await prisma.grupo.findUnique({ where: { chaveConversa: chave2 } });

  if (!conversa2) {
    conversa2 = await prisma.grupo.create({
      data: {
        nomeGrupo: "Conversa Direta",
        tipoGrupo: "conversa",
        chaveConversa: chave2,
        idCriador: estudante.id,
        membros: {
          create: [
            { idUsuario: estudante.id, funcaoNoGrupo: "membro" },
            { idUsuario: coordenadora.id, funcaoNoGrupo: "membro" },
          ],
        },
      },
    });

    await prisma.mensagem.createMany({
      data: [
        {
          idGrupo: conversa2.id,
          idEmissor: estudante.id,
          conteudo: "Boa tarde Dra. Ana! Gostaria de confirmar a data da apresentação do Projeto Vitrine.",
          tipoConteudo: "texto",
        },
        {
          idGrupo: conversa2.id,
          idEmissor: coordenadora.id,
          conteudo: "Olá João! As apresentações começam na próxima quarta-feira às 09h00 no Auditório A.",
          tipoConteudo: "texto",
        },
      ],
    });
    console.log("✅ Conversa privada semeada: Estudante <-> Coordenadora Mbemba.");
  }

  console.log("\n🎉 Seed de mensagens diretas no PostgreSQL concluído!");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error("❌ Erro ao semear mensagens:", e);
    prisma.$disconnect();
    process.exit(1);
  });
