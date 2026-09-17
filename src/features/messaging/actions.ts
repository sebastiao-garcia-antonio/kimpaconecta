"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { validarTextoSeguro } from "@/lib/validacao-texto";
import { NotificationsRepository } from "@/features/notifications/repositories/notifications.repository";
import { MessagingRepository } from "./repositories/messaging.repository";

async function obterIdDaSessao() {
  const sessao = await auth();
  const idUsuario = Number(sessao?.user?.id);
  return Number.isInteger(idUsuario) && idUsuario > 0 ? idUsuario : null;
}

function validarIdentificador(valor: unknown) {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function abrirConversaDiretaServer(idDestinatario: unknown) {
  const idUsuario = await obterIdDaSessao();
  const destinatario = validarIdentificador(idDestinatario);
  if (!idUsuario) return { error: "Sessão inválida." };
  if (!destinatario || destinatario === idUsuario) return { error: "Selecione outro utilizador para iniciar a conversa." };

  const utilizadorExiste = await MessagingRepository.destinatarioExiste(destinatario);
  if (!utilizadorExiste) return { error: "O utilizador selecionado não está disponível." };

  const conversa = await MessagingRepository.criarOuObterConversaDireta(idUsuario, destinatario);
  revalidatePath("/mensagens");
  return { success: true, data: { idGrupo: conversa.id } };
}

export async function alternarAcompanharUsuarioServer(idSeguido: unknown) {
  const idSeguidor = await obterIdDaSessao();
  const seguido = validarIdentificador(idSeguido);
  if (!idSeguidor) return { error: "Sessão inválida." };
  if (!seguido || seguido === idSeguidor) return { error: "Não pode acompanhar o seu próprio perfil." };

  const resultado = await MessagingRepository.alternarAcompanhar(idSeguidor, seguido);
  if ((resultado as any).erro) return { error: (resultado as any).erro };

  if (resultado.seguindo) {
    try {
      await NotificationsRepository.criar({
        idUsuario: seguido,
        titulo: "Novo seguidor",
        mensagem: "Um membro da comunidade começou a acompanhá-lo no Kimpa Connect.",
        tipo: "comunidade",
        prioridade: "normal",
      });
    } catch {
      // Ignorar caso a notificação falhe
    }
  }

  revalidatePath("/mensagens");
  revalidatePath("/");
  revalidatePath(`/perfil/${seguido}`);
  return { success: true, seguindo: resultado.seguindo };
}

export async function enviarMensagemDiretaServer(idGrupo: unknown, conteudo: unknown) {
  const idUsuario = await obterIdDaSessao();
  const grupo = validarIdentificador(idGrupo);
  if (!idUsuario) return { error: "Sessão inválida." };
  if (!grupo) return { error: "Conversa inválida." };

  const validacao = validarTextoSeguro(conteudo, "A mensagem", { obrigatorio: true, maxLength: 1000 });
  if (!validacao.ok) return { error: validacao.erro };

  const conversa = await MessagingRepository.obterConversaDireta(grupo, idUsuario);
  if (!conversa) return { error: "Não tem acesso a esta conversa." };

  await MessagingRepository.criarMensagemDireta(conversa.id, idUsuario, validacao.valor);
  const destinatario = conversa.membros.find((membro) => membro.idUsuario !== idUsuario)?.idUsuario;

  if (destinatario) {
    try {
      await NotificationsRepository.criar({
        idUsuario: destinatario,
        titulo: "Nova mensagem",
        mensagem: "Recebeu uma nova mensagem privada no Kimpa Connect.",
        tipo: "mensagem",
        prioridade: "normal",
      });
    } catch {
      // A mensagem permanece enviada mesmo que a notificação não possa ser entregue.
    }
  }

  revalidatePath("/mensagens");
  revalidatePath("/notificacoes");
  return { success: true };
}

export async function enviarMensagem(payload: { idGrupo: number; conteudo: string }) {
  return enviarMensagemDiretaServer(payload.idGrupo, payload.conteudo);
}