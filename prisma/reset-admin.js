const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Usar a URL da Neon passada como argumento ou variável de ambiente
const DATABASE_URL = process.argv[2] || process.env.DATABASE_URL;

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } }
});

async function run() {
  console.log('🔌 A ligar à base de dados...');
  console.log('   Host:', DATABASE_URL.split('@')[1]?.split('/')[0] || '???');

  try {
    // Verificar admin
    const admin = await prisma.usuario.findFirst({
      where: { email: 'admin@kimpa.ao' },
      include: { perfis: { include: { perfil: true } } }
    });

    if (!admin) {
      console.log('\n❌ Utilizador admin@kimpa.ao NÃO existe nesta base de dados!');
      console.log('   → A criar agora...');
      
      // Garantir perfil admin
      await prisma.perfil.upsert({
        where: { nomePerfil: 'admin' },
        update: {},
        create: { nomePerfil: 'admin' }
      });
      await prisma.perfil.upsert({
        where: { nomePerfil: 'coordenador' },
        update: {},
        create: { nomePerfil: 'coordenador' }
      });
      await prisma.perfil.upsert({
        where: { nomePerfil: 'professor' },
        update: {},
        create: { nomePerfil: 'professor' }
      });
      await prisma.perfil.upsert({
        where: { nomePerfil: 'estudante' },
        update: {},
        create: { nomePerfil: 'estudante' }
      });

      const perfil = await prisma.perfil.findUnique({ where: { nomePerfil: 'admin' } });
      const hash = await bcrypt.hash('1234', 10);

      const novoAdmin = await prisma.$transaction(async (tx) => {
        const u = await tx.usuario.create({
          data: {
            nome: 'Administrador Geral',
            email: 'admin@kimpa.ao',
            senha: hash,
            status: 'ativo'
          }
        });
        await tx.usuarioPerfil.create({
          data: { idUsuario: u.id, idPerfil: perfil.id }
        });
        return u;
      });

      console.log('   ✅ Admin criado! ID:', novoAdmin.id);
    } else {
      console.log('\n✅ Admin encontrado:');
      console.log('   ID:', admin.id);
      console.log('   Email:', admin.email);
      console.log('   Status:', admin.status);
      console.log('   Perfis:', admin.perfis.map(p => p.perfil.nomePerfil));

      // Testar senha
      const ok = await bcrypt.compare('1234', admin.senha);
      console.log('   Senha "1234" válida:', ok);

      if (!ok) {
        console.log('\n   ⚠️  Senha incorreta! A resetar para "1234"...');
        const hash = await bcrypt.hash('1234', 10);
        await prisma.usuario.update({
          where: { id: admin.id },
          data: { senha: hash, status: 'ativo' }
        });
        console.log('   ✅ Senha resetada com sucesso!');
      }

      if (admin.status !== 'ativo') {
        console.log('\n   ⚠️  Status não é "ativo"! A corrigir...');
        await prisma.usuario.update({
          where: { id: admin.id },
          data: { status: 'ativo' }
        });
        console.log('   ✅ Status corrigido!');
      }
    }

    console.log('\n🎉 Pronto! Credenciais: admin@kimpa.ao / 1234');
  } catch (e) {
    console.error('\n❌ Erro:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
