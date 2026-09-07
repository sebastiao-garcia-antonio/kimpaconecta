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

export async function agendarAulaVirtualServer(data: {
  titulo: string;
  descricao?: string;
  idGrupo?: number;
  plataforma?: string;
  linkReuniao?: string;
  dataInicio: string;
}) {
  const usuario = await obterIdUsuario();
  if (!usuario || (!usuario.papeis.includes("admin") && !usuario.papeis.includes("coordenador") && !usuario.papeis.includes("professor"))) {
    return { error: "Apenas docentes podem agendar aulas virtuais." };
  }

  const validTitulo = validarTextoSeguro(data.titulo, "O título da aula", { obrigatorio: true, maxLength: 150 });
  if (!validTitulo.ok) return { error: validTitulo.erro };

  const dataInic = new Date(data.dataInicio);
  if (isNaN(dataInic.getTime())) return { error: "Data de início da aula inválida." };

  const salaId = `kimpa-room-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const linkOficial = data.linkReuniao || `https://meet.jit.si/${salaId}`;
  const plat = data.plataforma || "WebRTC / Kimpa Room";

  const reuniao = await prisma.reuniaoVirtual.create({
    data: {
      titulo: validTitulo.valor,
      descricao: data.descricao || null,
      idCriador: usuario.idUsuario,
      idGrupo: data.idGrupo ? Number(data.idGrupo) : null,
      linkReuniao: linkOficial,
      plataforma: plat,
      dataInicio: dataInic,
      status: "agendada",
    },
  });

  // Notificar membros do grupo se aplicável
  if (data.idGrupo) {
    const membros = await prisma.grupoMembro.findMany({
      where: { idGrupo: Number(data.idGrupo) },
      select: { idUsuario: true },
    });

    for (const m of membros) {
      if (m.idUsuario !== usuario.idUsuario) {
        try {
          await NotificationsRepository.criar({
            idUsuario: m.idUsuario,
            titulo: "Nova Aula Virtual Agendada",
            mensagem: `A aula "${validTitulo.valor}" foi agendada para ${dataInic.toLocaleString("pt-AO")}.`,
            tipo: "aula_virtual",
            prioridade: "normal",
          });
        } catch {}
      }
    }
  }

  revalidatePath("/estudante/aulas-virtuais");
  revalidatePath("/professor/classes");
  return { success: true, data: { idReuniao: Number(reuniao.idReuniao), linkReuniao: linkOficial } };
}

export async function iniciarAulaVirtualServer(idReuniao: number) {
  const usuario = await obterIdUsuario();
  if (!usuario) return { error: "Sessão inválida." };

  const reuniao = await prisma.reuniaoVirtual.update({
    where: { idReuniao: BigInt(idReuniao) },
    data: { status: "em_andamento" },
  });

  revalidatePath("/estudante/aulas-virtuais");
  revalidatePath("/professor/classes");
  return { success: true, data: { linkReuniao: reuniao.linkReuniao } };
}
