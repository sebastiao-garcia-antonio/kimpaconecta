import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ResolverAvaliacaoClient } from "@/features/assessments/components/resolver-avaliacao-client";

export const revalidate = 0;

export default async function ResolverAvaliacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const sessao = await auth();
  const idEstudante = Number(sessao?.user?.id);
  const papeis = (sessao?.user as { roles?: string[] } | undefined)?.roles || [];
  const { id } = await params;
  const idAvaliacao = Number(id);

  if (
    !Number.isInteger(idEstudante) ||
    idEstudante <= 0 ||
    !papeis.includes("estudante") ||
    !Number.isInteger(idAvaliacao) ||
    idAvaliacao <= 0
  ) {
    redirect("/estudante/avaliacoes");
  }

  const avaliacao = await prisma.avaliacao.findUnique({
    where: { id: idAvaliacao },
    include: {
      disciplina: { select: { idCurso: true, nomeDisciplina: true } },
      questoes: {
        orderBy: { id: "asc" },
        include: {
          alternativas: {
            select: { id: true, textoAlternativa: true },
            orderBy: { id: "asc" },
          },
        },
      },
    },
  });

  const matricula = avaliacao
    ? await prisma.matricula.findFirst({
        where: { idUsuario: idEstudante, turma: { idCurso: avaliacao.disciplina.idCurso } },
        select: { id: true },
      })
    : null;

  if (!avaliacao || !matricula) redirect("/estudante/avaliacoes");

  const tentativa = await prisma.tentativaAvaliacao.findFirst({
    where: { idAvaliacao, idEstudante },
    orderBy: { inicioEm: "desc" },
    select: {
      id: true,
      statusTentativa: true,
      notaObtida: true,
      submetidoEm: true,
      inicioEm: true,
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 lg:p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <Link href="/estudante/avaliacoes" className="hover:text-brand-blue transition">Avaliações</Link>
        <span>/</span>
        <span className="text-slate-700">{avaliacao.titulo}</span>
      </nav>

      <ResolverAvaliacaoClient
        avaliacao={JSON.parse(JSON.stringify(avaliacao))}
        tentativa={tentativa ? JSON.parse(JSON.stringify(tentativa)) : null}
      />
    </div>
  );
}