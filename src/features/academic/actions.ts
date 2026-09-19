"use server";

import { AcademicRepository } from "./repositories/academic.repository";
import { revalidatePath } from "next/cache";
import { validarVariosTextosSeguros } from "@/lib/validacao-texto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getDashboardData(idProfessor: number) {
  try {
    const courses = await AcademicRepository.getTeacherCoursesAndDisciplines(idProfessor);
    const evaluations = await AcademicRepository.getTeacherEvaluations(idProfessor);
    const meetings = await AcademicRepository.getTeacherMeetings(idProfessor);
    const reputation = await AcademicRepository.getTeacherReputacao(idProfessor);
    const projects = await AcademicRepository.getShowcaseProjects(idProfessor);
    const opportunities = await AcademicRepository.getTeacherOpportunities(idProfessor);
    const notifications = await AcademicRepository.getTeacherNotifications(idProfessor);
    const groups = await AcademicRepository.getTeacherGroups(idProfessor);

    const disciplinesMap: Record<number, any> = {};
    const studentsMap: Record<number, any> = {};

    for (const uc of (courses as any[])) {
      const curso = uc.curso;
      if (!curso) continue;

      for (const disc of curso.disciplinas) {
        disciplinesMap[disc.id] = {
          ...disc,
          cursoNome: curso.nomeCurso,
          alunosCount: 0
        };
      }

      for (const turma of curso.turmas) {
        for (const mat of turma.matriculas) {
          const student = mat.usuario;
          if (!student) continue;

          studentsMap[student.id] = {
            ...student,
            turmaNome: turma.nomeTurma,
            numProcesso: mat.numProcesso,
            isMentor: mat.isMentor
          };
        }
      }
    }

    const disciplines = Object.values(disciplinesMap);
    const students = Object.values(studentsMap);

    for (const disc of disciplines) {
      disc.alunosCount = students.length;
    }

    return {
      success: true,
      data: {
        disciplines,
        students,
        evaluations,
        meetings,
        reputation,
        projects,
        opportunities,
        notifications,
        groups
      }
    };
  } catch (error: any) {
    console.error("Error in getDashboardData Server Action:", error);
    return { error: "Erro ao obter os dados do dashboard académico: " + error.message };
  }
}

export async function criarNovaAvaliacaoServer(data: {
  idDisciplina: number;
  idProfessor: number;
  titulo: string;
  dataInicio: string;
  dataFim: string;
  duracaoMinutos: number;
  notaMaxima: number;
  questoes: {
    enunciado: string;
    tipoQuestao: string;
    alternativas?: {
      textoAlternativa: string;
      isCorreta: boolean;
    }[];
  }[];
}) {
  try {
    const sessao = await auth();
    const idDocente = Number(sessao?.user?.id);
    const papeis = (sessao?.user as { roles?: string[] } | undefined)?.roles || [];
    if (!Number.isInteger(idDocente) || idDocente <= 0 || !papeis.includes("professor")) return { error: "Apenas docentes autenticados podem criar avaliações." };
    const disciplinaAutorizada = await prisma.disciplina.findFirst({ where: { id: data.idDisciplina, curso: { usuarios: { some: { idUsuario: idDocente } } } }, select: { id: true } });
    if (!disciplinaAutorizada) return { error: "Não possui vínculo com a disciplina selecionada." };
    if (!Number.isFinite(data.duracaoMinutos) || data.duracaoMinutos < 1 || data.duracaoMinutos > 600 || !Number.isFinite(data.notaMaxima) || data.notaMaxima <= 0 || data.notaMaxima > 100) return { error: "A duração ou nota máxima é inválida." };
    if (new Date(data.dataFim) <= new Date(data.dataInicio)) return { error: "A data de fim deve ser posterior à data de início." };
    const validacaoTexto = validarVariosTextosSeguros([
      { nome: "titulo", valor: data.titulo, obrigatorio: true, maxLength: 120 }
    ]);

    if (!validacaoTexto.ok) {
      return { error: validacaoTexto.erro };
    }

    for (const questao of data.questoes) {
      const validacaoQuestao = validarVariosTextosSeguros([
        { nome: "enunciado", valor: questao.enunciado, obrigatorio: true, maxLength: 500 },
        { nome: "tipoQuestao", valor: questao.tipoQuestao, obrigatorio: true, maxLength: 40 }
      ]);

      if (!validacaoQuestao.ok) {
        return { error: validacaoQuestao.erro };
      }

      for (const alternativa of questao.alternativas || []) {
        const validacaoAlternativa = validarVariosTextosSeguros([
          { nome: "textoAlternativa", valor: alternativa.textoAlternativa, obrigatorio: true, maxLength: 300 }
        ]);

        if (!validacaoAlternativa.ok) {
          return { error: validacaoAlternativa.erro };
        }
      }
    }

    const created = await AcademicRepository.createEvaluation({
      ...data,
      idProfessor: idDocente,
      dataInicio: new Date(data.dataInicio),
      dataFim: new Date(data.dataFim)
    });
    revalidatePath("/professor");
    revalidatePath("/professor/exams");
    return { success: true, data: created };
  } catch (error: any) {
    console.error("Error in criarNovaAvaliacaoServer:", error);
    return { error: "Erro ao criar avaliação: " + error.message };
  }
}

export async function lancarPresencasServer(records: {
  idUsuario: number;
  idDisciplina: number;
  dataAula: string;
  presente: boolean;
  observacao?: string;
}[]) {
  try {
    for (const record of records) {
      const validacaoTexto = validarVariosTextosSeguros([
        { nome: "observacao", valor: record.observacao, maxLength: 300 }
      ]);

      if (!validacaoTexto.ok) {
        return { error: validacaoTexto.erro };
      }
    }

    const data = records.map(r => ({
      ...r,
      dataAula: new Date(r.dataAula)
    }));
    await AcademicRepository.registerAttendance(data);
    revalidatePath("/professor");
    revalidatePath("/professor/classes");
    return { success: true };
  } catch (error: any) {
    console.error("Error in lancarPresencasServer:", error);
    return { error: "Erro ao lançar presenças: " + error.message };
  }
}

export async function enviarMaterialDidaticoServer(data: {
  idDisciplina: number;
  idProfessor: number;
  titulo: string;
  descricao?: string;
  tipoMaterial: string;
  urlArquivo: string;
  tamanhoArquivo?: string;
}) {
  try {
    const validacaoTexto = validarVariosTextosSeguros([
      { nome: "titulo", valor: data.titulo, obrigatorio: true, maxLength: 120 },
      { nome: "descricao", valor: data.descricao, maxLength: 500 },
      { nome: "tipoMaterial", valor: data.tipoMaterial, obrigatorio: true, maxLength: 80 },
      { nome: "urlArquivo", valor: data.urlArquivo, obrigatorio: true, maxLength: 500 },
      { nome: "tamanhoArquivo", valor: data.tamanhoArquivo, maxLength: 40 }
    ]);

    if (!validacaoTexto.ok) {
      return { error: validacaoTexto.erro };
    }

    const material = await AcademicRepository.uploadMaterial(data);
    revalidatePath("/professor");
    return { success: true, data: material };
  } catch (error: any) {
    console.error("Error in enviarMaterialDidaticoServer:", error);
    return { error: "Erro ao enviar material didático: " + error.message };
  }
}

export async function criarReuniaoVirtualServer(data: {
  titulo: string;
  descricao?: string;
  idCriador: number;
  idGrupo?: number;
  linkReuniao: string;
  plataforma: string;
  dataInicio: string;
  dataFim?: string;
  status?: string;
}) {
  try {
    const validacaoTexto = validarVariosTextosSeguros([
      { nome: "titulo", valor: data.titulo, obrigatorio: true, maxLength: 120 },
      { nome: "descricao", valor: data.descricao, maxLength: 500 },
      { nome: "linkReuniao", valor: data.linkReuniao, obrigatorio: true, maxLength: 500 },
      { nome: "plataforma", valor: data.plataforma, obrigatorio: true, maxLength: 60 }
    ]);

    if (!validacaoTexto.ok) {
      return { error: validacaoTexto.erro };
    }

    const meeting = await AcademicRepository.createMeeting({
      ...data,
      dataInicio: new Date(data.dataInicio),
      dataFim: data.dataFim ? new Date(data.dataFim) : undefined
    });
    revalidatePath("/professor");
    return { success: true, data: meeting };
  } catch (error: any) {
    console.error("Error in criarReuniaoVirtualServer:", error);
    return { error: "Erro ao criar reunião virtual: " + error.message };
  }
}

export async function atualizarStatusTentativaServer(idTentativa: number, status: string) {
  try {
    const updated = await AcademicRepository.updateAttemptStatus(idTentativa, status);
    revalidatePath("/professor");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error in atualizarStatusTentativaServer:", error);
    return { error: "Erro ao alterar estado da tentativa: " + error.message };
  }
}

export async function registrarAdvertenciaTentativaServer(idTentativa: number, estudanteNome: string) {
  try {
    await prisma.logsSeguranca.create({
      data: {
        idTentativa,
        tipoEvento: "advertencia",
        descricao: `Advertência registada pelo docente ao estudante ${estudanteNome} durante a monitorização.`,
      },
    });
    revalidatePath("/professor");
    return { success: true };
  } catch {
    return { error: "Não foi possível registar a advertência." };
  }
}

export async function autorizarProjetoServer(idProjeto: number, idProfessor: number) {
  try {
    const updated = await AcademicRepository.authorizeProject(idProjeto, idProfessor);
    revalidatePath("/professor");
    revalidatePath("/");
    revalidatePath("/estudante/portfolio");
    revalidatePath(`/perfil/${idProfessor}`);
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error in autorizarProjetoServer:", error);
    return { error: "Erro ao autorizar projeto: " + error.message };
  }
}

export async function criarOportunidadeServer(data: {
  titulo: string;
  descricao: string;
  tipo: string;
  empresa?: string;
  requisitos?: string;
  dataLimite?: string;
  criadoPor: number;
}) {
  try {
    const sessao = await auth();
    const idUsuario = Number(sessao?.user?.id);
    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      return { error: "Sessão inválida." };
    }

    const papeis = (sessao?.user as { roles?: string[] } | undefined)?.roles || [];
    const podePublicar = ["admin", "coordenador", "professor"].some((p) => papeis.includes(p));
    if (!podePublicar) {
      return { error: "Não tem permissão para publicar oportunidades. Contacte um docente ou coordenador." };
    }

    const validacaoTexto = validarVariosTextosSeguros([
      { nome: "titulo", valor: data.titulo, obrigatorio: true, maxLength: 120 },
      { nome: "descricao", valor: data.descricao, obrigatorio: true, maxLength: 1000 },
      { nome: "tipo", valor: data.tipo, obrigatorio: true, maxLength: 60 },
      { nome: "empresa", valor: data.empresa, maxLength: 120 },
      { nome: "requisitos", valor: data.requisitos, maxLength: 1000 }
    ]);

    if (!validacaoTexto.ok) {
      return { error: validacaoTexto.erro };
    }

    const created = await AcademicRepository.createOpportunity({
      ...data,
      criadoPor: idUsuario,
      dataLimite: data.dataLimite ? new Date(data.dataLimite) : undefined
    });
    revalidatePath("/professor");
    revalidatePath("/professor/opportunities");
    revalidatePath("/estudante/carreiras");
    revalidatePath("/");
    return { success: true, data: created };
  } catch (error: any) {
    console.error("Error in criarOportunidadeServer:", error);
    return { error: "Erro ao criar vaga: " + error.message };
  }
}

export async function atualizarEstadoCandidaturaServer(idCandidatura: number, estado: string) {
  try {
    const updated = await AcademicRepository.updateCandidaturaStatus(idCandidatura, estado);
    revalidatePath("/professor");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error in atualizarEstadoCandidaturaServer:", error);
    return { error: "Erro ao atualizar estado da candidatura: " + error.message };
  }
}

export async function marcarNotificacaoComoLidaServer(idNotificacao: number) {
  try {
    const updated = await AcademicRepository.markNotificationAsRead(idNotificacao);
    revalidatePath("/professor");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error in marcarNotificacaoComoLidaServer:", error);
    return { error: "Erro ao marcar notificação como lida: " + error.message };
  }
}

export async function criarGrupoServer(data: {
  nomeGrupo: string;
  tipoGrupo: string;
  idTurma?: number;
  idDisciplina?: number;
  idCriador: number;
}) {
  try {
    const validacaoTexto = validarVariosTextosSeguros([
      { nome: "nomeGrupo", valor: data.nomeGrupo, obrigatorio: true, maxLength: 120 },
      { nome: "tipoGrupo", valor: data.tipoGrupo, obrigatorio: true, maxLength: 60 }
    ]);

    if (!validacaoTexto.ok) {
      return { error: validacaoTexto.erro };
    }

    const created = await AcademicRepository.createGroup(data);
    revalidatePath("/professor");
    return { success: true, data: created };
  } catch (error: any) {
    console.error("Error in criarGrupoServer:", error);
    return { error: "Erro ao criar grupo de trabalho: " + error.message };
  }
}

export async function adicionarMembroGrupoServer(idGrupo: number, idUsuario: number, funcao: string) {
  try {
    const created = await AcademicRepository.addGroupMember(idGrupo, idUsuario, funcao);
    revalidatePath("/professor");
    return { success: true, data: created };
  } catch (error: any) {
    console.error("Error in adicionarMembroGrupoServer:", error);
    return { error: "Erro ao adicionar membro ao grupo: " + error.message };
  }
}

export async function removerMembroGrupoServer(idGrupo: number, idUsuario: number) {
  try {
    await AcademicRepository.removeGroupMember(idGrupo, idUsuario);
    revalidatePath("/professor");
    return { success: true };
  } catch (error: any) {
    console.error("Error in removerMembroGrupoServer:", error);
    return { error: "Erro ao remover membro do grupo: " + error.message };
  }
}

export async function eliminarGrupoServer(idGrupo: number) {
  try {
    await AcademicRepository.deleteGroup(idGrupo);
    revalidatePath("/professor");
    return { success: true };
  } catch (error: any) {
    console.error("Error in eliminarGrupoServer:", error);
    return { error: "Erro ao eliminar grupo de trabalho: " + error.message };
  }
}

export async function submeterCandidaturaOportunidadeServer(idOportunidade: number, idUsuario: number) {
  try {
    const candidatura = await AcademicRepository.criarCandidaturaOportunidade(idOportunidade, idUsuario);
    revalidatePath("/estudante/carreiras");
    revalidatePath("/professor/opportunities");
    return { success: true, data: candidatura };
  } catch (error: any) {
    console.error("Error in submeterCandidaturaOportunidadeServer:", error);
    return { error: "Erro ao submeter candidatura: " + error.message };
  }
}

