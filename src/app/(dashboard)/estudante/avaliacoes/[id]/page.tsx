import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ResolverAvaliacaoClient } from "@/features/assessments/components/resolver-avaliacao-client";

export default async function ResolverAvaliacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const sessao = await auth(); const idEstudante = Number(sessao?.user?.id); const papeis = (sessao?.user as { roles?: string[] } | undefined)?.roles || []; const { id } = await params; const idAvaliacao = Number(id);
  if (!Number.isInteger(idEstudante) || idEstudante <= 0 || !papeis.includes("estudante") || !Number.isInteger(idAvaliacao) || idAvaliacao <= 0) redirect("/estudante/avaliacoes");
  const avaliacao = await prisma.avaliacao.findUnique({ where: { id: idAvaliacao }, include: { disciplina: { select: { idCurso: true } }, questoes: { include: { alternativas: { select: { id: true, textoAlternativa: true } } } } } });
  const matricula = avaliacao ? await prisma.matricula.findFirst({ where: { idUsuario: idEstudante, turma: { idCurso: avaliacao.disciplina.idCurso } }, select: { id: true } }) : null;
  if (!avaliacao || !matricula) redirect("/estudante/avaliacoes");
  const tentativa = await prisma.tentativaAvaliacao.findFirst({ where: { idAvaliacao, idEstudante }, orderBy: { inicioEm: "desc" } });
  return <div className="mx-auto max-w-4xl space-y-6 p-6 lg:p-8"><ResolverAvaliacaoClient avaliacao={JSON.parse(JSON.stringify(avaliacao))} tentativa={tentativa ? JSON.parse(JSON.stringify(tentativa)) : null} /></div>;
}