"use server";

import { auth } from "@/lib/auth";
import { ReportsRepository } from "./repositories/reports.repository";

async function obterIdUsuario() {
  const sessao = await auth();
  const idUsuario = Number(sessao?.user?.id);
  const papeis = (sessao?.user as { roles?: string[] } | undefined)?.roles || [];
  return Number.isInteger(idUsuario) && idUsuario > 0 ? { idUsuario, papeis } : null;
}

export async function obterPautaAcademicaServer(idDisciplina: number, idTurma?: number) {
  const usuario = await obterIdUsuario();
  if (!usuario) return { error: "Sessão inválida." };

  const idDisc = Number(idDisciplina);
  if (!Number.isInteger(idDisc) || idDisc <= 0) return { error: "Disciplina inválida." };

  const idT = idTurma ? Number(idTurma) : undefined;

  const pauta = await ReportsRepository.obterPautaDisciplina(idDisc, idT);
  if (!pauta) return { error: "Não foi possível carregar a pauta académica." };

  return { success: true, data: pauta };
}
