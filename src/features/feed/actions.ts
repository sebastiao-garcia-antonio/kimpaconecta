"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validarTextoSeguro } from "@/lib/validacao-texto";
import { NotificationsRepository } from "@/features/notifications/repositories/notifications.repository";
import { FeedRepository, serializarPublicacao } from "./repositories/feed.repository";
import type { ComentarioFeed } from "./types";

function construirComentario(comentario: any): ComentarioFeed {
  return {
    id: comentario.id,
    conteudo: comentario.conteudo,
    dataPublicacao:
      comentario.dataPublicacao instanceof Date
        ? comentario.dataPublicacao.toISOString()
        : String(comentario.dataPublicacao),
    autor: {
      id: comentario.autor.id,
      nome: comentario.autor.nome,
      fotoPerfil: comentario.autor.fotoPerfil,
    },
    gostou: false,
    _count: { gostos: 0 },
    respostas: [],
  };
}

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
  for (const caminho of ["/", "/estudante", "/admin", "/professor", "/coordenador", "/notificacoes"]) {
    revalidatePath(caminho);
  }
}

function validarUrlAnexo(urlAnexo?: string) {
  if (!urlAnexo || !urlAnexo.trim()) return null;

  const valor = urlAnexo.trim();

  // Caminho relativo local de uploads (ex: /uploads/publicacoes/...)
  if (valor.startsWith("/uploads/")) return null;

  try {
    const url = new URL(valor);
    return ["http:", "https:"].includes(url.protocol)
      ? null
      : "O anexo deve usar um endereço http ou https válido.";
  } catch {
    return "Introduza um endereço válido para o anexo.";
  }
}

export async function criarPublicacaoServer(conteudo: unknown, urlAnexo?: unknown) {
  const usuario = await obterUsuarioAutenticado();
  if (!usuario) return { erro: "Inicie sessão para publicar na comunidade." };

  const validacao = validarTextoSeguro(conteudo, "A publicação", { obrigatorio: true, maxLength: 1200 });
  if (!validacao.ok) return { erro: validacao.erro };

  const anexo = typeof urlAnexo === "string" ? urlAnexo.trim() : "";
  const validaAnexo = validarUrlAnexo(anexo);
  if (validaAnexo) return { erro: validaAnexo };

  const criada = await prisma.publicacao.create({
    data: {
      idAutor: usuario.idUsuario,
      conteudo: validacao.valor,
      urlImagem: anexo || null,
    },
    include: {
      autor: { select: { id: true, nome: true, fotoPerfil: true } },
      gostos: { where: { idUsuario: usuario.idUsuario }, select: { idUsuario: true } },
      _count: { select: { gostos: true, comentarios: true } },
    },
  });
  revalidarFeedENotificacoes();
  return { sucesso: true, publicacao: serializarPublicacao(criada) };
}

export async function carregarPublicacoesFeedServer(cursorId?: unknown) {
  const usuario = await obterUsuarioAutenticado();
  if (!usuario) return { erro: "Inicie sessão para ver a comunidade." };

  let cursor: number | null = null;
  if (cursorId !== undefined && cursorId !== null && cursorId !== "") {
    const identificador = validarIdentificador(cursorId, "O cursor");
    if (!identificador.ok) return { erro: identificador.erro };
    cursor = identificador.valor;
  }

  const limite = 10;
  const itens = await FeedRepository.listarPublicacoesFeed({
    idUsuario: usuario.idUsuario,
    cursorId: cursor,
    limite,
  });

  const proximoCursor = itens.length === limite ? itens[itens.length - 1].id : null;

  return {
    sucesso: true,
    publicacoes: itens.map(serializarPublicacao),
    proximoCursor,
  };
}

export async function obterInteracoesPublicacaoServer(idPublicacao: unknown) {
  const usuario = await obterUsuarioAutenticado();
  if (!usuario) return { erro: "Inicie sessão para ver as interações." };

  const identificador = validarIdentificador(idPublicacao, "A publicação");
  if (!identificador.ok) return { erro: identificador.erro };

  const interacoes = await FeedRepository.obterInteracoesPublicacao(identificador.valor);
  return { sucesso: true, ...interacoes };
}

export async function editarPublicacaoServer(idPublicacao: unknown, conteudo: unknown, urlImagem?: unknown) {
  const usuario = await obterUsuarioAutenticado();
  if (!usuario) return { erro: "Inicie sessão para editar a publicação." };

  const identificador = validarIdentificador(idPublicacao, "A publicação");
  if (!identificador.ok) return { erro: identificador.erro };

  const validacao = validarTextoSeguro(conteudo, "A publicação", { obrigatorio: true, maxLength: 1200 });
  if (!validacao.ok) return { erro: validacao.erro };

  const anexo = typeof urlImagem === "string" ? urlImagem.trim() : "";
  const validaAnexo = validarUrlAnexo(anexo);
  if (validaAnexo) return { erro: validaAnexo };

  const publicacao = await prisma.publicacao.findUnique({
    where: { id: identificador.valor },
    select: { id: true, idAutor: true },
  });
  if (!publicacao) return { erro: "A publicação já não está disponível." };

  if (publicacao.idAutor !== usuario.idUsuario && !usuario.papeis.includes("admin")) {
    return { erro: "Só o autor pode editar esta publicação." };
  }

  await prisma.publicacao.update({
    where: { id: publicacao.id },
    data: { conteudo: validacao.valor, urlImagem: anexo || null },
  });

  revalidarFeedENotificacoes();
  return { sucesso: true, conteudo: validacao.valor, urlImagem: anexo || null };
}

export async function eliminarPublicacaoServer(idPublicacao: unknown) {
  const usuario = await obterUsuarioAutenticado();
  if (!usuario) return { erro: "Inicie sessão para eliminar a publicação." };

  const identificador = validarIdentificador(idPublicacao, "A publicação");
  if (!identificador.ok) return { erro: identificador.erro };

  const publicacao = await prisma.publicacao.findUnique({
    where: { id: identificador.valor },
    select: { id: true, idAutor: true },
  });
  if (!publicacao) return { erro: "A publicação já não está disponível." };

  if (publicacao.idAutor !== usuario.idUsuario && !usuario.papeis.includes("admin")) {
    return { erro: "Só o autor pode eliminar esta publicação." };
  }

  await prisma.publicacao.delete({ where: { id: publicacao.id } });

  revalidarFeedENotificacoes();
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

export async function criarComentarioPublicacaoServer(idPublicacao: unknown, conteudo: unknown, idComentarioPai?: unknown) {
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

  let idPai: number | null = null;
  let criado: any = null;
  if (idComentarioPai !== undefined && idComentarioPai !== null && idComentarioPai !== "") {
    const paiIdentificador = validarIdentificador(idComentarioPai, "O comentário");
    if (!paiIdentificador.ok) return { erro: paiIdentificador.erro };

    const comentarioPai = await prisma.comentarioPublicacao.findFirst({
      where: {
        id: paiIdentificador.valor,
        idPublicacao: publicacao.id,
        estado: "publicado",
      },
      select: { id: true, idComentarioPai: true, idAutor: true },
    });
    if (!comentarioPai) return { erro: "O comentário ao qual pretendes responder já não está disponível." };

    // Resposta encadeada: liga sempre ao comentário que foi respondido,
    // permitindo conversas longas dentro de um único fio (como o Facebook).
    idPai = comentarioPai.id;

    criado = await prisma.comentarioPublicacao.create({
      data: {
        idPublicacao: publicacao.id,
        idAutor: usuario.idUsuario,
        idComentarioPai: idPai,
        conteudo: validacao.valor,
      },
      include: { autor: { select: { id: true, nome: true, fotoPerfil: true } } },
    });
    await notificarInteracaoNoFeed(
      comentarioPai.idAutor,
      usuario.idUsuario,
      "Nova resposta ao teu comentário",
      "Alguém respondeu ao teu comentário na comunidade."
    );
  } else {
    criado = await prisma.comentarioPublicacao.create({
      data: { idPublicacao: publicacao.id, idAutor: usuario.idUsuario, conteudo: validacao.valor },
      include: { autor: { select: { id: true, nome: true, fotoPerfil: true } } },
    });
  }

  await notificarInteracaoNoFeed(publicacao.idAutor, usuario.idUsuario, "Novo comentário na publicação", "Recebeu um novo comentário na sua publicação na comunidade.");

  revalidarFeedENotificacoes();
  return { sucesso: true, comentario: construirComentario(criado), idComentarioPai: idPai };
}

export async function editarComentarioServer(idComentario: unknown, conteudo: unknown) {
  const usuario = await obterUsuarioAutenticado();
  if (!usuario) return { erro: "Inicie sessão para editar o comentário." };

  const identificador = validarIdentificador(idComentario, "O comentário");
  if (!identificador.ok) return { erro: identificador.erro };

  const validacao = validarTextoSeguro(conteudo, "O comentário", { obrigatorio: true, maxLength: 500 });
  if (!validacao.ok) return { erro: validacao.erro };

  const comentario = await prisma.comentarioPublicacao.findUnique({
    where: { id: identificador.valor },
    select: { id: true, idAutor: true },
  });
  if (!comentario) return { erro: "O comentário já não está disponível." };

  if (comentario.idAutor !== usuario.idUsuario && !usuario.papeis.includes("admin")) {
    return { erro: "Só o autor pode editar este comentário." };
  }

  await prisma.comentarioPublicacao.update({
    where: { id: comentario.id },
    data: { conteudo: validacao.valor },
  });

  revalidarFeedENotificacoes();
  return { sucesso: true, conteudo: validacao.valor };
}

export async function eliminarComentarioServer(idComentario: unknown) {
  const usuario = await obterUsuarioAutenticado();
  if (!usuario) return { erro: "Inicie sessão para eliminar o comentário." };

  const identificador = validarIdentificador(idComentario, "O comentário");
  if (!identificador.ok) return { erro: identificador.erro };

  const comentario = await prisma.comentarioPublicacao.findUnique({
    where: { id: identificador.valor },
    select: { id: true, idAutor: true },
  });
  if (!comentario) return { erro: "O comentário já não está disponível." };

  if (comentario.idAutor !== usuario.idUsuario && !usuario.papeis.includes("admin")) {
    return { erro: "Só o autor pode eliminar este comentário." };
  }

  await prisma.comentarioPublicacao.delete({ where: { id: comentario.id } });

  revalidarFeedENotificacoes();
  return { sucesso: true };
}

export async function alternarGostoComentarioServer(idComentario: unknown) {
  const usuario = await obterUsuarioAutenticado();
  if (!usuario) return { erro: "Inicie sessão para gostar deste comentário." };

  const identificador = validarIdentificador(idComentario, "O comentário");
  if (!identificador.ok) return { erro: identificador.erro };

  const comentario = await prisma.comentarioPublicacao.findFirst({
    where: { id: identificador.valor, estado: "publicado" },
    select: { id: true, idAutor: true },
  });
  if (!comentario) return { erro: "O comentário já não está disponível." };

  const existente = await prisma.gostoComentarioPublicacao.findUnique({
    where: { idComentario_idUsuario: { idComentario: comentario.id, idUsuario: usuario.idUsuario } },
  });

  if (existente) {
    await prisma.gostoComentarioPublicacao.delete({
      where: { idComentario_idUsuario: { idComentario: comentario.id, idUsuario: usuario.idUsuario } },
    });
  } else {
    await prisma.gostoComentarioPublicacao.create({
      data: { idComentario: comentario.id, idUsuario: usuario.idUsuario },
    });
    await notificarInteracaoNoFeed(comentario.idAutor, usuario.idUsuario, "Novo gosto no comentário", "Alguém gostou do seu comentário na comunidade.");
  }

  revalidarFeedENotificacoes();
  return { sucesso: true, gostou: !existente };
}

export async function ocultarPublicacaoServer(idPublicacao: unknown) {
  return alterarEstadoPublicacaoServer(idPublicacao, "oculto");
}

export async function mostrarPublicacaoServer(idPublicacao: unknown) {
  return alterarEstadoPublicacaoServer(idPublicacao, "publicado");
}

export async function alterarEstadoPublicacaoServer(idPublicacao: unknown, estado: unknown) {
  const usuario = await obterUsuarioAutenticado();
  if (!usuario) return { erro: "Inicie sessão para continuar." };

  const identificador = validarIdentificador(idPublicacao, "A publicação");
  if (!identificador.ok) return { erro: identificador.erro };
  if (estado !== "publicado" && estado !== "oculto") return { erro: "O estado da publicação é inválido." };

  const publicacao = await prisma.publicacao.findUnique({
    where: { id: identificador.valor },
    select: { id: true, idAutor: true },
  });
  if (!publicacao) return { erro: "A publicação não foi encontrada." };

  const podeGerir = publicacao.idAutor === usuario.idUsuario || usuario.papeis.includes("admin");
  if (!podeGerir) return { erro: "Não tem permissão para alterar esta publicação." };

  await prisma.publicacao.update({ where: { id: publicacao.id }, data: { estado } });

  revalidarFeedENotificacoes();
  revalidatePath("/admin/feed");
  return { sucesso: true, estado };
}

export async function criarProjetoVitrineServer(payload: {
  tituloProjeto: unknown;
  descricao: unknown;
  urlRepositorio?: unknown;
  urlDemonstracao?: unknown;
  urlImagem?: unknown;
  urlAnexo?: unknown;
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

  const validImg = typeof payload.urlImagem === "string" ? payload.urlImagem.trim() : "";
  const validaImg = validarUrlAnexo(validImg);
  if (validaImg) return { erro: validaImg };

  const validAnexo = typeof payload.urlAnexo === "string" ? payload.urlAnexo.trim() : "";
  const validaAnexo = validarUrlAnexo(validAnexo);
  if (validaAnexo) return { erro: validaAnexo };

  const projeto = await prisma.projetoVitrine.create({
    data: {
      tituloProjeto: validTitulo.valor,
      descricao: validDesc.valor,
      urlRepositorio: validRepo?.ok ? validRepo.valor : null,
      urlDemonstracao: validDemo?.ok ? validDemo.valor : null,
      urlImagem: validImg || null,
      urlAnexo: validAnexo || null,
      autores: {
        create: [
          { idUsuario: usuario.idUsuario }
        ]
      }
    }
  });

  revalidatePath("/");
  revalidatePath("/estudante");
  revalidatePath("/estudante/portfolio");
  revalidatePath("/professor");
  revalidatePath("/professor/projects");
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