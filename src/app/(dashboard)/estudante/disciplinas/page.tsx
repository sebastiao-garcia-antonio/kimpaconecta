import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AcademicRepository } from "@/features/academic/repositories/academic.repository";
import { PaginaSecao } from "@/components/pagina-seccao";
import { interpretarFiltroAnoAcademico, normalizarFiltroAnoAcademico, rotuloFiltroAnoAcademico } from "@/features/academic/utils/filtro-ano-academico";

type PageProps = {
  searchParams?: Promise<{
    ano?: string;
  }>;
};

export default async function PaginaDisciplinasEstudante({ searchParams }: PageProps) {
  const sessao = await auth();

  if (!sessao?.user) {
    redirect("/login");
  }

  const papeis = (sessao.user as any).roles || [];
  if (!papeis.includes("estudante")) {
    redirect("/login");
  }

  const idEstudante = Number(sessao.user.id);
  const parametros = (await (searchParams ?? Promise.resolve({}))) as { ano?: string };
  const filtroAno = interpretarFiltroAnoAcademico(parametros.ano);
  const contextoAcademico = await AcademicRepository.obterContextoAcademicoDoEstudante(idEstudante);
  const disciplinasTodas = await AcademicRepository.obterDisciplinasDoEstudante(idEstudante);
  const anoActual = contextoAcademico.anoActual;
  const anoEmVisualizacao = normalizarFiltroAnoAcademico(filtroAno, contextoAcademico.anosDisponiveis, anoActual);
  const disciplinas = filtroAno === "historico"
    ? disciplinasTodas
    : anoEmVisualizacao
      ? disciplinasTodas.filter((disciplina: any) => disciplina.anoCurricular === anoEmVisualizacao)
      : disciplinasTodas;

  const totalDisciplinas = disciplinas.length;
  const registosPresenca = disciplinas.filter((disciplina: any) => disciplina.totalPresencas > 0);
  const mediaPresenca = registosPresenca.length
    ? Math.round(registosPresenca.reduce((total: number, disciplina: any) => total + (disciplina.taxaPresenca || 0), 0) / registosPresenca.length)
    : null;
  const turmas = new Set(disciplinas.map((disciplina: any) => disciplina.nomeTurma)).size;
  const cursos = new Set(disciplinas.map((disciplina: any) => disciplina.nomeCurso)).size;

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <PaginaSecao
        papel="estudante"
        titulo="Disciplinas"
        descricao="Consulta das disciplinas matriculadas, horários e histórico de presença por turma."
        indicadores={[
          { titulo: "Disciplinas", valor: String(totalDisciplinas), observacao: "Matriculadas" },
          { titulo: "Presença média", valor: mediaPresenca === null ? "—" : `${mediaPresenca}%`, observacao: "Disciplinas com registos" },
          { titulo: "Turmas", valor: String(turmas), observacao: "Vínculos ativos" },
          { titulo: "Cursos", valor: String(cursos), observacao: "Cobertura académica" },
        ]}
        resumos={disciplinas.slice(0, 3).map((disciplina: any) => ({
          titulo: disciplina.nomeDisciplina,
          descricao: `${disciplina.nomeCurso} · ${disciplina.nomeTurma} · ${disciplina.anoCurricular}º ano · ${disciplina.periodo}`,
          estado: disciplina.totalPresencas > 0 ? `${disciplina.taxaPresenca}%` : "Sem registos",
        }))}
      />

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="font-bold text-lg text-slate-800">Detalhe das disciplinas</h3>
            <p className="text-sm text-slate-500">
              {filtroAno === "historico"
                ? "A visualizar todas as disciplinas de todos os anos."
                : `A visualizar ${rotuloFiltroAnoAcademico(filtroAno, anoActual)}.`}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-[720px] divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Disciplina</th>
                <th className="px-4 py-3">Curso</th>
                <th className="px-4 py-3">Turma</th>
                <th className="px-4 py-3">Semestre</th>
                <th className="px-4 py-3">Presença</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {disciplinas.map((disciplina: any) => (
                <tr key={disciplina.idDisciplina} className="text-sm text-slate-700">
                  <td className="px-4 py-3 font-semibold">{disciplina.nomeDisciplina}</td>
                  <td className="px-4 py-3">{disciplina.nomeCurso}</td>
                  <td className="px-4 py-3">
                    {disciplina.nomeTurma} · {disciplina.anoCurricular}º ano
                  </td>
                  <td className="px-4 py-3">{disciplina.semestre}º semestre</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${disciplina.totalPresencas > 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {disciplina.totalPresencas > 0 ? `${disciplina.taxaPresenca}%` : "—"}
                    </span>
                  </td>
                </tr>
              ))}
              {disciplinas.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                    Nenhuma disciplina encontrada para o estudante.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
