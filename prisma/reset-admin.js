const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function run() {
  const hash = await bcrypt.hash('1234', 10);

  const u = await prisma.usuario.updateMany({
    where: { email: 'admin@kimpa.ao' },
    data: { senha: hash, status: 'ativo' }
  });
  console.log('Senha resetada. Linhas afetadas:', u.count);

  const admin = await prisma.usuario.findFirst({
    where: { email: 'admin@kimpa.ao' },
    include: { perfis: { include: { perfil: true } } }
  });

  if (!admin) {
    console.log('❌ Utilizador NÃO encontrado!');
  } else {
    console.log('✅ Admin encontrado:');
    console.log('   ID:', admin.id);
    console.log('   Email:', admin.email);
    console.log('   Status:', admin.status);
    console.log('   Perfis:', admin.perfis.map(p => p.perfil.nomePerfil));
    
    // Testar o hash
    const ok = await bcrypt.compare('1234', admin.senha);
    console.log('   Senha "1234" válida:', ok);
  }

  await prisma.$disconnect();
}

run().catch(e => {
  console.error('Erro:', e.message);
  process.exit(1);
});
