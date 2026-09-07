"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validarTextoSeguro } from "@/lib/validacao-texto";
import { NotificationsRepository } from "@/features/notifications/repositories/notifications.repository";

function identificar(valor: unknown) { const id = Number(valor); return Number.isInteger(id) && id > 0 ? id : null; }

async function obterEstudante() {
  const sessao = await auth(); const idEstudante = Number(sessao?.user?.id); const papeis = (sessao?.user as { roles?: string[] } | undefined)?.roles || [];
  return Number.isInteger(idEstudante) && idEstudante > 0 && papeis.includes("estudante") ? idEstudante : null;
}

async function obterAvaliacaoPermitida(idAvaliacao: number, idEstudante: number) {
  const avaliacao = await prisma.avaliacao.findUnique({ where: { id: idAvaliacao }, include: { disciplina: { select: { idCurso: true } }, questoes: { include: { alternativas: true } } } });
  if (!avaliacao) return null;
  const matricula = await prisma.matricula.findFirst({ where: { idUsuario: idEstudante, turma: { idCurso: avaliacao.disciplina.idCurso } }, select: { id: true } });
  return matricula ? avaliacao : null;
}

export async function iniciarTentativaAvaliacaoServer(idAvaliacao: unknown) {
  const idEstudante = await obterEstudante(); const id = identificar(idAvaliacao);
  if (!idEstudante) return { error: "Apenas estudantes autenticados podem iniciar avaliações." };
  if (!id) return { error: "Avaliação inválida." };
  const avaliacao = await obterAvaliacaoPermitida(id, idEstudante);
  if (!avaliacao) return { error: "Não tem acesso a esta avaliação." };
  const agora = new Date();
  if (agora < avaliacao.dataInicio || agora > avaliacao.dataFim) return { error: "Esta avaliação não está disponível neste momento." };
  const emCurso = await prisma.tentativaAvaliacao.findFirst({ where: { idAvaliacao: id, idEstudante, statusTentativa: "em_curso" }, orderBy: { inicioEm: "desc" } });
  if (emCurso) return { success: true, data: { idTentativa: emCurso.id } };
  const tentativa = await prisma.tentativaAvaliacao.create({ data: { idAvaliacao: id, idEstudante, statusTentativa: "em_curso" } });
  revalidatePath(`/estudante/avaliacoes/${id}`); revalidatePath("/estudante/avaliacoes");
  return { success: true, data: { idTentativa: tentativa.id } };
}

export async function submeterTentativaAvaliacaoServer(idTentativa: unknown, respostas: { idQuestao: unknown; idAlternativaEscolhida?: unknown; textoResposta?: unknown }[]) {
  const idEstudante = await obterEstudante(); const id = identificar(idTentativa);
  if (!idEstudante) return { error: "Sessão inválida." }; if (!id || !Array.isArray(respostas)) return { error: "Dados de submissão inválidos." };
  const tentativa = await prisma.tentativaAvaliacao.findFirst({ where: { id: id, idEstudante, statusTentativa: "em_curso" }, include: { avaliacao: { include: { disciplina: { select: { idCurso: true } }, questoes: { include: { alternativas: true } } } } } });
  if (!tentativa) return { error: "A tentativa não está disponível para submissão." };
  const agora = new Date(); if (agora > tentativa.avaliacao.dataFim) return { error: "O prazo desta avaliação terminou." };
  const matricula = await prisma.matricula.findFirst({ where: { idUsuario: idEstudante, turma: { idCurso: tentativa.avaliacao.disciplina.idCurso } }, select: { id: true } });
  if (!matricula) return { error: "Não possui matrícula nesta disciplina." };

  const mapaQuestoes = new Map(tentativa.avaliacao.questoes.map((questao) => [questao.id, questao]));
  const respostasNormalizadas: { idQuestao: number; idAlternativaEscolhida?: number; textoResposta?: string }[] = [];
  for (const resposta of respostas) {
    const idQuestao = identificar(resposta.idQuestao); if (!idQuestao || !mapaQuestoes.has(idQuestao)) return { error: "Foi recebida uma questão inválida." };
    const questao = mapaQuestoes.get(idQuestao)!; const idAlternativa = resposta.idAlternativaEscolhida ? identificar(resposta.idAlternativaEscolhida) : null;
    const texto = validarTextoSeguro(resposta.textoResposta, "A resposta", { maxLength: 3000 }); if (!texto.ok) return { error: texto.erro };
    if (questao.tipoQuestao === "desenvolvimento") { if (!texto.valor) return { error: "Responda a todas as questões de desenvolvimento." }; respostasNormalizadas.push({ idQuestao, textoResposta: texto.valor }); }
    else { if (!idAlternativa || !questao.alternativas.some((alternativa) => alternativa.id === idAlternativa)) return { error: "Selecione uma alternativa válida para cada questão." }; respostasNormalizadas.push({ idQuestao, idAlternativaEscolhida: idAlternativa }); }
  }
  if (respostasNormalizadas.length !== tentativa.avaliacao.questoes.length || new Set(respostasNormalizadas.map((resposta) => resposta.idQuestao)).size !== tentativa.avaliacao.questoes.length) return { error: "Responda a todas as questões antes de submeter." };
  const objetivas = tentativa.avaliacao.questoes.filter((questao) => questao.tipoQuestao !== "desenvolvimento");
  const corretas = respostasNormalizadas.filter((resposta) => mapaQuestoes.get(resposta.idQuestao)?.alternativas.some((alternativa) => alternativa.id === resposta.idAlternativaEscolhida && alternativa.isCorreta)).length;
  const notaObtida = objetivas.length === tentativa.avaliacao.questoes.length ? (Number(tentativa.avaliacao.notaMaxima) * corretas) / objetivas.length : null;

  await prisma.$transaction(async (transacao) => { for (const resposta of respostasNormalizadas) await transacao.respostaEstudante.upsert({ where: { idTentativa_idQuestao: { idTentativa: tentativa.id, idQuestao: resposta.idQuestao } }, create: { idTentativa: tentativa.id, idQuestao: resposta.idQuestao, idAlternativaEscolhida: resposta.idAlternativaEscolhida || null, textoResposta: resposta.textoResposta || null }, update: { idAlternativaEscolhida: resposta.idAlternativaEscolhida || null, textoResposta: resposta.textoResposta || null } }); await transacao.tentativaAvaliacao.update({ where: { id: tentativa.id }, data: { statusTentativa: "submetida", submetidoEm: agora, notaObtida } }); });
  try { await NotificationsRepository.criar({ idUsuario: tentativa.avaliacao.idProfessor, titulo: "Nova avaliação submetida", mensagem: `Um estudante submeteu a avaliação ${tentativa.avaliacao.titulo}.`, tipo: "avaliacao", prioridade: "normal" }); } catch {}
  revalidatePath(`/estudante/avaliacoes/${tentativa.avaliacao.id}`); revalidatePath("/estudante/avaliacoes"); revalidatePath("/professor/exams");
  return { success: true };
}