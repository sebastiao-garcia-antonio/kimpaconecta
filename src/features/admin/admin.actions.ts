"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { validarVariosTextosSeguros } from "@/lib/validacao-texto";
import { enviarEmailDecisaoSolicitacao } from "@/lib/notificacoes-email";

// Auxiliar para garantir que quem executa a ação é Administrador
async function verificarAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Não autorizado. Faça login primeiro.");
  }
  const roles = (session.user as any).roles || [];
  if (!roles.includes("admin")) {
    throw new Error("Não autorizado. Apenas administradores podem executar esta ação.");
  }
  return session.user;
}

async function verificarCoordenadorSolicitacao() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Não autorizado. Faça login primeiro.");
  }

  const roles = (session.user as any).roles || [];
  if (!roles.includes("coordenador")) {
    throw new Error("Não autorizado. Apenas coordenadores podem executar esta ação.");
  }

  return {
    usuario: session.user
  };
}

// Auxiliar para registrar ações de Auditoria
async function registrarAuditoria(idUsuario: number, acao: string, tabelaAfetada: string, idRegistroAfetado: number, descricao: string) {
  try {
    await prisma.auditoriaSistema.create({
      data: {
        idUsuario,
        acao,
        tabelaAfetada,
        idRegistroAfetado: BigInt(idRegistroAfetado),
        descricao,
        ip: "127.0.0.1"
      }
    });
  } catch (e) {
    console.error("Falha ao registar auditoria:", e);
  }
}

// 1. Obter dados analíticos e de métricas do Dashboard
export async function obterDadosDashboardCompleto() {
  await verificarAdmin();

  try {
    const totalEstudantes = await prisma.usuarioPerfil.count({
      where: { perfil: { nomePerfil: "estudante" } }
    });

    const totalProfessores = await prisma.usuarioPerfil.count({
      where: { perfil: { nomePerfil: "professor" } }
    });

    const totalCoordenadores = await prisma.usuarioPerfil.count({
      where: { perfil: { nomePerfil: "coordenador" } }
    });

    const totalCursos = await prisma.curso.count();
    const totalProjetos = await prisma.projetoVitrine.count();
    const totalSolicitacoes = await prisma.solicitacaoAcesso.count({
      where: { status: "pendente" }
    });
    
    const totalAlertasProctoring = await prisma.logsSeguranca.count();

    // Obter últimos 5 logs de proctoring (alertas de segurança)
    const logsSegurancaRecentes = await prisma.logsSeguranca.findMany({
      take: 5,
      orderBy: { dataRegisto: "desc" },
      include: {
        tentativa: {
          include: {
            estudante: { select: { nome: true, email: true } },
            avaliacao: { select: { titulo: true } }
          }
        }
      }
    });

    // Obter últimos 5 logs de auditoria de sistema
    const logsAuditoriaRecentes = await prisma.auditoriaSistema.findMany({
      take: 5,
      orderBy: { dataRegisto: "desc" },
      include: {
        usuario: { select: { nome: true } }
      }
    });

    return {
      metricas: {
        totalEstudantes,
        totalProfessores,
        totalCoordenadores,
        totalCursos,
        totalProjetos,
        totalSolicitacoes,
        totalAlertasProctoring
      },
      logsSegurancaRecentes: logsSegurancaRecentes.map(log => ({
        id: String(log.id),
        tipoEvento: log.tipoEvento,
        descricao: log.descricao,
        dataRegisto: log.dataRegisto,
        estudanteNome: log.tentativa.estudante.nome,
        estudanteEmail: log.tentativa.estudante.email,
        provaTitulo: log.tentativa.avaliacao.titulo,
        idTentativa: log.idTentativa
      })),
      logsAuditoriaRecentes: logsAuditoriaRecentes.map(log => ({
        id: String(log.idAuditoria),
        acao: log.acao,
        tabelaAfetada: log.tabelaAfetada,
        descricao: log.descricao,
        dataRegisto: log.dataRegisto,
        usuarioNome: log.usuario?.nome || "Sistema"
      }))
    };
  } catch (error) {
    console.error("Erro ao obter dados do dashboard:", error);
    throw new Error("Falha ao carregar dados do painel.");
  }
}

// 2. Obter utilizadores e perfis
export async function obterUtilizadores() {
  await verificarAdmin();

  return prisma.usuario.findMany({
    orderBy: { nome: "asc" },
    include: {
      perfis: {
        include: { perfil: true }
      }
    }
  });
}

// 3. Criar utilizador manualmente (Fluxo Admin)
export async function criarUtilizadorManual(data: {
  nome: string;
  email: string;
  senhaProvisoria: string;
  numEstudanteLogin?: string;
  perfilNome: string;
}) {
  const adminUser = await verificarAdmin();

  try {
    const validacaoTexto = validarVariosTextosSeguros([
      { nome: "nome", valor: data.nome, obrigatorio: true, maxLength: 120 },
      { nome: "email", valor: data.email, obrigatorio: true, maxLength: 120 },
      { nome: "numEstudanteLogin", valor: data.numEstudanteLogin, maxLength: 60 }
    ]);

    if (!validacaoTexto.ok) {
      return { error: validacaoTexto.erro };
    }

    // 1. Garantir que os perfis existem
    await AuthRepository_inicializarPerfis();

    // 2. Encontrar o perfil correspondente
    const perfil = await prisma.perfil.findUnique({
      where: { nomePerfil: data.perfilNome }
    });

    if (!perfil) {
      return { error: `Perfil '${data.perfilNome}' não cadastrado.` };
    }

    // 3. Criptografar a senha
    const hashed = await bcrypt.hash(data.senhaProvisoria, 10);

    // 4. Criar utilizador sob transação
    const usuario = await prisma.$transaction(async (tx) => {
      const u = await tx.usuario.create({
        data: {
          nome: data.nome,
          email: data.email,
          senha: hashed,
          numEstudanteLogin: data.numEstudanteLogin || null,
          status: "ativo"
        }
      });

      await tx.usuarioPerfil.create({
        data: {
          idUsuario: u.id,
          idPerfil: perfil.id
        }
      });

      return u;
    });

    await registrarAuditoria(
      Number(adminUser.id),
      "Criação Utilizador",
      "usuario",
      usuario.id,
      `Criado utilizador manual ${usuario.nome} (${data.perfilNome})`
    );

    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao cadastrar utilizador:", error);
    return { error: "Erro ao cadastrar utilizador ou e-mail/registo já existente." };
  }
}

// Auxiliar local para garantir perfis
async function AuthRepository_inicializarPerfis() {
  const perfisPadrao = ["admin", "coordenador", "professor", "estudante"];
  for (const nome of perfisPadrao) {
    await prisma.perfil.upsert({
      where: { nomePerfil: nome },
      update: {},
      create: { nomePerfil: nome }
    });
  }
}

// 4. Alterar papel (role) de um utilizador
export async function alterarPapelUtilizador(idUsuario: number, perfilNomeNovo: string) {
  const adminUser = await verificarAdmin();

  try {
    const perfil = await prisma.perfil.findUnique({
      where: { nomePerfil: perfilNomeNovo }
    });

    if (!perfil) {
      return { error: "Perfil selecionado não existe." };
    }

    await prisma.$transaction(async (tx) => {
      // Remover perfis antigos
      await tx.usuarioPerfil.deleteMany({
        where: { idUsuario }
      });

      // Associar novo perfil
      await tx.usuarioPerfil.create({
        data: {
          idUsuario,
          idPerfil: perfil.id
        }
      });
    });

    await registrarAuditoria(
      Number(adminUser.id),
      "Alteração Perfil",
      "usuario",
      idUsuario,
      `Alterado papel do utilizador para ${perfilNomeNovo}`
    );

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Erro ao alterar papel do utilizador." };
  }
}

// 5. Excluir utilizador da base de dados
export async function excluirUtilizador(idUsuario: number) {
  const adminUser = await verificarAdmin();

  try {
    const usuario = await prisma.usuario.delete({
      where: { id: idUsuario }
    });

    await registrarAuditoria(
      Number(adminUser.id),
      "Remoção Utilizador",
      "usuario",
      idUsuario,
      `Eliminado utilizador da base de dados: ${usuario.nome}`
    );

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Erro ao eliminar utilizador." };
  }
}

// 6. Alterar estado de suspensão do utilizador
export async function alterarEstadoUtilizador(idUsuario: number, novoEstado: string) {
  const adminUser = await verificarAdmin();

  try {
    const usuario = await prisma.usuario.update({
      where: { id: idUsuario },
      data: { status: novoEstado }
    });

    await registrarAuditoria(
      Number(adminUser.id),
      "Alteração Estado",
      "usuario",
      idUsuario,
      `Estado do utilizador ${usuario.nome} atualizado para '${novoEstado}'`
    );

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Erro ao atualizar estado do utilizador." };
  }
}

// 7. Obter solicitações de acesso pendentes
export async function obterSolicitacoesAcesso() {
  await verificarAdmin();

  return prisma.solicitacaoAcesso.findMany({
    orderBy: { dataSolicitacao: "desc" },
    include: {
      curso: {
        select: {
          nomeCurso: true,
          idCoordenador: true,
          unidade: {
            select: {
              nomeUo: true,
              sigla: true
            }
          }
        }
      },
      turma: {
        select: {
          id: true,
          nomeTurma: true,
          anoCurricular: true,
          periodo: true
        }
      }
    }
  });
}

// 7. Obter solicitações de acesso pendentes
export async function obterSolicitacoesDoCoordenador() {
  const coordenador = await verificarCoordenadorSolicitacao();
  const idCoordenador = Number(coordenador.usuario.id);

  return prisma.solicitacaoAcesso.findMany({
    where: {
      curso: {
        idCoordenador
      }
    },
    orderBy: { dataSolicitacao: "desc" },
    include: {
      curso: {
        select: {
          nomeCurso: true,
          idCoordenador: true,
          unidade: {
            select: {
              nomeUo: true,
              sigla: true
            }
          }
        }
      },
      turma: {
        select: {
          id: true,
          nomeTurma: true,
          anoCurricular: true,
          periodo: true
        }
      }
    }
  });
}

// 8. Processar aprovação/rejeição de Solicitação de Acesso
export async function processarSolicitacaoAcesso(idSolicitacao: number, aprovado: boolean) {
  const coordenador = await verificarCoordenadorSolicitacao();
  const adminUser = coordenador.usuario;

  try {
    const solicitacao = await prisma.solicitacaoAcesso.findUnique({
      where: { id: idSolicitacao },
      include: {
        curso: {
          include: {
            unidade: true
          }
        },
        turma: true
      }
    });

    if (!solicitacao) {
      return { error: "Solicitação não encontrada." };
    }

    if (solicitacao.status !== "pendente") {
      return { error: "Esta solicitação já foi processada." };
    }

    if (solicitacao.curso.idCoordenador !== Number(adminUser.id)) {
      return { error: "Esta solicitação não pertence a um curso sob a sua coordenação." };
    }

    if (!aprovado) {
      await prisma.solicitacaoAcesso.update({
        where: { id: idSolicitacao },
        data: {
          status: "rejeitado",
          idCoordenadorValidador: Number(adminUser.id)
        }
      });

      await registrarAuditoria(
        Number(adminUser.id),
        "Rejeição Acesso",
        "solicitacao_acesso",
        idSolicitacao,
        `Rejeitado pedido de acesso de ${solicitacao.nomeCompleto}`
      );

      revalidatePath("/coordenador/solicitacoes");
      return { success: true, message: "Solicitação rejeitada com sucesso." };
    }

    await AuthRepository_inicializarPerfis();
    const perfilEstudante = await prisma.perfil.findUnique({
      where: { nomePerfil: "estudante" }
    });

    if (!perfilEstudante) {
      return { error: "Perfil de estudante não está inicializado na base de dados." };
    }

    const usuarioCriado = await prisma.$transaction(async (tx) => {
      const u = await tx.usuario.create({
        data: {
          nome: solicitacao.nomeCompleto,
          email: solicitacao.email,
          senha: solicitacao.senhaProvisoria,
          numEstudanteLogin: solicitacao.numEstudante,
          numBi: solicitacao.numBi || null,
          telefone: solicitacao.telefone || null,
          status: "ativo"
        }
      });

      await tx.usuarioPerfil.create({
        data: {
          idUsuario: u.id,
          idPerfil: perfilEstudante.id
        }
      });

      await tx.usuarioCurso.create({
        data: {
          idUsuario: u.id,
          idCurso: solicitacao.idCurso,
          dataVinculo: new Date()
        }
      });

      if (solicitacao.idTurma) {
        await tx.matricula.create({
          data: {
            idUsuario: u.id,
            idTurma: solicitacao.idTurma,
            numProcesso: solicitacao.numEstudante,
            anoLectivo: new Date().getFullYear()
          }
        });
      }

      await tx.solicitacaoAcesso.update({
        where: { id: idSolicitacao },
        data: {
          status: "aprovado",
          idCoordenadorValidador: Number(adminUser.id)
        }
      });

      return u;
    });

    await prisma.notificacao.create({
      data: {
        idUsuario: usuarioCriado.id,
        titulo: "Pedido de acesso aprovado",
        mensagem: "A sua solicitação de acesso foi aprovada. Pode entrar e concluir a configuração do seu perfil.",
        tipo: "sistema",
        prioridade: "alta",
        lida: false
      }
    });

    await registrarAuditoria(
      Number(adminUser.id),
      "Aprovação Acesso",
      "solicitacao_acesso",
      idSolicitacao,
      `Aprovado pedido de acesso de ${solicitacao.nomeCompleto}. Utilizador criado ID ${usuarioCriado.id}`
    );

    revalidatePath("/coordenador/solicitacoes");
    return { success: true, message: `Utilizador ${solicitacao.nomeCompleto} aprovado e cadastrado!` };
  } catch (error: any) {
    console.error("Erro ao processar solicitação:", error);
    return { error: "Erro ao processar a solicitação de acesso ou e-mail/registo já existente." };
  }
}

// 9. Obter painel global de proctoring
export async function obterPainelProctoringGlobal() {
  await verificarAdmin();

  const [tentativasBrutas, logsRecentesBrutos] = await Promise.all([
    prisma.tentativaAvaliacao.findMany({
      where: { statusTentativa: { in: ["em_curso", "bloqueada"] } },
      orderBy: { id: "desc" },
      include: {
        estudante: {
          select: { id: true, nome: true, email: true, numEstudanteLogin: true, fotoPerfil: true }
        },
        avaliacao: {
          select: { id: true, titulo: true, dataInicio: true, dataFim: true }
        },
        monitoramento: true,
        logsSeguranca: {
          orderBy: { dataRegisto: "desc" },
          take: 5
        }
      }
    }),
    prisma.logsSeguranca.findMany({
      take: 20,
      orderBy: { dataRegisto: "desc" },
      include: {
        tentativa: {
          include: {
            estudante: { select: { nome: true, email: true, numEstudanteLogin: true } },
            avaliacao: { select: { titulo: true } }
          }
        }
      }
    })
  ]);

  const tentativas = tentativasBrutas as any[];
  const logsRecentes = logsRecentesBrutos as any[];

  const totalAtivas = tentativas.filter((tentativa: any) => tentativa.statusTentativa === "em_curso").length;
  const totalBloqueadas = tentativas.filter((tentativa: any) => tentativa.statusTentativa === "bloqueada").length;
  const totalAlertasAltos = tentativas.filter((tentativa: any) => tentativa.monitoramento?.nivelSuspeita === "alto").length;
  return {
    metricas: {
      totalAtivas,
      totalBloqueadas,
      totalAlertasAltos,
      totalTentativas: tentativas.length,
      totalLogs: logsRecentes.length
    },
    tentativas: tentativas.map((tentativa: any) => ({
      id: Number(tentativa.id),
      idAvaliacao: Number(tentativa.idAvaliacao),
      statusTentativa: tentativa.statusTentativa,
      estudante: tentativa.estudante,
      avaliacao: tentativa.avaliacao,
      monitoramento: tentativa.monitoramento,
      logsSeguranca: tentativa.logsSeguranca.map((log: any) => ({
        id: String(log.id),
        tipoEvento: log.tipoEvento,
        descricao: log.descricao,
        dataRegisto: log.dataRegisto.toISOString()
      }))
    })),
    logsRecentes: logsRecentes.map((log: any) => ({
      id: String(log.id),
      tipoEvento: log.tipoEvento,
      descricao: log.descricao,
      dataRegisto: log.dataRegisto.toISOString(),
      estudanteNome: log.tentativa.estudante.nome,
      estudanteEmail: log.tentativa.estudante.email,
      provaTitulo: log.tentativa.avaliacao.titulo,
      idTentativa: Number(log.idTentativa),
      statusTentativa: log.tentativa.statusTentativa
    }))
  };
}

export async function obterLogsSegurancaProctoring() {
  const painel = await obterPainelProctoringGlobal();
  return painel.logsRecentes;
}

// 10. Bloquear/desbloquear tentativa de prova (Proctoring control)
export async function gerirEstadoTentativaProva(idTentativa: number, status: string) {
  const adminUser = await verificarAdmin();

  try {
    await prisma.tentativaAvaliacao.update({
      where: { id: idTentativa },
      data: { statusTentativa: status }
    });

    await registrarAuditoria(
      Number(adminUser.id),
      "Bloqueio Prova",
      "tentativa_avaliacao",
      idTentativa,
      `Alterado estado da prova ID ${idTentativa} para '${status}'`
    );

    revalidatePath("/admin");
    revalidatePath("/admin/proctoring");
    return { success: true };
  } catch (error) {
    return { error: "Erro ao alterar estado da tentativa de prova." };
  }
}

// 11. Cadastrar Unidade Orgânica
export async function cadastrarUO(data: { nomeUo: string; sigla: string; localizacao?: string }) {
  const adminUser = await verificarAdmin();

  try {
    const validacaoTexto = validarVariosTextosSeguros([
      { nome: "nomeUo", valor: data.nomeUo, obrigatorio: true, maxLength: 120 },
      { nome: "sigla", valor: data.sigla, obrigatorio: true, maxLength: 20 },
      { nome: "localizacao", valor: data.localizacao, maxLength: 150 }
    ]);

    if (!validacaoTexto.ok) {
      return { error: validacaoTexto.erro };
    }


    const uo = await prisma.unidadeOrganica.create({
      data: {
        nomeUo: data.nomeUo,
        sigla: data.sigla,
        localizacao: data.localizacao || null
      }
    });

    await registrarAuditoria(
      Number(adminUser.id),
      "Cadastro Faculdade",
      "unidadeorganica",
      uo.id,
      `Cadastrada faculdade ${uo.nomeUo} (${uo.sigla})`
    );

    revalidatePath("/admin");
    return { success: true, data: uo };
  } catch (error) {
    return { error: "Erro ao cadastrar Unidade Orgânica." };
  }
}

// 12. Cadastrar Curso
export async function cadastrarCurso(data: { idUo: number; nomeCurso: string }) {
  const adminUser = await verificarAdmin();

  try {
    const validacaoTexto = validarVariosTextosSeguros([
      { nome: "nomeCurso", valor: data.nomeCurso, obrigatorio: true, maxLength: 120 }
    ]);

    if (!validacaoTexto.ok) {
      return { error: validacaoTexto.erro };
    }

    const curso = await prisma.curso.create({
      data: {
        idUo: data.idUo,
        nomeCurso: data.nomeCurso
      }
    });

    await registrarAuditoria(
      Number(adminUser.id),
      "Cadastro Curso",
      "ccurso",
      curso.id,
      `Cadastrado curso ${curso.nomeCurso}`
    );

    revalidatePath("/admin");
    return { success: true, data: curso };
  } catch (error) {
    return { error: "Erro ao cadastrar Curso." };
  }
}

// 13. Atribuir Coordenador ao Curso
export async function atribuirCoordenadorCurso(idCurso: number, idCoordenador: number | null) {
  const adminUser = await verificarAdmin();

  try {
    await prisma.curso.update({
      where: { id: idCurso },
      data: { idCoordenador }
    });

    await registrarAuditoria(
      Number(adminUser.id),
      "Atribuição Coordenador",
      "ccurso",
      idCurso,
      idCoordenador 
        ? `Atribuído coordenador ID ${idCoordenador} ao curso ID ${idCurso}` 
        : `Removido coordenador do curso ID ${idCurso}`
    );

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Erro ao atribuir coordenador ao curso." };
  }
}

// 14. Obter estrutura académica (UO, Cursos)
export async function obterEstruturaAcademica() {
  await verificarAdmin();

  return prisma.unidadeOrganica.findMany({
    include: {
      cursos: {
        include: {
          coordenador: { select: { id: true, nome: true } },
          _count: {
            select: {
              disciplinas: true,
              turmas: true,
              usuarios: true
            }
          }
        }
      }
    },
    orderBy: { nomeUo: "asc" }
  });
}

// 15. Obter utilizadores qualificados para coordenador (admin, coordenador)
export async function obterCoordenadoresDisponiveis() {
  await verificarAdmin();

  return prisma.usuario.findMany({
    where: {
      perfis: {
        some: {
          perfil: {
            nomePerfil: { in: ["coordenador", "admin"] }
          }
        }
      }
    },
    select: { id: true, nome: true, email: true },
    orderBy: { nome: "asc" }
  });
}

// 16. Cadastrar Disciplina
export async function cadastrarDisciplina(data: { idCurso: number; nomeDisciplina: string; semestre: number }) {
  const adminUser = await verificarAdmin();

  try {
    const validacaoTexto = validarVariosTextosSeguros([
      { nome: "nomeDisciplina", valor: data.nomeDisciplina, obrigatorio: true, maxLength: 120 }
    ]);

    if (!validacaoTexto.ok) {
      return { error: validacaoTexto.erro };
    }

    const disciplina = await prisma.disciplina.create({
      data: {
        idCurso: data.idCurso,
        nomeDisciplina: data.nomeDisciplina,
        semestre: data.semestre
      }
    });

    await registrarAuditoria(
      Number(adminUser.id),
      "Cadastro Disciplina",
      "disciplina",
      disciplina.id,
      `Cadastrada disciplina ${disciplina.nomeDisciplina} (Semestre ${disciplina.semestre})`
    );

    revalidatePath("/admin");
    return { success: true, data: disciplina };
  } catch (error) {
    return { error: "Erro ao cadastrar disciplina." };
  }
}

// 17. Cadastrar Turma
export async function cadastrarTurma(data: { idCurso: number; nomeTurma: string; anoCurricular: number; periodo: string }) {
  const adminUser = await verificarAdmin();

  try {
    const validacaoTexto = validarVariosTextosSeguros([
      { nome: "nomeTurma", valor: data.nomeTurma, obrigatorio: true, maxLength: 60 },
      { nome: "periodo", valor: data.periodo, obrigatorio: true, maxLength: 40 }
    ]);

    if (!validacaoTexto.ok) {
      return { error: validacaoTexto.erro };
    }

    const turma = await prisma.turma.create({
      data: {
        idCurso: data.idCurso,
        nomeTurma: data.nomeTurma,
        anoCurricular: data.anoCurricular,
        periodo: data.periodo
      }
    });

    await registrarAuditoria(
      Number(adminUser.id),
      "Cadastro Turma",
      "turma",
      turma.id,
      `Cadastrada turma ${turma.nomeTurma}`
    );

    revalidatePath("/admin");
    return { success: true, data: turma };
  } catch (error) {
    return { error: "Erro ao cadastrar turma." };
  }
}

// 18. Obter disciplinas e turmas
export async function obterDisciplinasETurmas() {
  await verificarAdmin();

  const disciplinas = await prisma.disciplina.findMany({
    include: { curso: { select: { nomeCurso: true } } },
    orderBy: { nomeDisciplina: "asc" }
  });

  const turmas = await prisma.turma.findMany({
    include: { curso: { select: { nomeCurso: true } } },
    orderBy: { nomeTurma: "asc" }
  });

  return { disciplinas, turmas };
}

// 19. Cadastrar Competência e Habilidades
export async function cadastrarCompetenciaHabilidade(data: { nomeCompetencia: string; habilidades: string[] }) {
  const adminUser = await verificarAdmin();

  try {
    const validacaoTexto = validarVariosTextosSeguros([
      { nome: "nomeCompetencia", valor: data.nomeCompetencia, obrigatorio: true, maxLength: 120 }
    ]);

    if (!validacaoTexto.ok) {
      return { error: validacaoTexto.erro };
    }

    for (const habilidade of data.habilidades) {
      const validacaoHabilidade = validarVariosTextosSeguros([
        { nome: "habilidade", valor: habilidade, obrigatorio: true, maxLength: 120 }
      ]);

      if (!validacaoHabilidade.ok) {
        return { error: validacaoHabilidade.erro };
      }
    }

    const comp = await prisma.competencia.create({
      data: {
        nomeCompetencia: data.nomeCompetencia,
        habilidades: {
          create: data.habilidades.map(nome => ({
            nomeHabilidade: nome
          }))
        }
      }
    });

    await registrarAuditoria(
      Number(adminUser.id),
      "Cadastro Competência",
      "competencia",
      comp.id,
      `Cadastrada competência ${comp.nomeCompetencia} com ${data.habilidades.length} habilidades`
    );

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Erro ao cadastrar competência e habilidades." };
  }
}

// 20. Obter Competências cadastradas
export async function obterCompetencias() {
  await verificarAdmin();

  return prisma.competencia.findMany({
    include: { habilidades: true },
    orderBy: { nomeCompetencia: "asc" }
  });
}

// 21. Obter Projetos da Vitrine
export async function obterProjetosVitrineAdmin() {
  await verificarAdmin();

  return prisma.projetoVitrine.findMany({
    orderBy: { dataPublicacao: "desc" },
    include: {
      autores: {
        include: { usuario: { select: { nome: true, email: true } } }
      },
      disciplina: { select: { nomeDisciplina: true } },
      professor: { select: { nome: true } }
    }
  });
}

// 22. Gerir autorização de projetos estudantis
export async function gerirAutorizacaoProjeto(idProjeto: number, autorizar: boolean) {
  const adminUser = await verificarAdmin();

  try {
    await prisma.projetoVitrine.update({
      where: { id: idProjeto },
      data: {
        idProfessorAutorizador: autorizar ? Number(adminUser.id) : null
      }
    });

    await registrarAuditoria(
      Number(adminUser.id),
      "Moderação Projeto",
      "projeto_vitrine",
      idProjeto,
      `${autorizar ? "Aprovado" : "Removido"} projeto ID ${idProjeto} na vitrine pública`
    );

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Erro ao processar autorização de projeto." };
  }
}




