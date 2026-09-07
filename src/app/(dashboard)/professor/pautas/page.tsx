import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaginaSecao } from "@/components/pagina-seccao";
import { ReportsRepository } from "@/features/academic/repositories/reports.repository";
import { PautaAcademicaClient } from "@/features/academic/components/pauta-academica-client";

export const revalidate = 0;

export default async function PaginaPautasProfessor({
  searchParams,
}: {
  searchParams: Promise<{ disciplina?: string; turma?: string }>;
}) {
  const sessao = await auth();
  const idUsuario = Number(sessao?.user?.id);
  const papeis = (sessao?.user as { roles?: string[] } | undefined)?.roles || [];

  if (!sessao || !Number.isInteger(idUsuario) || idUsuario <= 0) {
    redirect("/login");
  }

  if (!papeis.includes("professor") && !papeis.includes("coordenador") && !papeis.includes("admin")) {
    redirect("/login");
  }

  const query = await searchParams;

  // Buscar disciplinas ativas para o docente
  const disciplinasDocente = await prisma.disciplina.findMany({
    orderBy: { nomeDisciplina: "asc" },
    select: { id: true, nomeDisciplina: true, idCurso: true, curso: { select: { nomeCurso: true } } },
  });

  const idDisciplinaSelecionada = query.disciplina
    ? Number(query.disciplina)
    : disciplinasDocente[0]?.id || 1;

  const idTurmaSelecionada = query.turma ? Number(query.turma) : undefined;

  const pauta = await ReportsRepository.obterPautaDisciplina(idDisciplinaSelecionada, idTurmaSelecionada);

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="professor"
        titulo="Pautas Académicas & Relatórios"
        descricao="Consulte a pauta oficial de frequência e notas, exporte para Excel ou imprima o relatório oficial da turma."
        indicadores={[
          { titulo: "Aprovados", valor: `${pauta?.estatisticas.aprovados || 0}`, observacao: "Nota >= 10.0" },
          { titulo: "Em Recurso", valor: `${pauta?.estatisticas.recurso || 0}`, observacao: "Nota 7.0 - 9.9" },
          { titulo: "Taxa de Aprovação", valor: `${pauta?.estatisticas.taxaAprovacao || 0}%`, observacao: "Turma Global" },
        ]}
        resumos={[
          {
            titulo: pauta?.disciplina.nomeDisciplina || "Pauta de Disciplina",
            descricao: `Curso: ${pauta?.disciplina.nomeCurso || "UKV"} · Média da Turma: ${pauta?.estatisticas.mediaTurma || 0.0} valores`,
            estado: "Valida",
          },
        ]}
      />

      <div className="px-6 pb-8 lg:px-8 space-y-6">
        {pauta ? (
          <PautaAcademicaClient pautaInicial={JSON.parse(JSON.stringify(pauta))} />
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <h3 className="text-base font-bold text-slate-800">Nenhuma disciplina selecionada</h3>
            <p className="mt-1 text-xs text-slate-500">Selecione uma disciplina cadastrada para gerar a pauta oficial.</p>
          </div>
        )}
      </div>
    </div>
  );
}
