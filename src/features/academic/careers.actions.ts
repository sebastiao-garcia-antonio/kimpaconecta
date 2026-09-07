"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validarTextoSeguro } from "@/lib/validacao-texto";
import { NotificationsRepository } from "@/features/notifications/repositories/notifications.repository";

async function obterIdUsuario() {
  const sessao = await auth();
  const idUsuario = Number(sessao?.user?.id);
  const papeis = (sessao?.user as { roles?: string[] } | undefined)?.roles || [];
  return Number.isInteger(idUsuario) && idUsuario > 0 ? { idUsuario, papeis } : null;
}

export async function candidatarAEstagioServer(idOportunidade: number) {
  const usuario = await obterIdUsuario();
  if (!usuario) return { error: "Sessão inválida." };

  const idOp = Number(idOportunidade);
  if (!Number.isInteger(idOp) || idOp <= 0) return { error: "Oportunidade inválida." };

  const vaga = await prisma.oportunidadeAcademica.findUnique({
    where: { idOportunidade: BigInt(idOp) },
  });
  if (!vaga) return { error: "A vaga selecionada já não está disponível." };

  // Verificar se o estudante já se candidatou
  const existente = await prisma.candidaturaOportunidade.findFirst({
    where: {
      idOportunidade: BigInt(idOp),
      idUsuario: usuario.idUsuario,
    },
  });

  if (existente) return { error: "Já submeteu a sua candidatura para esta oportunidade." };

  const candidatura = await prisma.candidaturaOportunidade.create({
    data: {
      idOportunidade: BigInt(idOp),
      idUsuario: usuario.idUsuario,
      estado: "pendente",
    },
  });

  if (vaga.criadoPor) {
    try {
      await NotificationsRepository.criar({
        idUsuario: vaga.criadoPor,
        titulo: "Nova Candidatura a Estágio",
        mensagem: `Um estudante submeteu a sua candidatura para a vaga "${vaga.titulo}".`,
        tipo: "oportunidade",
        prioridade: "normal",
      });
    } catch {}
  }

  revalidatePath("/estudante/carreiras");
  revalidatePath("/professor/opportunities");
  return { success: true, data: { idCandidatura: Number(candidatura.idCandidatura) } };
}

export async function atualizarEstadoCandidaturaServer(idCandidatura: number, novoEstado: string) {
  const usuario = await obterIdUsuario();
  if (!usuario || (!usuario.papeis.includes("admin") && !usuario.papeis.includes("coordenador") && !usuario.papeis.includes("professor"))) {
    return { error: "Não tem permissão para gerir candidaturas." };
  }

  const idCand = Number(idCandidatura);
  if (!Number.isInteger(idCand) || idCand <= 0) return { error: "Candidatura inválida." };

  const estadosValidos = ["pendente", "entrevistado", "aprovado", "rejeitado"];
  if (!estadosValidos.includes(novoEstado)) return { error: "Estado de candidatura inválido." };

  const candidatura = await prisma.candidaturaOportunidade.update({
    where: { idCandidatura: BigInt(idCand) },
    data: { estado: novoEstado },
    include: { oportunidade: true },
  });

  try {
    await NotificationsRepository.criar({
      idUsuario: candidatura.idUsuario,
      titulo: "Atualização de Candidatura",
      mensagem: `O estado da sua candidatura à vaga "${candidatura.oportunidade.titulo}" mudou para: ${novoEstado.toUpperCase()}.`,
      tipo: "oportunidade",
      prioridade: "alta",
    });
  } catch {}

  revalidatePath("/estudante/carreiras");
  revalidatePath("/professor/opportunities");
  return { success: true };
}

export async function atualizarHabilidadesEstudanteServer(habilidades: Array<{ idHabilidade: number; nivel: number }>) {
  const usuario = await obterIdUsuario();
  if (!usuario) return { error: "Sessão inválida." };

  // Eliminar anteriores e reinserir novas proficiências
  await prisma.estudanteHabilidade.deleteMany({
    where: { idUsuario: usuario.idUsuario },
  });

  for (const h of habilidades) {
    if (h.nivel >= 1 && h.nivel <= 5) {
      await prisma.estudanteHabilidade.create({
        data: {
          idUsuario: usuario.idUsuario,
          idHabilidade: h.idHabilidade,
          nivelProficiencia: h.nivel,
        },
      });
    }
  }

  revalidatePath("/estudante/portfolio");
  return { success: true };
}
