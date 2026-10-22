"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validarTextoSeguro } from "@/lib/validacao-texto";

const TIPOS_GRUPO_VALIDOS = ["turma", "disciplina", "trabalho", "mentoria"];

async function obterSessao() {
  const sessao = await auth();
  const idUsuario = Number(sessao?.user?.id);
  const papeis = (sessao?.user as { roles?: string[] } | undefined)?.roles || [];
  if (!Number.isInteger(idUsuario) || idUsuario <= 0) return null;
  return { idUsuario, papeis };
}

async function obterCursosCoordenador(idCoordenador: number, ehAdmin: boolean) {
  if (ehAdmin) return null;
  const cursos = await prisma.curso.findMany({
    where: { OR: [{ idCoordenador }, { usuarios: { some: { idUsuario: idCoordenador } } }] },
    select: { id: true },
  });
  return cursos.map((c) => c.id);
}

export async function criarGrupoCoordenadorServer(dados: {
  nomeGrupo: unknown;
  tipoGrupo: unknown;
  idTurma?: unknown;
  idDisciplina?: unknown;
}) {
  try {
    const sessao = await obterSessao();
    if (!sessao) return { error: "Sessao invalida." };

    const { idUsuario, papeis } = sessao;
    const ehCoordenador = papeis.includes("coordenador") || papeis.includes("admin");
    if (!ehCoordenador) return { error: "Apenas coordenadores podem criar grupos do curso." };

    const ehAdmin = papeis.includes("admin");

    const validNome = validarTextoSeguro(dados.nomeGrupo, "O nome do grupo", { obrigatorio: true, maxLength: 100 });
    if (!validNome.ok) return { error: validNome.erro };

    const tipo = String(dados.tipoGrupo || "").trim().toLowerCase();
    if (!TIPOS_GRUPO_VALIDOS.includes(tipo)) return { error: "Tipo de grupo invalido." };

    const idTurma = dados.idTurma ? Number(dados.idTurma) : null;
    const idDisciplina = dados.idDisciplina ? Number(dados.idDisciplina) : null;

    if (!ehAdmin) {
      const idsCursos = await obterCursosCoordenador(idUsuario, ehAdmin);
      if (!idsCursos || idsCursos.length === 0) return { error: "Nao tem cursos sob coordenacao." };

      if (idTurma) {
        const turma = await prisma.turma.findFirst({ where: { id: idTurma, idCurso: { in: idsCursos } } });
        if (!turma) return { error: "A turma selecionada nao pertence ao seu curso." };
      }
      if (idDisciplina) {
        const disciplina = await prisma.disciplina.findFirst({ where: { id: idDisciplina, idCurso: { in: idsCursos } } });
        if (!disciplina) return { error: "A disciplina selecionada nao pertence ao seu curso." };
      }
    }

    const chaveConversa = "grupo_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);

    const grupo = await prisma.grupo.create({
      data: { nomeGrupo: validNome.valor, tipoGrupo: tipo, idTurma: idTurma || null, idDisciplina: idDisciplina || null, idCriador: idUsuario, chaveConversa },
    });

    await prisma.grupoMembro.create({ data: { idGrupo: grupo.id, idUsuario, funcaoNoGrupo: "admin" } });

    revalidatePath("/coordenador/grupos");
    revalidatePath("/mensagens");
    return { success: true, idGrupo: grupo.id };
  } catch (error: any) {
    console.error("[CRIAR_GRUPO_COORDENADOR_ERROR]", error);
    return { error: "Nao foi possivel criar o grupo." };
  }
}

export async function eliminarGrupoCoordenadorServer(idGrupo: unknown) {
  try {
    const sessao = await obterSessao();
    if (!sessao) return { error: "Sessao invalida." };

    const { idUsuario, papeis } = sessao;
    const ehCoordenador = papeis.includes("coordenador") || papeis.includes("admin");
    if (!ehCoordenador) return { error: "Sem permissao." };

    const id = Number(idGrupo);
    if (!Number.isInteger(id) || id <= 0) return { error: "Grupo invalido." };

    const ehAdmin = papeis.includes("admin");

    if (!ehAdmin) {
      const idsCursos = await obterCursosCoordenador(idUsuario, ehAdmin);
      if (!idsCursos || idsCursos.length === 0) return { error: "Nao tem cursos sob coordenacao." };

      const grupo = await prisma.grupo.findFirst({
        where: { id, OR: [{ idCriador: idUsuario }, { turma: { idCurso: { in: idsCursos } } }, { disciplina: { idCurso: { in: idsCursos } } }] },
      });
      if (!grupo) return { error: "Grupo nao encontrado ou sem permissao." };
    }

    await prisma.grupo.delete({ where: { id } });

    revalidatePath("/coordenador/grupos");
    revalidatePath("/mensagens");
    return { success: true };
  } catch (error: any) {
    console.error("[ELIMINAR_GRUPO_COORDENADOR_ERROR]", error);
    return { error: "Nao foi possivel eliminar o grupo." };
  }
}

export async function verificarMentorEstudanteServer() {
  const sessao = await obterSessao();
  if (!sessao) return { isMentor: false };

  const { idUsuario, papeis } = sessao;
  if (!papeis.includes("estudante")) return { isMentor: true };

  const matricula = await prisma.matricula.findFirst({ where: { idUsuario, isMentor: true }, select: { id: true } });
  return { isMentor: Boolean(matricula) };
}
