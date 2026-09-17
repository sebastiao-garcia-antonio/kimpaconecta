// Script de Seed — Criar utilizadores de teste para cada perfil
// Executar: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-users.ts
// Ou via: npx tsx prisma/seed-users.ts

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const SENHA_PADRAO = "1234";

const utilizadores = [
  {
    nome: "Administrador Geral",
    email: "admin@kimpa.ao",
    numEstudanteLogin: null,
    perfil: "admin",
  },
  {
    nome: "Prof. Manuel dos Santos",
    email: "professor@kimpa.ao",
    numEstudanteLogin: null,
    perfil: "professor",
  },
  {
    nome: "Dra. Ana Luísa Mbemba",
    email: "coordenador@kimpa.ao",
    numEstudanteLogin: null,
    perfil: "coordenador",
  }, 
  {
    nome: "João Pedro Nkosi",
    email: "estudante@kimpa.ao",
    numEstudanteLogin: "EST2026001",
    perfil: "estudante",
  },
  {
    nome: "Maria Teresa Lopes",
    email: "estudante2@kimpa.ao",
    numEstudanteLogin: "EST2026002",
    perfil: "estudante",
  },
];

async function main() {
  console.log("🌱 A semear utilizadores de teste...\n");

  // 1. Garantir que os perfis padrão existam
  const perfisNomes = ["admin", "coordenador", "professor", "estudante"];
  for (const nome of perfisNomes) {
    await prisma.perfil.upsert({
      where: { nomePerfil: nome },
      update: {},
      create: { nomePerfil: nome },
    });
  }
  console.log("✅ Perfis criados/verificados: admin, coordenador, professor, estudante\n");

  // 2. Hash da senha padrão
  const senhaHash = await bcrypt.hash(SENHA_PADRAO, 10);

  // 3. Criar cada utilizador
  for (const u of utilizadores) {
    // Verificar se já existe
    const existente = await prisma.usuario.findFirst({
      where: { email: u.email },
    });

    if (existente) {
      console.log(`⏭️  ${u.perfil.toUpperCase().padEnd(12)} | ${u.email} — já existe, a saltar`);
      continue;
    }

    // Buscar o perfil
    const perfil = await prisma.perfil.findUnique({
      where: { nomePerfil: u.perfil },
    });

    if (!perfil) {
      console.log(`❌ Perfil "${u.perfil}" não encontrado!`);
      continue;
    }

    // Criar utilizador + associar perfil
    const novoUsuario = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          nome: u.nome,
          email: u.email,
          senha: senhaHash,
          numEstudanteLogin: u.numEstudanteLogin || null,
          status: "ativo",
        },
      });

      await tx.usuarioPerfil.create({
        data: {
          idUsuario: usuario.id,
          idPerfil: perfil.id,
        },
      });

      return usuario;
    });

    console.log(`✅ ${u.perfil.toUpperCase().padEnd(12)} | ${u.email} — criado (ID: ${novoUsuario.id})`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("🎉 Seed concluído! Credenciais de acesso:\n");
  console.log("  Senha para TODOS: " + SENHA_PADRAO);
  console.log("");
  console.log("  📧 admin@kimpa.ao        → Dashboard Admin");
  console.log("  📧 professor@kimpa.ao    → Dashboard Professor");
  console.log("  📧 coordenador@kimpa.ao  → Dashboard Coordenador");
  console.log("  📧 estudante@kimpa.ao    → Dashboard Estudante");
  console.log("  📧 estudante2@kimpa.ao   → Dashboard Estudante (2º)");
  console.log("=".repeat(60));
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error("❌ Erro:", e);
    prisma.$disconnect();
    process.exit(1);
  });
