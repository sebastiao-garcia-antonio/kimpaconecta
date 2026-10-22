"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validarVariosTextosSeguros } from "@/lib/validacao-texto";

type UtilizadorAutorizado = {
  idUsuario: number;
  administrador: boolean;
};

async function obterUtilizadorAutorizado(): Promise<UtilizadorAutorizado | null> {
  const sessao = await auth();
  const idUsuario = Number(sessao?.user?.id);
  const papeis = (sessao?.user as { roles?: string[] } | undefined)?.roles || [];

  if (
    !Number.isInteger(idUsuario) ||
    idUsuario <= 0 ||
    (!papeis.includes("admin") && !papeis.includes("coordenador"))
  ) {
    return null;
  }

  return { idUsuario, administrador: papeis.includes("admin") };
}

function identificar(valor: unknown) {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function revalidarPaginaProfessores() {
  ["/coordenador", "/coordenador/professores", "/coordenador/disciplinas", "/admin"].forEach(
    (caminho) => revalidatePath(caminho)
  );
}

async function obterCursosPermitidosIds(utilizador: UtilizadorAutorizado): Promise<number[] | null> {
  if (utilizador.administrador) return null;

  const cursos = await prisma.curso.findMany({
    where: {
      OR: [
        { idCoordenador: utilizador.idUsuario },
        { usuarios: { some: { idUsuario: utilizador.idUsuario } } },
      ],
    },
    select: { id: true },
  });

  return cursos.map((c) => c.id);
}

export type DadosCriarProfessor = {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  numBi?: string;
  idsCursos?: number[];
  idsDisciplinas?: number[];
};

export async function criarProfessorServer(dados: DadosCriarProfessor) {
  const utilizador = await obterUtilizadorAutorizado();
  if (!utilizador) return { error: "Não tem permissão para adicionar professores." };

  const validacoes = validarVariosTextosSeguros([
    { valor: dados.nome, nome: "O nome completo", obrigatorio: true, maxLength: 150 },
    { valor: dados.email, nome: "O e-mail institucional", obrigatorio: true, maxLength: 100 },
    { valor: dados.senha, nome: "A senha de acesso", obrigatorio: true, maxLength: 100 },
  ]);

  if (!validacoes.ok) return { error: validacoes.erro };
  if (dados.senha.trim().length < 6) {
    return { error: "A senha de acesso deve ter no mínimo 6 caracteres." };
  }

  const emailFormatado = dados.email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailFormatado)) {
    return { error: "O e-mail institucional informado é inválido." };
  }

  const emailExistente = await prisma.usuario.findUnique({
    where: { email: emailFormatado },
    select: { id: true },
  });
  if (emailExistente) {
    return { error: "Já existe um utilizador registado com este e-mail." };
  }

  // Obter perfil professor
  let perfilProfessor = await prisma.perfil.findUnique({
    where: { nomePerfil: "professor" },
    select: { id: true },
  });
  if (!perfilProfessor) {
    perfilProfessor = await prisma.perfil.create({
      data: { nomePerfil: "professor" },
      select: { id: true },
    });
  }

  const cursosPermitidos = await obterCursosPermitidosIds(utilizador);
  let idsCursosFinais: number[] = [];
  if (Array.isArray(dados.idsCursos) && dados.idsCursos.length > 0) {
    idsCursosFinais = dados.idsCursos.filter((id) =>
      cursosPermitidos === null ? true : cursosPermitidos.includes(id)
    );
  } else if (cursosPermitidos && cursosPermitidos.length > 0) {
    idsCursosFinais = [cursosPermitidos[0]];
  }

  try {
    const senhaHash = await bcrypt.hash(dados.senha.trim(), 10);

    const novoProfessor = await prisma.usuario.create({
      data: {
        nome: dados.nome.trim(),
        email: emailFormatado,
        senha: senhaHash,
        telefone: dados.telefone?.trim() || null,
        numBi: dados.numBi?.trim() || null,
        status: "ativo",
        perfis: {
          create: { idPerfil: perfilProfessor.id },
        },
        cursos: {
          create: idsCursosFinais.map((idCurso) => ({
            idCurso,
            dataVinculo: new Date(),
          })),
        },
      },
      select: { id: true },
    });

    // Associar disciplinas lecionadas se informadas
    if (Array.isArray(dados.idsDisciplinas) && dados.idsDisciplinas.length > 0) {
      await (prisma.disciplina as any).updateMany({
        where: {
          id: { in: dados.idsDisciplinas },
          ...(cursosPermitidos ? { idCurso: { in: cursosPermitidos } } : {}),
        },
        data: { idDocente: novoProfessor.id },
      });
    }

    revalidarPaginaProfessores();
    return { success: true, id: novoProfessor.id };
  } catch (err: any) {
    console.error("Erro ao criar professor:", err);
    return { error: "Não foi possível cadastrar o professor. Tente novamente." };
  }
}

export type DadosEditarProfessor = {
  id: number;
  nome: string;
  email: string;
  senha?: string;
  telefone?: string;
  numBi?: string;
  idsCursos?: number[];
  idsDisciplinas?: number[];
};

export async function editarProfessorServer(dados: DadosEditarProfessor) {
  const utilizador = await obterUtilizadorAutorizado();
  if (!utilizador) return { error: "Não tem permissão para editar professores." };

  const idProfessor = identificar(dados.id);
  if (!idProfessor) return { error: "Identificador de professor inválido." };

  const validacoes = validarVariosTextosSeguros([
    { valor: dados.nome, nome: "O nome completo", obrigatorio: true, maxLength: 150 },
    { valor: dados.email, nome: "O e-mail", obrigatorio: true, maxLength: 100 },
  ]);
  if (!validacoes.ok) return { error: validacoes.erro };

  const emailFormatado = dados.email.trim().toLowerCase();
  const repetido = await prisma.usuario.findFirst({
    where: { email: emailFormatado, id: { not: idProfessor } },
    select: { id: true },
  });
  if (repetido) return { error: "Este e-mail já está a ser utilizado por outro utilizador." };

  const cursosPermitidos = await obterCursosPermitidosIds(utilizador);

  try {
    const dadosAtualizacao: any = {
      nome: dados.nome.trim(),
      email: emailFormatado,
      telefone: dados.telefone?.trim() || null,
      numBi: dados.numBi?.trim() || null,
    };

    if (dados.senha && dados.senha.trim().length >= 6) {
      dadosAtualizacao.senha = await bcrypt.hash(dados.senha.trim(), 10);
    }

    await prisma.usuario.update({
      where: { id: idProfessor },
      data: dadosAtualizacao,
    });

    // Atualizar cursos vinculados se fornecidos
    if (Array.isArray(dados.idsCursos)) {
      const idsPermitidos = dados.idsCursos.filter((id) =>
        cursosPermitidos === null ? true : cursosPermitidos.includes(id)
      );

      // Remover vínculos anteriores dos cursos permitidos
      await prisma.usuarioCurso.deleteMany({
        where: {
          idUsuario: idProfessor,
          ...(cursosPermitidos ? { idCurso: { in: cursosPermitidos } } : {}),
        },
      });

      // Recriar os vínculos selecionados
      if (idsPermitidos.length > 0) {
        await prisma.usuarioCurso.createMany({
          data: idsPermitidos.map((idCurso) => ({
            idUsuario: idProfessor,
            idCurso,
            dataVinculo: new Date(),
          })),
          skipDuplicates: true,
        });
      }
    }

    // Atualizar disciplinas associadas
    if (Array.isArray(dados.idsDisciplinas)) {
      // Desassociar disciplinas dos cursos coordenados que não estão na nova lista
      await (prisma.disciplina as any).updateMany({
        where: {
          idDocente: idProfessor,
          ...(cursosPermitidos ? { idCurso: { in: cursosPermitidos } } : {}),
          id: { notIn: dados.idsDisciplinas },
        },
        data: { idDocente: null },
      });

      // Associar as disciplinas marcadas
      if (dados.idsDisciplinas.length > 0) {
        await (prisma.disciplina as any).updateMany({
          where: {
            id: { in: dados.idsDisciplinas },
            ...(cursosPermitidos ? { idCurso: { in: cursosPermitidos } } : {}),
          },
          data: { idDocente: idProfessor },
        });
      }
    }

    revalidarPaginaProfessores();
    return { success: true };
  } catch (err: any) {
    console.error("Erro ao editar professor:", err);
    return { error: "Não foi possível atualizar os dados do professor." };
  }
}

export async function alternarStatusProfessorServer(idProfessorRaw: unknown) {
  const utilizador = await obterUtilizadorAutorizado();
  if (!utilizador) return { error: "Não tem permissão para alterar o estado do professor." };

  const id = identificar(idProfessorRaw);
  if (!id) return { error: "Identificador inválido." };

  const professor = await prisma.usuario.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!professor) return { error: "Professor não encontrado." };

  const novoStatus = professor.status === "ativo" ? "inativo" : "ativo";

  try {
    await prisma.usuario.update({
      where: { id },
      data: { status: novoStatus },
    });
    revalidarPaginaProfessores();
    return { success: true, status: novoStatus };
  } catch {
    return { error: "Não foi possível alterar o estado de acesso do professor." };
  }
}

export async function associarDisciplinasProfessorServer(
  idProfessorRaw: unknown,
  idsDisciplinas: number[]
) {
  const utilizador = await obterUtilizadorAutorizado();
  if (!utilizador) return { error: "Não tem permissão para associar disciplinas." };

  const idProfessor = identificar(idProfessorRaw);
  if (!idProfessor) return { error: "Identificador de professor inválido." };

  const cursosPermitidos = await obterCursosPermitidosIds(utilizador);

  try {
    // Desassociar disciplinas dos cursos que não estão na lista
    await (prisma.disciplina as any).updateMany({
      where: {
        idDocente: idProfessor,
        ...(cursosPermitidos ? { idCurso: { in: cursosPermitidos } } : {}),
        id: { notIn: idsDisciplinas },
      },
      data: { idDocente: null },
    });

    // Associar as selecionadas
    if (idsDisciplinas.length > 0) {
      await (prisma.disciplina as any).updateMany({
        where: {
          id: { in: idsDisciplinas },
          ...(cursosPermitidos ? { idCurso: { in: cursosPermitidos } } : {}),
        },
        data: { idDocente: idProfessor },
      });
    }

    revalidarPaginaProfessores();
    return { success: true };
  } catch {
    return { error: "Não foi possível atualizar as disciplinas do professor." };
  }
}

export async function eliminarProfessorServer(idProfessorRaw: unknown) {
  const utilizador = await obterUtilizadorAutorizado();
  if (!utilizador) return { error: "Não tem permissão para eliminar professores." };

  const id = identificar(idProfessorRaw);
  if (!id) return { error: "Identificador inválido." };

  if (id === utilizador.idUsuario) {
    return { error: "Não pode eliminar a sua própria conta." };
  }

  const professor = await prisma.usuario.findUnique({
    where: { id },
    include: {
      perfis: { include: { perfil: true } },
    },
  });
  if (!professor) return { error: "Professor não encontrado." };

  const ehAdmin = professor.perfis.some((p) => p.perfil.nomePerfil === "admin");
  if (ehAdmin && !utilizador.administrador) {
    return { error: "Apenas um administrador pode eliminar outro administrador." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Desvincular de disciplinas lecionadas
      await (tx.disciplina as any).updateMany({
        where: { idDocente: id },
        data: { idDocente: null },
      });

      // 2. Desvincular de cursos onde é coordenador
      await tx.curso.updateMany({
        where: { idCoordenador: id },
        data: { idCoordenador: null },
      });

      // 3. Eliminar avaliações e registros vinculados
      const avaliacoes = await tx.avaliacao.findMany({
        where: { idProfessor: id },
        select: { id: true },
      });
      const idsAvaliacoes = avaliacoes.map((a) => a.id);
      if (idsAvaliacoes.length > 0) {
        await tx.respostaEstudante.deleteMany({
          where: { tentativa: { idAvaliacao: { in: idsAvaliacoes } } },
        });
        await tx.logsSeguranca.deleteMany({
          where: { tentativa: { idAvaliacao: { in: idsAvaliacoes } } },
        });
        await tx.monitoramentoProva.deleteMany({
          where: { tentativa: { idAvaliacao: { in: idsAvaliacoes } } },
        });
        await tx.tentativaAvaliacao.deleteMany({
          where: { idAvaliacao: { in: idsAvaliacoes } },
        });
        await tx.alternativa.deleteMany({
          where: { questao: { idAvaliacao: { in: idsAvaliacoes } } },
        });
        await tx.questao.deleteMany({
          where: { idAvaliacao: { in: idsAvaliacoes } },
        });
        await tx.avaliacao.deleteMany({
          where: { id: { in: idsAvaliacoes } },
        });
      }

      // 4. Materiais didáticos
      await tx.materialDidatico.deleteMany({ where: { idProfessor: id } });

      // 5. Diários de aula
      await tx.diarioAula.deleteMany({ where: { idDocente: id } });

      // 6. Sessões de mentoria
      await tx.feedbackMentoria.deleteMany({
        where: {
          sessao: {
            OR: [{ idMentor: id }, { idEstudanteAjudado: id }],
          },
        },
      });
      await tx.sessaoMentoria.deleteMany({
        where: {
          OR: [{ idMentor: id }, { idEstudanteAjudado: id }],
        },
      });

      // 7. Reuniões virtuais
      await tx.reuniaoParticipante.deleteMany({ where: { idUsuario: id } });
      await tx.reuniaoVirtual.deleteMany({ where: { idCriador: id } });

      // 8. Mensagens e fixações
      await tx.mensagemFixadaLog.deleteMany({ where: { idUsuarioQuemFixou: id } });
      await tx.mensagem.deleteMany({ where: { idEmissor: id } });
      await tx.grupoMembro.deleteMany({ where: { idUsuario: id } });
      await tx.grupo.deleteMany({ where: { idCriador: id } });

      // 9. Feed: publicações, comentários, gostos
      await tx.gostoComentarioPublicacao.deleteMany({ where: { idUsuario: id } });
      await tx.gostoPublicacao.deleteMany({ where: { idUsuario: id } });
      await tx.comentarioPublicacao.deleteMany({ where: { idAutor: id } });
      await tx.publicacao.deleteMany({ where: { idAutor: id } });

      // 10. Seguidores
      await tx.seguidorUsuario.deleteMany({
        where: { OR: [{ idSeguidor: id }, { idSeguido: id }] },
      });

      // 11. Presenças e histórico
      await tx.presencaAula.deleteMany({ where: { idUsuario: id } });
      await tx.historicoAcademico.deleteMany({ where: { idEstudante: id } });

      // 12. Atividades, notificações, reputação, sessões
      await tx.atividadeUsuario.deleteMany({ where: { idUsuario: id } });
      await tx.notificacao.deleteMany({ where: { idUsuario: id } });
      await tx.reputacaoAcademica.deleteMany({ where: { idUsuario: id } });
      await tx.loginSessao.deleteMany({ where: { idUsuario: id } });
      await tx.recuperacaoSenha.deleteMany({ where: { idUsuario: id } });
      await tx.auditoriaSistema.deleteMany({ where: { idUsuario: id } });

      // 13. Oportunidades e projetos
      await tx.candidaturaOportunidade.deleteMany({ where: { idUsuario: id } });
      await tx.oportunidadeAcademica.deleteMany({ where: { criadoPor: id } });
      await tx.projetoAutor.deleteMany({ where: { idUsuario: id } });
      await tx.projetoCurtidor.deleteMany({ where: { idUsuario: id } });
      await tx.projetoVitrine.deleteMany({ where: { idProfessorAutorizador: id } });

      // 14. Vínculos de curso e perfil
      await tx.usuarioCurso.deleteMany({ where: { idUsuario: id } });
      await tx.usuarioPerfil.deleteMany({ where: { idUsuario: id } });

      // 15. Finalmente, excluir o usuário
      await tx.usuario.delete({ where: { id } });
    });

    revalidarPaginaProfessores();
    return { success: true };
  } catch (err: any) {
    console.error("Erro ao eliminar professor com cascata:", err);
    return { error: "Não foi possível eliminar o professor. Verifique se existem dependências críticas." };
  }
}
