"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validarTextoSeguro } from "@/lib/validacao-texto";

type RegistoPresenca = { idUsuario: unknown; presente: unknown };
type DadosDiario = {
  idDisciplina: unknown;
  idTurma: unknown;
  dataAula: unknown;
  temaAula: unknown;
  observacao?: unknown;
  presencas: RegistoPresenca[];
};

function identificar(valor: unknown) {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function validarDataAula(valor: unknown) {
  const texto = String(valor || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return null;
  const data = new Date(`${texto}T00:00:00.000Z`);
  return Number.isNaN(data.getTime()) ? null : data;
}

export async function lancarDiarioEPresencasServer(dados: DadosDiario) {
  const sessao = await auth();
  const idDocente = Number(sessao?.user?.id);
  const papeis = (sessao?.user as { roles?: string[] } | undefined)?.roles || [];
  if (!Number.isInteger(idDocente) || idDocente <= 0 || !papeis.includes("professor")) return { error: "Apenas docentes autenticados podem lançar presenças." };

  const idDisciplina = identificar(dados.idDisciplina);
  const idTurma = identificar(dados.idTurma);
  const dataAula = validarDataAula(dados.dataAula);
  if (!idDisciplina || !idTurma || !dataAula) return { error: "Disciplina, turma ou data da aula são inválidas." };
  if (!Array.isArray(dados.presencas) || dados.presencas.length === 0) return { error: "Inclua os estudantes da turma no lançamento." };

  const validacaoTema = validarTextoSeguro(dados.temaAula, "O tema da aula", { obrigatorio: true, maxLength: 1000 });
  const validacaoObservacao = validarTextoSeguro(dados.observacao, "A observação", { maxLength: 500 });
  if (!validacaoTema.ok) return { error: validacaoTema.erro };
  if (!validacaoObservacao.ok) return { error: validacaoObservacao.erro };

  const turma = await prisma.turma.findUnique({
    where: { id: idTurma },
    include: { matriculas: { select: { idUsuario: true } } },
  });
  const disciplina = await prisma.disciplina.findUnique({ where: { id: idDisciplina }, select: { id: true, idCurso: true } });
  if (!turma || !disciplina || turma.idCurso !== disciplina.idCurso) return { error: "A turma não pertence ao curso desta disciplina." };

  const vinculoDocente = await prisma.usuarioCurso.findFirst({ where: { idUsuario: idDocente, idCurso: disciplina.idCurso }, select: { idUsuario: true } });
  if (!vinculoDocente) return { error: "Não possui vínculo com o curso desta disciplina." };

  const estudantesDaTurma = turma.matriculas.map((matricula) => matricula.idUsuario).sort((primeiro, segundo) => primeiro - segundo);
  const presencas = dados.presencas.map((registo) => ({ idUsuario: identificar(registo.idUsuario), presente: registo.presente === true }));
  if (presencas.some((registo) => !registo.idUsuario)) return { error: "Foram recebidos estudantes inválidos." };

  const estudantesRecebidos = presencas.map((registo) => registo.idUsuario as number).sort((primeiro, segundo) => primeiro - segundo);
  const semDuplicados = new Set(estudantesRecebidos);
  if (semDuplicados.size !== estudantesDaTurma.length || estudantesRecebidos.length !== estudantesDaTurma.length || estudantesRecebidos.some((id, indice) => id !== estudantesDaTurma[indice])) {
    return { error: "A lista de presenças deve corresponder exatamente aos estudantes da turma." };
  }

  try {
    await prisma.$transaction(async (transacao) => {
      await transacao.diarioAula.upsert({
        where: { idDisciplina_idTurma_dataAula: { idDisciplina, idTurma, dataAula } },
        create: { idDocente, idDisciplina, idTurma, dataAula, temaAula: validacaoTema.valor, observacao: validacaoObservacao.valor || null },
        update: { idDocente, temaAula: validacaoTema.valor, observacao: validacaoObservacao.valor || null },
      });
      await transacao.presencaAula.deleteMany({ where: { idDisciplina, dataAula, idUsuario: { in: estudantesDaTurma } } });
      await transacao.presencaAula.createMany({ data: presencas.map((registo) => ({ idUsuario: registo.idUsuario as number, idDisciplina, dataAula, presente: registo.presente, observacao: validacaoObservacao.valor || null })) });
    });

    ["/professor", "/professor/classes", "/estudante", "/estudante/presencas", "/estudante/disciplinas"].forEach((caminho) => revalidatePath(caminho));
    return { success: true };
  } catch {
    return { error: "Não foi possível guardar o diário de aula e as presenças." };
  }
}