"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validarVariosTextosSeguros } from "@/lib/validacao-texto";
import { NotificationsRepository } from "@/features/notifications/repositories/notifications.repository";

const estadosPermitidos = ["ativo", "suspenso"];
const prioridadesPermitidas = ["normal", "alta", "baixa"];

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

function revalidarPaginaEstudantes() {
  ["/coordenador", "/coordenador/estudantes", "/admin"].forEach((caminho) =>
    revalidatePath(caminho)
  );
}

async function obterCursosPermitidos(utilizador: UtilizadorAutorizado) {
  if (utilizador.administrador) return null;

  const cursosCoordenados = await prisma.curso.findMany({
    where: {
      OR: [
        { idCoordenador: utilizador.idUsuario },
        { usuarios: { some: { idUsuario: utilizador.idUsuario } } },
      ],
    },
    select: { id: true, idUo: true },
  });

  const uoIds = Array.from(new Set(cursosCoordenados.map((curso) => curso.idUo)));

  const cursos = await prisma.curso.findMany({
    where: {
      OR: [
        { idCoordenador: utilizador.idUsuario },
        { usuarios: { some: { idUsuario: utilizador.idUsuario } } },
        ...(uoIds.length > 0 ? [{ idUo: { in: uoIds } }] : []),
      ],
    },
    select: { id: true },
  });

  return cursos.map((curso) => curso.id);
}

async function obterEstudantePermitido(idEstudante: number, utilizador: UtilizadorAutorizado) {
  const whereBase: Record<string, unknown> = {
    id: idEstudante,
    perfis: { some: { perfil: { nomePerfil: "estudante" } } },
  };

  if (!utilizador.administrador) {
    const idsPermitidos = await obterCursosPermitidos(utilizador);
    if (idsPermitidos === null || idsPermitidos.length === 0) return null;

    whereBase.OR = [
      { cursos: { some: { idCurso: { in: idsPermitidos } } } },
      { matriculas: { some: { turma: { idCurso: { in: idsPermitidos } } } } },
    ];
  }

  return prisma.usuario.findFirst({
    where: whereBase as never,
    select: {
      id: true,
      nome: true,
      email: true,
      perfis: { select: { perfil: { select: { nomePerfil: true } } } },
    },
  });
}

export async function alterarEstadoEstudanteServer(idEstudante: unknown, novoEstado: unknown) {
  const utilizador = await obterUtilizadorAutorizado();
  if (!utilizador) return { error: "Não tem permissão para gerir estudantes." };

  const id = identificar(idEstudante);
  const estado = String(novoEstado || "");

  if (!id) return { error: "Identificador de estudante inválido." };
  if (!estadosPermitidos.includes(estado)) {
    return { error: "Estado de acesso inválido." };
  }
  if (id === utilizador.idUsuario) return { error: "Não pode alterar o próprio acesso." };

  const estudante = await obterEstudantePermitido(id, utilizador);
  if (!estudante) return { error: "Estudante não encontrado ou não pertence à sua coordenação." };

  try {
    await prisma.usuario.update({
      where: { id },
      data: { status: estado },
    });

    await NotificationsRepository.criar({
      idUsuario: id,
      titulo: estado === "suspenso" ? "Acesso bloqueado" : "Acesso restabelecido",
      mensagem:
        estado === "suspenso"
          ? "O seu acesso à plataforma Kimpa Connect foi bloqueado pela coordenação. Contacte o coordenador do seu curso para mais informações."
          : "O seu acesso à plataforma Kimpa Connect foi restabelecido. Pode entrar novamente na sua conta.",
      tipo: "sistema",
      prioridade: "alta",
    });

    revalidarPaginaEstudantes();
    return { success: true };
  } catch {
    return { error: "Não foi possível alterar o estado do estudante." };
  }
}

export async function notificarEstudanteServer(dados: {
  idEstudante: unknown;
  titulo: unknown;
  mensagem: unknown;
  prioridade?: unknown;
}) {
  const utilizador = await obterUtilizadorAutorizado();
  if (!utilizador) return { error: "Não tem permissão para notificar estudantes." };

  const id = identificar(dados.idEstudante);
  if (!id) return { error: "Identificador de estudante inválido." };

  const validacao = validarVariosTextosSeguros([
    { nome: "título", valor: dados.titulo, obrigatorio: true, maxLength: 150 },
    { nome: "mensagem", valor: dados.mensagem, obrigatorio: true, maxLength: 1000 },
  ]);
  if (!validacao.ok) return { error: validacao.erro };

  const prioridade = String(dados.prioridade || "normal");
  if (!prioridadesPermitidas.includes(prioridade)) {
    return { error: "Prioridade de notificação inválida." };
  }

  const estudante = await obterEstudantePermitido(id, utilizador);
  if (!estudante) return { error: "Estudante não encontrado ou não pertence à sua coordenação." };

  try {
    await NotificationsRepository.criar({
      idUsuario: id,
      titulo: validacao.valor.titulo,
      mensagem: validacao.valor.mensagem,
      tipo: "coordenacao",
      prioridade,
    });

    revalidarPaginaEstudantes();
    return { success: true };
  } catch {
    return { error: "Não foi possível enviar a notificação." };
  }
}

export async function alterarMentorEstudanteServer(idEstudante: unknown, isMentor: unknown) {
  const utilizador = await obterUtilizadorAutorizado();
  if (!utilizador) return { error: "Não tem permissão para gerir estudantes." };

  const id = identificar(idEstudante);
  if (!id) return { error: "Identificador de estudante inválido." };
  if (id === utilizador.idUsuario) return { error: "Não pode alterar o próprio perfil de mentor." };

  const estudante = await obterEstudantePermitido(id, utilizador);
  if (!estudante) return { error: "Estudante não encontrado ou não pertence à sua coordenação." };

  const mentor = Boolean(isMentor);

  try {
    await prisma.matricula.updateMany({
      where: { idUsuario: id },
      data: { isMentor: mentor },
    });

    await NotificationsRepository.criar({
      idUsuario: id,
      titulo: mentor ? "Designado como Mentor" : "Removido de Mentor",
      mensagem: mentor
        ? "A coordenação selecionou-o como mentor. Os estudantes da sua faculdade poderão escolhê-lo como acompanhador académico."
        : "A coordenação removeu-o do papel de mentor. Já não aparecerá na lista de mentores disponíveis.",
      tipo: "sistema",
      prioridade: mentor ? "alta" : "normal",
    });

    revalidarPaginaEstudantes();
    return { success: true };
  } catch {
    return { error: "Não foi possível alterar o estado de mentor." };
  }
}

export async function eliminarEstudanteServer(idEstudante: unknown) {
  const utilizador = await obterUtilizadorAutorizado();
  if (!utilizador) return { error: "Não tem permissão para eliminar estudantes." };

  const id = identificar(idEstudante);
  if (!id) return { error: "Identificador de estudante inválido." };
  if (id === utilizador.idUsuario) return { error: "Não pode eliminar a própria conta." };

  const estudante = await obterEstudantePermitido(id, utilizador);
  if (!estudante) return { error: "Estudante não encontrado ou não pertence à sua coordenação." };

  const perfis = estudante.perfis.map((perfil) => perfil.perfil.nomePerfil);
  const apenasEstudante =
    perfis.length === 1 && perfis.includes("estudante");

  if (!apenasEstudante) {
    return {
      error:
        "Não é possível eliminar: este utilizador possui outros perfis associados (coordenador/professor/admin). Apenas estudantes podem ser removidos pela coordenação.",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.sessaoMentoria.deleteMany({
        where: { OR: [{ idMentor: id }, { idEstudanteAjudado: id }] },
      });

      await tx.tentativaAvaliacao.deleteMany({ where: { idEstudante: id } });

      await tx.avaliacao.deleteMany({ where: { idProfessor: id } });

      await tx.diarioAula.deleteMany({ where: { idDocente: id } });

      await tx.usuario.delete({ where: { id } });
    });

    try {
      await prisma.auditoriaSistema.create({
        data: {
          idUsuario: utilizador.idUsuario,
          acao: "Remoção Estudante",
          tabelaAfetada: "usuario",
          idRegistroAfetado: BigInt(id),
          descricao: `Estudante removido da base de dados: ${estudante.nome} (${estudante.email})`,
        },
      });
    } catch {
      // A auditoria é opcional e não deve impedir a eliminação.
    }

    revalidarPaginaEstudantes();
    return { success: true };
  } catch {
    return { error: "Não foi possível eliminar o estudante. Tente novamente." };
  }
}