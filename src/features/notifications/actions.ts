"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { NotificationsRepository } from "./repositories/notifications.repository";

async function obterIdUsuarioDaSessao() {
  const sessao = await auth();
  const idUsuario = Number(sessao?.user?.id);
  return Number.isInteger(idUsuario) && idUsuario > 0 ? idUsuario : null;
}

function revalidarNotificacoes() {
  revalidatePath("/notificacoes");
  revalidatePath("/estudante/notificacoes");
  revalidatePath("/estudante");
  revalidatePath("/professor");
  revalidatePath("/coordenador");
  revalidatePath("/admin");
}

export async function listarNotificacoesDoUsuarioServer() {
  const idUsuario = await obterIdUsuarioDaSessao();
  if (!idUsuario) return { error: "Sessão inválida." };

  const notificacoes = await NotificationsRepository.listarNotificacoesDoUsuario(idUsuario);
  return { success: true, data: notificacoes };
}

export async function contarNotificacoesNaoLidasServer() {
  const idUsuario = await obterIdUsuarioDaSessao();
  if (!idUsuario) return { error: "Sessão inválida." };

  const total = await NotificationsRepository.contarNaoLidas(idUsuario);
  return { success: true, data: total };
}

export async function marcarNotificacaoComoLidaServer(idNotificacao: unknown) {
  const idUsuario = await obterIdUsuarioDaSessao();
  const identificador = Number(idNotificacao);

  if (!idUsuario) return { error: "Sessão inválida." };
  if (!Number.isSafeInteger(identificador) || identificador <= 0) {
    return { error: "Identificador de notificação inválido." };
  }

  const marcado = await NotificationsRepository.marcarComoLida(idUsuario, identificador);
  if (!marcado) return { error: "Notificação não encontrada ou já lida." };

  revalidarNotificacoes();
  return { success: true };
}

export async function marcarTodasNotificacoesComoLidasServer() {
  const idUsuario = await obterIdUsuarioDaSessao();
  if (!idUsuario) return { error: "Sessão inválida." };

  const total = await NotificationsRepository.marcarTodasComoLidas(idUsuario);
  revalidarNotificacoes();
  return { success: true, data: total };
}