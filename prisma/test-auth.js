const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  // Simular exactamente o que o authorize faz
  const identifier = "admin@kimpa.ao";
  const password = "1234";

  const user = await prisma.usuario.findFirst({
    where: {
      OR: [
        { email: identifier },
        { numEstudanteLogin: identifier }
      ]
    },
    include: {
      perfis: {
        include: {
          perfil: true
        }
      }
    }
  });

  if (!user) {
    console.log("❌ Utilizador NÃO encontrado");
    return;
  }

  console.log("✅ Utilizador encontrado:", user.nome);
  console.log("   Status:", user.status);
  console.log("   Status === 'ativo':", user.status === "ativo");
  console.log("   Roles:", user.perfis.map(p => p.perfil.nomePerfil));
  
  const matches = await bcrypt.compare(password, user.senha);
  console.log("   bcrypt.compare:", matches);
  
  // Verificar se há caracteres invisíveis no status
  console.log("   Status chars:", JSON.stringify(user.status));
  console.log("   Status length:", user.status.length);

  if (user.status !== "ativo") {
    console.log("\n⚠️  PROBLEMA: status não é exactamente 'ativo'!");
  }
  if (!matches) {
    console.log("\n⚠️  PROBLEMA: senha não coincide!");
  }
  if (user.status === "ativo" && matches) {
    console.log("\n✅ Authorize DEVERIA funcionar — problema está noutro lado");
  }
}

main().then(() => prisma.$disconnect());
