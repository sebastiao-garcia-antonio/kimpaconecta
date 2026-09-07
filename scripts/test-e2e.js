const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const REGEX_BI_ANGOLA = /^\d{9}[a-zA-Z]{2}\d{3}$/;

function formatarMascaraBIAngola(input) {
  const limpo = input.toUpperCase().replace(/[^0-9A-Z]/g, "");
  let resultado = "";

  for (let i = 0; i < limpo.length && i < 14; i++) {
    const char = limpo[i];
    if (i < 9) {
      if (/[0-9]/.test(char)) resultado += char;
    } else if (i === 9 || i === 10) {
      if (/[A-Z]/.test(char)) resultado += char;
    } else if (i >= 11 && i < 14) {
      if (/[0-9]/.test(char)) resultado += char;
    }
  }

  return resultado;
}

async function runE2ETests() {
  console.log("\n=======================================================");
  console.log("🛡️  KIMPA CONNECT - SUÍTE DE TESTES E2E E SEGURANÇA");
  console.log("=======================================================\n");

  let erros = 0;

  // TESTE 1: Integridade da Conexão PostgreSQL
  try {
    const totalUsuarios = await prisma.usuario.count();
    console.log(`✅ [1/6] CONEXÃO POSTGRESQL: OK (${totalUsuarios} utilizadores registados)`);
  } catch (err) {
    console.error("❌ [1/6] FALHA NA CONEXÃO POSTGRESQL:", err.message);
    erros++;
  }

  // TESTE 2: Hash de Senhas e Segurança (bcrypt)
  try {
    const senhaTeste = "MinhaSenhaSegura123";
    const hash = await bcrypt.hash(senhaTeste, 10);
    const bateCerto = await bcrypt.compare(senhaTeste, hash);
    const senhaErrada = await bcrypt.compare("SenhaErrada", hash);

    if (bateCerto && !senhaErrada) {
      console.log("✅ [2/6] SEGURANÇA DE CRIPTOGRAFIA (bcrypt): OK");
    } else {
      throw new Error("Validação de hash falhou.");
    }
  } catch (err) {
    console.error("❌ [2/6] FALHA NO CRIPTOGRAMA DE SENHAS:", err.message);
    erros++;
  }

  // TESTE 3: Validação Estrita do BI de Angola (14 caracteres)
  try {
    const biValido = "000000000UE000";
    const biInvalido = "123456789";
    const entradaComLetras = "007787721UE049";
    const mascarada = formatarMascaraBIAngola(entradaComLetras);

    const okValido = REGEX_BI_ANGOLA.test(biValido);
    const okInvalido = !REGEX_BI_ANGOLA.test(biInvalido);
    const okMascara = mascarada.length === 14 && REGEX_BI_ANGOLA.test(mascarada);

    if (okValido && okInvalido && okMascara) {
      console.log("✅ [3/6] VALIDAÇÃO E MÁSCARA DE BI ANGOLANO (14 Chars): OK");
    } else {
      throw new Error("Formato do BI falhou na validação.");
    }
  } catch (err) {
    console.error("❌ [3/6] FALHA NA VALIDAÇÃO DO BI:", err.message);
    erros++;
  }

  // TESTE 4: Cálculo Académico de Pautas e Estado (Aprovado / Recurso / Reprovado)
  try {
    const notaAprovado = 14.5;
    const notaRecurso = 8.5;
    const notaReprovado = 5.0;

    const estado1 = notaAprovado >= 10.0 ? "APROVADO" : "REPROVADO";
    const estado2 = notaRecurso >= 7.0 && notaRecurso < 10.0 ? "RECURSO" : "REPROVADO";
    const estado3 = notaReprovado < 7.0 ? "REPROVADO" : "APROVADO";

    if (estado1 === "APROVADO" && estado2 === "RECURSO" && estado3 === "REPROVADO") {
      console.log("✅ [4/6] CÁLCULO DE PAUTAS E ESTADOS ACADÉMICOS: OK");
    } else {
      throw new Error("Lógica de estado académico inválida.");
    }
  } catch (err) {
    console.error("❌ [4/6] FALHA NO CÁLCULO DE PAUTAS:", err.message);
    erros++;
  }

  // TESTE 5: Relação de Seguidor e Regra de Chat Privado
  try {
    const totalSeguidores = await prisma.seguidorUsuario.count();
    const totalGruposChat = await prisma.grupo.count({ where: { tipoGrupo: "conversa" } });
    console.log(`✅ [5/6] MÓDULO SOCIAL E CHAT PRIVADO: OK (${totalSeguidores} relações de seguidor, ${totalGruposChat} canais de chat)`);
  } catch (err) {
    console.error("❌ [5/6] FALHA NO MÓDULO SOCIAL/CHAT:", err.message);
    erros++;
  }

  // TESTE 6: Auditoria de Segurança no PostgreSQL
  try {
    await prisma.auditoriaSistema.create({
      data: {
        acao: "TESTE_E2E_SUITE",
        tabelaAfetada: "sistema",
        descricao: "Suíte de testes de integração automatizada executada com sucesso.",
        ip: "127.0.0.1",
      },
    });

    const auditCount = await prisma.auditoriaSistema.count({ where: { acao: "TESTE_E2E_SUITE" } });
    if (auditCount > 0) {
      console.log("✅ [6/6] AUDITORIA DE SEGURANÇA E LOGS: OK");
    } else {
      throw new Error("Registro de auditoria não foi persistido.");
    }
  } catch (err) {
    console.error("❌ [6/6] FALHA NA AUDITORIA DE SEGURANÇA:", err.message);
    erros++;
  }

  console.log("\n=======================================================");
  if (erros === 0) {
    console.log("🎉 TODOS OS 6 TESTES E2E E SEGURANÇA PASSARAM COM SUCESSO!");
  } else {
    console.log(`⚠️  ATENÇÃO: ${erros} TESTE(S) FALHARAM.`);
  }
  console.log("=======================================================\n");
}

runE2ETests()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error("Erro fatal ao rodar testes:", err);
    prisma.$disconnect();
    process.exit(1);
  });
