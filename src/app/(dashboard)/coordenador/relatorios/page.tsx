import { auth } from "@/lib/auth";
import { AnalyticsRepository } from "@/features/analytics/repositories/analytics.repository";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PaginaSecao } from "@/components/pagina-seccao";

export default async function PaginaRelatoriosCoordenador() {
  const sessao = await auth();

  if (!sessao?.user) {
    redirect("/login");
  }

  const papeis = (sessao.user as any).roles || [];
  if (!papeis.includes("coordenador") && !papeis.includes("admin")) {
    redirect("/login");
  }

  const resumo = await AnalyticsRepository.obterResumoAcademico();

  const candidaturasRecentes = await prisma.candidaturaOportunidade.findMany({
    include: {
      oportunidade: {
        include: {
          criador: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      },
      usuario: {
        select: {
          id: true,
          nome: true,
          email: true,
          numEstudanteLogin: true,
        },
      },
    },
    orderBy: { dataCandidatura: "desc" },
    take: 5,
  });

  const avaliacoesRecentes = await prisma.avaliacao.findMany({
    include: {
      disciplina: {
        include: {
          curso: true,
        },
      },
      tentativas: true,
    },
    orderBy: { dataInicio: "desc" },
    take: 5,
  });

  const presencasPorDisciplina = await prisma.presencaAula.groupBy({
    by: ["idDisciplina"],
    _count: {
      idPresenca: true,
    },
    orderBy: {
      idDisciplina: "asc",
    },
    take: 5,
  });

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="coordenador"
        titulo="Relatórios"
        descricao="Painel de métricas para acompanhar desempenho, retenção, presença e oportunidades."
        indicadores={[
          { titulo: "Cursos", valor: String(resumo.totalCursos), observacao: "Ativos" },
          { titulo: "Disciplinas", valor: String(resumo.totalDisciplinas), observacao: "Registadas" },
          { titulo: "Estudantes", valor: String(resumo.totalEstudantes), observacao: "Matriculados" },
          { titulo: "Presenças", valor: String(resumo.totalPresencas), observacao: "Registos lançados" },
        ]}
        resumos={resumo.desempenhoPorCurso.slice(0, 3).map((curso: any) => ({
          titulo: curso.nomeCurso,
          descricao: `${curso.totalDisciplinas} disciplina(s) · ${curso.totalTurmas} turma(s) · ${curso.totalEstudantes} estudante(s)`,
          estado: "Atualizado",
        }))}
      />

      <div className="px-6 lg:px-8 space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-lg text-slate-800 mb-5">Desempenho por curso</h3>
            <div className="space-y-3">
              {resumo.desempenhoPorCurso.map((curso: any) => (
                <div key={curso.idCurso} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-slate-800">{curso.nomeCurso}</h4>
                      <p className="text-sm text-slate-500">
                        {curso.totalDisciplinas} disciplina(s) · {curso.totalTurmas} turma(s)
                      </p>
                    </div>
                    <span className="rounded-full bg-brand-blue/10 px-2.5 py-1 text-xs font-semibold text-brand-blue">
                      {curso.totalEstudantes} estudante(s)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-lg text-slate-800 mb-5">Resumo executivo</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Avaliações</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-800">{resumo.totalAvaliacoes}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Oportunidades</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-800">{resumo.totalOportunidades}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Candidaturas</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-800">{resumo.totalCandidaturas}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Turmas</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-800">{resumo.totalTurmas}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-lg text-slate-800 mb-5">Candidaturas recentes</h3>
            <div className="space-y-3">
              {candidaturasRecentes.map((candidatura) => (
                <div key={candidatura.idCandidatura.toString()} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4">
                  <div>
                    <h4 className="font-semibold text-slate-800">{candidatura.usuario.nome}</h4>
                    <p className="text-sm text-slate-500">
                      {candidatura.oportunidade.titulo} · {candidatura.oportunidade.empresa || "Sem empresa"}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {candidatura.estado}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-lg text-slate-800 mb-5">Avaliações recentes</h3>
            <div className="space-y-3">
              {avaliacoesRecentes.map((avaliacao) => (
                <div key={avaliacao.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-slate-800">{avaliacao.titulo}</h4>
                      <p className="text-sm text-slate-500">
                        {avaliacao.disciplina.nomeDisciplina} · {avaliacao.disciplina.curso.nomeCurso}
                      </p>
                    </div>
                    <span className="rounded-full bg-brand-blue/10 px-2.5 py-1 text-xs font-semibold text-brand-blue">
                      {avaliacao.tentativas.length} tentativa(s)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-lg text-slate-800 mb-5">Presenças por disciplina</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
            {presencasPorDisciplina.map((item) => (
              <div key={item.idDisciplina} className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Disciplina {item.idDisciplina}</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-800">{item._count.idPresenca}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
