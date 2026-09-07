const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // 1. Verificar se os utilizadores existem e testar bcrypt
  const emails = ["admin@kimpa.ao", "professor@kimpa.ao", "coordenador@kimpa.ao", "estudante@kimpa.ao"];
  
  for (const email of emails) {
    const user = await prisma.usuario.findFirst({
      where: { email },
      include: { perfis: { include: { perfil: true } } }
    });

    if (!user) {
      console.log(`❌ ${email} — NÃO ENCONTRADO na base de dados`);
      continue;
    }

    // Testar a senha actual
    const testSenha = await bcrypt.compare("1234", user.senha);
    console.log(`${email} | status: ${user.status} | roles: [${user.perfis.map(p => p.perfil.nomePerfil)}] | senha "1234" match: ${testSenha} | hash: ${user.senha.substring(0, 20)}...`);
  }

  // 2. Forçar reset - gerar novo hash e gravar
  console.log("\n🔧 A forçar reset de todas as senhas para '1234'...\n");
  const novoHash = await bcrypt.hash("1234", 10);
  console.log(`Novo hash gerado: ${novoHash}`);
  
  // Verificar que o novo hash funciona
  const testNovoHash = await bcrypt.compare("1234", novoHash);
  console.log(`Verificação do novo hash: ${testNovoHash}\n`);

  for (const email of emails) {
    await prisma.usuario.updateMany({
      where: { email },
      data: { senha: novoHash, status: "ativo" }
    });
    console.log(`✅ ${email} — senha resetada`);
  }

  // 3. Verificação final
  console.log("\n📋 Verificação final:");
  for (const email of emails) {
    const user = await prisma.usuario.findFirst({ where: { email } });
    if (user) {
      const ok = await bcrypt.compare("1234", user.senha);
      console.log(`   ${email} → bcrypt.compare("1234"): ${ok}`);
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
