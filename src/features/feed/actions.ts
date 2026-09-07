"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validarTextoSeguro } from "@/lib/validacao-texto";
import { NotificationsRepository } from "@/features/notifications/repositories/notifications.repository";

async function obterUsuarioAutenticado() {
  const sessao = await auth();
  const idUsuario = Number(sessao?.user?.id);

  if (!sessao?.user || !Number.isInteger(idUsuario) || idUsuario <= 0) return null;

  return { idUsuario, papeis: ((sessao.user as { roles?: string[] }).roles || []) };
}

function validarIdentificador(valor: unknown, nomeCampo: string) {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero <= 0) return { ok: false as const, erro: `${nomeCampo} é inválido.` };
  return { ok: true as const, valor: numero };
}

async function notificarInteracaoNoFeed(idDestinatario: number, idAutorInteracao: number, titulo: string, mensagem: string) {
  if (idDestinatario === idAutorInteracao) return;

  try {
    await NotificationsRepository.criar({
      idUsuario: idDestinatario,
      titulo,
      mensagem,
      tipo: "comunidade",
      prioridade: "normal",
    });
  } catch {
    // A interação principal não deve falhar caso a entrega da notificação esteja indisponível.
  }
}

function revalidarFeedENotificacoes() {
  revalidatePath("/");
  revalidatePath("/notificacoes");
}

export async function criarPublicacaoServer(conteudo: unknown) {
  const usuario = await obterUsuarioAutenticado();
  if (!usuario) return { erro: "Inicie sessão para publicar na comunidade." };

  const validacao = validarTextoSeguro(conteudo, "A publicação", { obrigatorio: true, maxLength: 1200 });
  if (!validacao.ok) return { erro: validacao.erro };

  await prisma.publicacao.create({ data: { idAutor: usuario.idUsuario, conteudo: validacao.valor } });
  revalidatePath("/");
  return { sucesso: true };
}

export async function alternarGostoPublicacaoServer(idPublicacao: unknown) {
  const usuario = await obterUsuarioAutenticado();
  if (!usuario) return { erro: "Inicie sessão para indicar que gostou desta publicação." };

  const identificador = validarIdentificador(idPublicacao, "A publicação");
  if (!identificador.ok) return { erro: identificador.erro };

  const publicacao = await prisma.publicacao.findFirst({
    where: { id: identificador.valor, estado: "publicado" },
    select: { id: true, idAutor: true },
  });
  if (!publicacao) return { erro: "A publicação já não está disponível." };

  const gostoExistente = await prisma.gostoPublicacao.findUnique({
    where: { idPublicacao_idUsuario: { idPublicacao: publicacao.id, idUsuario: usuario.idUsuario } },
  });

  if (gostoExistente) {
    await prisma.gostoPublicacao.delete({
      where: { idPublicacao_idUsuario: { idPublicacao: publicacao.id, idUsuario: usuario.idUsuario } },
    });
  } else {
    await prisma.gostoPublicacao.create({ data: { idPublicacao: publicacao.id, idUsuario: usuario.idUsuario } });
    await notificarInteracaoNoFeed(publicacao.idAutor, usuario.idUsuario, "Novo gosto na publicação", "Alguém indicou que gostou da sua publicação na comunidade.");
  }

  revalidarFeedENotificacoes();
  return { sucesso: true, gostou: !gostoExistente };
}

export async function criarComentarioPublicacaoServer(idPublicacao: unknown, conteudo: unknown) {
  const usuario = await obterUsuarioAutenticado();
  if (!usuario) return { erro: "Inicie sessão para comentar." };

  const identificador = validarIdentificador(idPublicacao, "A publicação");
  if (!identificador.ok) return { erro: identificador.erro };

  const validacao = validarTextoSeguro(conteudo, "O comentário", { obrigatorio: true, maxLength: 500 });
  if (!validacao.ok) return { erro: validacao.erro };

  const publicacao = await prisma.publicacao.findFirst({
    where: { id: identificador.valor, estado: "publicado" },
    select: { id: true, idAutor: true },
  });
  if (!publicacao) return { erro: "A publicação já não está disponível." };

  await prisma.comentarioPublicacao.create({
    data: { idPublicacao: publicacao.id, idAutor: usuario.idUsuario, conteudo: validacao.valor },
  });
  await notificarInteracaoNoFeed(publicacao.idAutor, usuario.idUsuario, "Novo comentário na publicação", "Recebeu um novo comentário na sua publicação na comunidade.");

  revalidarFeedENotificacoes();
  return { sucesso: true };
}

export async function ocultarPublicacaoServer(idPublicacao: unknown) {
  return alterarEstadoPublicacaoServer(idPublicacao, "oculto");
}

export async function alterarEstadoPublicacaoServer(idPublicacao: unknown, estado: unknown) {
  const usuario = await obterUsuarioAutenticado();
  if (!usuario || !usuario.papeis.includes("admin")) return { erro: "Não tem permissão para moderar publicações." };

  const identificador = validarIdentificador(idPublicacao, "A publicação");
  if (!identificador.ok) return { erro: identificador.erro };
  if (estado !== "publicado" && estado !== "oculto") return { erro: "O estado da publicação é inválido." };

  const atualizada = await prisma.publicacao.updateMany({ where: { id: identificador.valor }, data: { estado } });
  if (atualizada.count === 0) return { erro: "A publicação não foi encontrada." };

  revalidatePath("/");
  revalidatePath("/admin/feed");
  return { sucesso: true };
}

export async function criarProjetoVitrineServer(payload: {
  tituloProjeto: unknown;
  descricao: unknown;
  urlRepositorio?: unknown;
  urlDemonstracao?: unknown;
}) {
  const usuario = await obterUsuarioAutenticado();
  if (!usuario) return { erro: "Inicie sessão para publicar na Vitrine de Projetos." };

  const validTitulo = validarTextoSeguro(payload.tituloProjeto, "O título do projeto", { obrigatorio: true, maxLength: 150 });
  if (!validTitulo.ok) return { erro: validTitulo.erro };

  const validDesc = validarTextoSeguro(payload.descricao, "A descrição", { obrigatorio: true, maxLength: 2000 });
  if (!validDesc.ok) return { erro: validDesc.erro };

  const validRepo = payload.urlRepositorio ? validarTextoSeguro(payload.urlRepositorio, "O repositório", { maxLength: 255 }) : null;
  if (validRepo && !validRepo.ok) return { erro: validRepo.erro };

  const validDemo = payload.urlDemonstracao ? validarTextoSeguro(payload.urlDemonstracao, "A demonstração", { maxLength: 255 }) : null;
  if (validDemo && !validDemo.ok) return { erro: validDemo.erro };

  const projeto = await prisma.projetoVitrine.create({
    data: {
      tituloProjeto: validTitulo.valor,
      descricao: validDesc.valor,
      urlRepositorio: validRepo?.ok ? validRepo.valor : null,
      urlDemonstracao: validDemo?.ok ? validDemo.valor : null,
      autores: {
        create: [
          { idUsuario: usuario.idUsuario }
        ]
      }
    }
  });

  revalidatePath("/");
  revalidatePath("/estudante");
  return { sucesso: true, data: projeto };
}

export async function alternarGostoProjetoServer(idProjeto: unknown) {
  const usuario = await obterUsuarioAutenticado();
  if (!usuario) return { erro: "Inicie sessão para curtir este projeto." };

  const identificador = validarIdentificador(idProjeto, "O projeto");
  if (!identificador.ok) return { erro: identificador.erro };

  const projeto = await prisma.projetoVitrine.findUnique({
    where: { id: identificador.valor },
    include: { autores: true }
  });
  if (!projeto) return { erro: "O projeto não foi encontrado." };

  const curtoExistente = await prisma.projetoCurtidor.findUnique({
    where: { idProjeto_idUsuario: { idProjeto: projeto.id, idUsuario: usuario.idUsuario } }
  });

  if (curtoExistente) {
    await prisma.projetoCurtidor.delete({
      where: { idProjeto_idUsuario: { idProjeto: projeto.id, idUsuario: usuario.idUsuario } }
    });
  } else {
    await prisma.projetoCurtidor.create({
      data: { idProjeto: projeto.id, idUsuario: usuario.idUsuario }
    });

    const autorPrincipal = projeto.autores[0]?.idUsuario;
    if (autorPrincipal) {
      await notificarInteracaoNoFeed(autorPrincipal, usuario.idUsuario, "Gosto no Projeto Vitrine", "Alguém curtiu o seu projeto na Vitrine Académica.");
    }
  }

  revalidatePath("/");
  return { sucesso: true, curtido: !curtoExistente };
}