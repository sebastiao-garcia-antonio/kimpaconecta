"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { NotificationsRepository } from "@/features/notifications/repositories/notifications.repository";

function identificar(valor: unknown): number | null {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

function obterPapeis(sessao: any): string[] {
  return sessao?.user?.roles || sessao?.user?.perfis || [];
}

type ResultadoAccao = { success: true } | { success: false; error: string };

type SessaoEstudante = { id: number; papeis: string[] } | { success: false; error: string };

async function obterEstudanteSessao(): Promise<SessaoEstudante> {
  const sessao = await auth();
  if (!sessao?.user) return { success: false, error: "Sessão expirada. Inicie sessão novamente." };

  const id = identificar(sessao.user.id);
  const papeis = obterPapeis(sessao);
  if (!id || !papeis.includes("estudante")) {
    return { success: false, error: "Apenas estudantes podem escolher um mentor." };
  }

  return { id, papeis };
}

export async function escolherMentorServer(idMentor: unknown): Promise<ResultadoAccao> {
  const sessaoEstudante = await obterEstudanteSessao();
  if (!("id" in sessaoEstudante)) return sessaoEstudante;

  const idMentorNum = identificar(idMentor);
  if (!idMentorNum) return { success: false, error: "Mentor inválido." };
  if (idMentorNum === sessaoEstudante.id) {
    return { success: false, error: "Não pode escolher-se como seu próprio mentor." };
  }

  try {
    const matriculasEstudante = await prisma.matricula.findMany({
      where: { idUsuario: sessaoEstudante.id },
      select: { idTurma: true, turma: { select: { idCurso: true } } },
    });

    const idsCursos = Array.from(new Set(matriculasEstudante.map((matricula) => matricula.turma.idCurso)));
    if (idsCursos.length === 0) {
      return { success: false, error: "Não está matriculado em nenhum curso da faculdade." };
    }

    const mentor = await prisma.usuario.findFirst({
      where: {
        id: idMentorNum,
        NOT: { id: sessaoEstudante.id },
        status: "ativo",
        perfis: { some: { perfil: { nomePerfil: "estudante" } } },
        matriculas: {
          some: { isMentor: true, turma: { idCurso: { in: idsCursos } } },
        },
      },
      select: {
        id: true,
        nome: true,
        email: true,
        matriculas: {
          where: { isMentor: true, turma: { idCurso: { in: idsCursos } } },
          select: { turma: { select: { nomeTurma: true, curso: { select: { nomeCurso: true } } } } },
        },
      },
    });

    if (!mentor) {
      return { success: false, error: "Este mentor não está disponível na sua faculdade ou já não é mentor." };
    }

    const jaEscolhido = await prisma.grupo.findFirst({
      where: {
        tipoGrupo: "mentoria",
        idCriador: sessaoEstudante.id,
        membros: { some: { idUsuario: idMentorNum, funcaoNoGrupo: "mentor" } },
      },
      select: { id: true },
    });

    if (jaEscolhido) {
      return { success: false, error: "Já escolheu este mentor." };
    }

    const gruposMentoria = await prisma.grupo.findMany({
      where: { tipoGrupo: "mentoria", idCriador: sessaoEstudante.id },
      select: { id: true },
    });

    const dadosEstudante = await prisma.usuario.findUnique({
      where: { id: sessaoEstudante.id },
      select: { nome: true },
    });

    await prisma.$transaction(async (tx) => {
      if (gruposMentoria.length > 0) {
        await tx.grupo.deleteMany({ where: { id: { in: gruposMentoria.map((grupo) => grupo.id) } } });
      }

      await tx.grupo.create({
        data: {
          nomeGrupo: `Mentoria: ${dadosEstudante?.nome || "Estudante"} e ${mentor.nome}`,
          tipoGrupo: "mentoria",
          idCriador: sessaoEstudante.id,
          membros: {
            create: [
              { idUsuario: sessaoEstudante.id, funcaoNoGrupo: "admin" },
              { idUsuario: mentor.id, funcaoNoGrupo: "mentor" },
            ],
          },
        },
      });
    });

    await NotificationsRepository.criar({
      idUsuario: mentor.id,
      titulo: "Solicitação de mentoria",
      mensagem: `${dadosEstudante?.nome || "Um estudante"} escolheu-o como mentor. Verifique os grupos de mentoria para acompanhar o novo estudante.`,
      tipo: "sistema",
      prioridade: "alta",
    });

    revalidatePath("/estudante/mentores");
    revalidatePath("/estudante/grupos");

    return { success: true };
  } catch {
    return { success: false, error: "Não foi possível escolher o mentor. Tente novamente." };
  }
}

export async function cancelarMentoriaServer(): Promise<ResultadoAccao> {
  const sessaoEstudante = await obterEstudanteSessao();
  if (!("id" in sessaoEstudante)) return sessaoEstudante;

  try {
    const gruposMentoria = await prisma.grupo.findMany({
      where: { tipoGrupo: "mentoria", idCriador: sessaoEstudante.id },
      select: {
        id: true,
        nomeGrupo: true,
        membros: { where: { funcaoNoGrupo: "mentor" }, select: { idUsuario: true } },
      },
    });

    if (gruposMentoria.length === 0) {
      return { success: false, error: "Ainda não escolheu nenhum mentor." };
    }

    const idsGrupos = gruposMentoria.map((grupo) => grupo.id);
    const mentores = gruposMentoria.flatMap((grupo) => grupo.membros.map((membro) => membro.idUsuario));

    const dadosEstudante = await prisma.usuario.findUnique({
      where: { id: sessaoEstudante.id },
      select: { nome: true },
    });

    await prisma.$transaction(async (tx) => {
      await tx.grupo.deleteMany({ where: { id: { in: idsGrupos } } });
    });

    for (const idMentor of Array.from(new Set(mentores))) {
      await NotificationsRepository.criar({
        idUsuario: idMentor,
        titulo: "Mentoria encerrada",
        mensagem: `${dadosEstudante?.nome || "Um estudante"} encerrou a mentoria consigo. Pode continuar a acompanhar outros estudantes.`,
        tipo: "sistema",
        prioridade: "normal",
      });
    }

    revalidatePath("/estudante/mentores");
    revalidatePath("/estudante/grupos");

    return { success: true };
  } catch {
    return { success: false, error: "Não foi possível cancelar a mentoria. Tente novamente." };
  }
}