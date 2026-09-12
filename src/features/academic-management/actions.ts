"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validarTextoSeguro } from "@/lib/validacao-texto";

const periodosPermitidos = ["Manhã", "Tarde", "Pós-laboral"];

type DadosCurso = { idUo: unknown; nomeCurso: unknown; idCoordenador?: unknown };
type DadosDisciplina = { idCurso: unknown; nomeDisciplina: unknown; semestre: unknown };
type DadosTurma = { idCurso: unknown; nomeTurma: unknown; anoCurricular: unknown; periodo: unknown };

async function obterUtilizadorAutorizado() {
  const sessao = await auth();
  const idUsuario = Number(sessao?.user?.id);
  const papeis = (sessao?.user as { roles?: string[] } | undefined)?.roles || [];
  if (!Number.isInteger(idUsuario) || idUsuario <= 0 || (!papeis.includes("admin") && !papeis.includes("coordenador"))) return null;
  return { idUsuario, administrador: papeis.includes("admin") };
}

function identificar(valor: unknown) {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function validarNumero(valor: unknown, nome: string, minimo: number, maximo: number) {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < minimo || numero > maximo) return { erro: `${nome} deve estar entre ${minimo} e ${maximo}.` };
  return { valor: numero };
}

async function cursoPermitido(idCurso: number, idUsuario: number, administrador: boolean) {
  return prisma.curso.findFirst({ where: administrador ? { id: idCurso } : { id: idCurso, idCoordenador: idUsuario }, select: { id: true } });
}

function revalidarEstrutura() {
  ["/admin/academico", "/coordenador/cursos", "/coordenador/disciplinas", "/coordenador/turmas", "/estudante/disciplinas"].forEach((caminho) => revalidatePath(caminho));
}

export async function guardarCursoServer(idCurso: unknown, dados: DadosCurso) {
  const utilizador = await obterUtilizadorAutorizado();
  if (!utilizador?.administrador) return { error: "Apenas a administração pode gerir cursos." };

  const idUo = identificar(dados.idUo);
  const idExistente = idCurso ? identificar(idCurso) : null;
  const validacaoNome = validarTextoSeguro(dados.nomeCurso, "O nome do curso", { obrigatorio: true, maxLength: 150 });
  if (!idUo) return { error: "Selecione uma unidade orgânica válida." };
  if (!validacaoNome.ok) return { error: validacaoNome.erro };

  const unidade = await prisma.unidadeOrganica.findUnique({ where: { id: idUo }, select: { id: true } });
  if (!unidade) return { error: "A unidade orgânica selecionada não existe." };

  const coordenadorInformado = dados.idCoordenador ? identificar(dados.idCoordenador) : null;
  if (dados.idCoordenador && !coordenadorInformado) return { error: "O coordenador selecionado é inválido." };
  if (coordenadorInformado) {
    const coordenador = await prisma.usuarioPerfil.findFirst({ where: { idUsuario: coordenadorInformado, perfil: { nomePerfil: { in: ["coordenador", "admin"] } } } });
    if (!coordenador) return { error: "O utilizador selecionado não possui perfil de coordenador." };
  }

  const repetido = await prisma.curso.findFirst({
    where: { idUo, nomeCurso: { equals: validacaoNome.valor, mode: "insensitive" }, ...(idExistente ? { id: { not: idExistente } } : {}) },
    select: { id: true },
  });
  if (repetido) return { error: "Já existe um curso com este nome nesta unidade orgânica." };

  try {
    if (idExistente) {
      await prisma.curso.update({ where: { id: idExistente }, data: { idUo, nomeCurso: validacaoNome.valor, idCoordenador: coordenadorInformado } });
    } else {
      await prisma.curso.create({ data: { idUo, nomeCurso: validacaoNome.valor, idCoordenador: coordenadorInformado } });
    }
    revalidarEstrutura();
    return { success: true };
  } catch {
    return { error: "Não foi possível guardar o curso." };
  }
}

export async function guardarDisciplinaServer(idDisciplina: unknown, dados: DadosDisciplina) {
  const utilizador = await obterUtilizadorAutorizado();
  if (!utilizador) return { error: "Não tem permissão para gerir disciplinas." };

  const idCurso = identificar(dados.idCurso);
  const idExistente = idDisciplina ? identificar(idDisciplina) : null;
  const validacaoNome = validarTextoSeguro(dados.nomeDisciplina, "O nome da disciplina", { obrigatorio: true, maxLength: 150 });
  const semestre = validarNumero(dados.semestre, "O semestre", 1, 20);
  if (!idCurso) return { error: "Selecione um curso válido." };
  if (!validacaoNome.ok) return { error: validacaoNome.erro };
  if (semestre.erro) return { error: semestre.erro };
  if (!(await cursoPermitido(idCurso, utilizador.idUsuario, utilizador.administrador))) return { error: "Não pode alterar disciplinas deste curso." };

  const repetida = await prisma.disciplina.findFirst({
    where: { idCurso, nomeDisciplina: { equals: validacaoNome.valor, mode: "insensitive" }, ...(idExistente ? { id: { not: idExistente } } : {}) },
    select: { id: true },
  });
  if (repetida) return { error: "Já existe uma disciplina com este nome neste curso." };

  try {
    if (idExistente) await prisma.disciplina.update({ where: { id: idExistente }, data: { idCurso, nomeDisciplina: validacaoNome.valor, semestre: semestre.valor! } });
    else await prisma.disciplina.create({ data: { idCurso, nomeDisciplina: validacaoNome.valor, semestre: semestre.valor! } });
    revalidarEstrutura();
    return { success: true };
  } catch {
    return { error: "Não foi possível guardar a disciplina." };
  }
}

export async function guardarTurmaServer(idTurma: unknown, dados: DadosTurma) {
  const utilizador = await obterUtilizadorAutorizado();
  if (!utilizador) return { error: "Não tem permissão para gerir turmas." };

  const idCurso = identificar(dados.idCurso);
  const idExistente = idTurma ? identificar(idTurma) : null;
  const validacaoNome = validarTextoSeguro(dados.nomeTurma, "O nome da turma", { obrigatorio: true, maxLength: 50 });
  const anoCurricular = validarNumero(dados.anoCurricular, "O ano curricular", 1, 10);
  const periodo = String(dados.periodo || "");
  if (!idCurso) return { error: "Selecione um curso válido." };
  if (!validacaoNome.ok) return { error: validacaoNome.erro };
  if (anoCurricular.erro) return { error: anoCurricular.erro };
  if (!periodosPermitidos.includes(periodo)) return { error: "Selecione um período válido." };
  if (!(await cursoPermitido(idCurso, utilizador.idUsuario, utilizador.administrador))) return { error: "Não pode alterar turmas deste curso." };

  const repetida = await prisma.turma.findFirst({
    where: { idCurso, nomeTurma: { equals: validacaoNome.valor, mode: "insensitive" }, ...(idExistente ? { id: { not: idExistente } } : {}) },
    select: { id: true },
  });
  if (repetida) return { error: "Já existe uma turma com este nome neste curso." };

  try {
    if (idExistente) await prisma.turma.update({ where: { id: idExistente }, data: { idCurso, nomeTurma: validacaoNome.valor, anoCurricular: anoCurricular.valor!, periodo } });
    else await prisma.turma.create({ data: { idCurso, nomeTurma: validacaoNome.valor, anoCurricular: anoCurricular.valor!, periodo } });
    revalidarEstrutura();
    return { success: true };
  } catch {
    return { error: "Não foi possível guardar a turma." };
  }
}

type DadosUnidadeOrganica = {
  nomeUo: unknown;
  sigla: unknown;
  localizacao?: unknown;
};

export async function guardarUnidadeOrganicaServer(idUnidade: unknown, dados: DadosUnidadeOrganica) {
  const utilizador = await obterUtilizadorAutorizado();
  if (!utilizador?.administrador) return { error: "Apenas a administração pode gerir unidades académicas." };

  const idExistente = idUnidade ? identificar(idUnidade) : null;
  const validacaoNome = validarTextoSeguro(dados.nomeUo, "O nome da unidade", { obrigatorio: true, maxLength: 150 });
  const validacaoSigla = validarTextoSeguro(dados.sigla, "A sigla", { obrigatorio: true, maxLength: 20 });
  const localizacaoStr = dados.localizacao ? String(dados.localizacao).trim() : null;

  if (!validacaoNome.ok) return { error: validacaoNome.erro };
  if (!validacaoSigla.ok) return { error: validacaoSigla.erro };

  const repetida = await prisma.unidadeOrganica.findFirst({
    where: {
      OR: [
        { nomeUo: { equals: validacaoNome.valor, mode: "insensitive" } },
        { sigla: { equals: validacaoSigla.valor, mode: "insensitive" } },
      ],
      ...(idExistente ? { id: { not: idExistente } } : {}),
    },
    select: { id: true, sigla: true, nomeUo: true },
  });

  if (repetida) {
    if (repetida.sigla.toLowerCase() === validacaoSigla.valor.toLowerCase()) {
      return { error: `Já existe uma unidade com a sigla "${validacaoSigla.valor.toUpperCase()}".` };
    }
    return { error: "Já existe uma unidade académica com este nome." };
  }

  try {
    if (idExistente) {
      await prisma.unidadeOrganica.update({
        where: { id: idExistente },
        data: {
          nomeUo: validacaoNome.valor,
          sigla: validacaoSigla.valor.toUpperCase(),
          localizacao: localizacaoStr || null,
        },
      });
    } else {
      await prisma.unidadeOrganica.create({
        data: {
          nomeUo: validacaoNome.valor,
          sigla: validacaoSigla.valor.toUpperCase(),
          localizacao: localizacaoStr || null,
        },
      });
    }
    revalidarEstrutura();
    return { success: true };
  } catch {
    return { error: "Não foi possível guardar a unidade académica." };
  }
}

export async function eliminarUnidadeOrganicaServer(idUnidade: unknown) {
  const utilizador = await obterUtilizadorAutorizado();
  if (!utilizador?.administrador) return { error: "Apenas a administração pode eliminar unidades académicas." };

  const id = identificar(idUnidade);
  if (!id) return { error: "Identificador de unidade inválido." };

  const cursosCount = await prisma.curso.count({ where: { idUo: id } });
  if (cursosCount > 0) {
    return {
      error: `Não é possível eliminar: esta unidade possui ${cursosCount} curso(s) associado(s). Remova ou transfira os cursos antes de prosseguir.`,
    };
  }

  try {
    await prisma.unidadeOrganica.delete({ where: { id } });
    revalidarEstrutura();
    return { success: true };
  } catch {
    return { error: "Não foi possível eliminar a unidade académica." };
  }
}

export async function eliminarCursoServer(idCurso: unknown) {
  const utilizador = await obterUtilizadorAutorizado();
  if (!utilizador?.administrador) return { error: "Apenas a administração pode eliminar cursos." };

  const id = identificar(idCurso);
  if (!id) return { error: "Identificador de curso inválido." };

  const [turmasCount, disciplinasCount, solicitacoesCount] = await Promise.all([
    prisma.turma.count({ where: { idCurso: id } }),
    prisma.disciplina.count({ where: { idCurso: id } }),
    prisma.solicitacaoAcesso.count({ where: { idCurso: id } }),
  ]);

  if (turmasCount > 0) {
    return {
      error: `Não é possível eliminar: este curso possui ${turmasCount} turma(s) registada(s). Elimine ou altere as turmas primeiro.`,
    };
  }

  if (disciplinasCount > 0) {
    return {
      error: `Não é possível eliminar: este curso possui ${disciplinasCount} disciplina(s) na grade curricular.`,
    };
  }

  if (solicitacoesCount > 0) {
    return {
      error: `Não é possível eliminar: existem ${solicitacoesCount} solicitação(ões) de acesso vinculadas a este curso.`,
    };
  }

  try {
    await prisma.curso.delete({ where: { id } });
    revalidarEstrutura();
    return { success: true };
  } catch {
    return { error: "Não foi possível eliminar o curso." };
  }
}

export async function eliminarTurmaServer(idTurma: unknown) {
  const utilizador = await obterUtilizadorAutorizado();
  if (!utilizador) return { error: "Não tem permissão para eliminar turmas." };

  const id = identificar(idTurma);
  if (!id) return { error: "Identificador de turma inválido." };

  const turma = await prisma.turma.findUnique({
    where: { id },
    select: { id: true, idCurso: true },
  });
  if (!turma) return { error: "Turma não encontrada." };

  if (!(await cursoPermitido(turma.idCurso, utilizador.idUsuario, utilizador.administrador))) {
    return { error: "Não tem permissão para gerir turmas deste curso." };
  }

  const [matriculasCount, solicitacoesCount, gruposCount] = await Promise.all([
    prisma.matricula.count({ where: { idTurma: id } }),
    prisma.solicitacaoAcesso.count({ where: { idTurma: id } }),
    prisma.grupo.count({ where: { idTurma: id } }),
  ]);

  if (matriculasCount > 0) {
    return {
      error: `Não é possível eliminar: esta turma possui ${matriculasCount} estudante(s) matriculado(s).`,
    };
  }

  if (solicitacoesCount > 0) {
    return {
      error: `Não é possível eliminar: existem ${solicitacoesCount} solicitação(ões) de acesso vinculadas a esta turma.`,
    };
  }

  if (gruposCount > 0) {
    return {
      error: `Não é possível eliminar: existem ${gruposCount} grupo(s) de trabalho vinculados a esta turma.`,
    };
  }

  try {
    await prisma.turma.delete({ where: { id } });
    revalidarEstrutura();
    return { success: true };
  } catch {
    return { error: "Não foi possível eliminar a turma." };
  }
}