import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PaginaSecao } from "@/components/pagina-seccao";
import { AcademicRepository } from "@/features/academic/repositories/academic.repository";
import {
  interpretarFiltroAnoAcademico,
  normalizarFiltroAnoAcademico,
  rotuloFiltroAnoAcademico,
} from "@/features/academic/utils/filtro-ano-academico";

type PageProps = {
  searchParams?: Promise<{
    ano?: string;
  }>;
};

export default async function PaginaNotasEstudante({ searchParams }: PageProps) {
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
  const anoAtivo = normalizarFiltroAnoAcademico(
    filtroAno,
    contextoAcademico.anosDisponiveis,
    contextoAcademico.anoActual
  );
  const historico = await AcademicRepository.obterHistoricoAcademicoDoEstudante(idEstudante);

  const registros = filtroAno === "historico"
    ? historico
    : historico.filter((registo: any) => registo.anoLectivo === anoAtivo);

  const totalRegistos = registros.length;
  const aprovados = registros.filter((registo: any) => String(registo.resultado).toLowerCase() === "aprovado").length;
  const reprovados = registros.filter((registo: any) => String(registo.resultado).toLowerCase() === "reprovado").length;
  const media = totalRegistos
    ? Math.round(
        registros.reduce((total: number, registo: any) => total + Number(registo.notaFinal || 0), 0) / totalRegistos
      )
    : 0;
  const melhorNota = totalRegistos ? Math.max(...registros.map((registo: any) => Number(registo.notaFinal || 0))) : 0;
  const menorNota = totalRegistos ? Math.min(...registros.map((registo: any) => Number(registo.notaFinal || 0))) : 0;
  const taxaAprovacao = totalRegistos ? Math.round((aprovados / totalRegistos) * 100) : 0;
  const notaMaximaVisual = 20;

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="estudante"
        titulo="Notas e Pautas"
        descricao="Consulta as classificações finais e o histórico académico por ano lectivo."
        indicadores={[
          { titulo: "Registos", valor: String(totalRegistos), observacao: "Disponíveis" },
          { titulo: "Aprovados", valor: String(aprovados), observacao: "Resultados positivos" },
          { titulo: "Reprovados", valor: String(reprovados), observacao: "A rever" },
          { titulo: "Média", valor: String(media), observacao: "Classificação final" },
        ]}
        resumos={registros.slice(0, 3).map((registo: any) => ({
          titulo: registo.disciplina?.nomeDisciplina || "Disciplina",
          descricao: `${registo.disciplina?.curso?.nomeCurso || "Curso"} · ${registo.anoLectivo}º ano lectivo`,
          estado: String(registo.resultado || "Sem resultado"),
        }))}
      />

      <div className="px-6 lg:px-8 pb-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          {filtroAno === "historico"
            ? "A visualizar pautas de todos os anos."
            : `A visualizar ${rotuloFiltroAnoAcademico(anoAtivo, contextoAcademico.anoActual)}.`}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            { titulo: "Taxa de aprovação", valor: `${taxaAprovacao}%`, detalhe: "Percentagem de registos aprovados" },
            { titulo: "Média geral", valor: String(media), detalhe: "Média arredondada das notas" },
            { titulo: "Melhor nota", valor: melhorNota.toFixed(2), detalhe: "Maior classificação registada" },
            { titulo: "Menor nota", valor: menorNota.toFixed(2), detalhe: "Classificação mais baixa" },
          ].map((cartao) => (
            <div key={cartao.titulo} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{cartao.titulo}</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-800">{cartao.valor}</p>
              <p className="mt-1 text-sm text-slate-500">{cartao.detalhe}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Desempenho por disciplina</h3>
                <p className="text-sm text-slate-500">Uma leitura rápida das melhores e piores notas.</p>
              </div>
            </div>

            <div className="space-y-4">
              {registros.map((registo: any) => {
                const nota = Number(registo.notaFinal || 0);
                const percentual = Math.min(100, Math.round((nota / notaMaximaVisual) * 100));

                return (
                  <div key={`desempenho-${String(registo.idHistorico)}`} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-800">{registo.disciplina?.nomeDisciplina}</p>
                        <p className="text-sm text-slate-500">{registo.disciplina?.curso?.nomeCurso}</p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          percentual >= 50 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {nota.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-3 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          percentual >= 50
                            ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                            : "bg-gradient-to-r from-rose-500 to-rose-400"
                        }`}
                        style={{ width: `${percentual}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {registros.length === 0 && (
                <p className="text-sm text-slate-500">Não há dados suficientes para mostrar o desempenho.</p>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Pautas académicas</h3>
                <p className="text-sm text-slate-500">Notas finais por disciplina e ano lectivo.</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-[760px] divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">Disciplina</th>
                    <th className="px-4 py-3">Curso</th>
                    <th className="px-4 py-3">Ano lectivo</th>
                    <th className="px-4 py-3">Nota final</th>
                    <th className="px-4 py-3">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {registros.map((registo: any) => (
                    <tr key={String(registo.idHistorico)} className="text-sm text-slate-700">
                      <td className="px-4 py-3 font-semibold">{registo.disciplina?.nomeDisciplina}</td>
                      <td className="px-4 py-3">{registo.disciplina?.curso?.nomeCurso}</td>
                      <td className="px-4 py-3">{registo.anoLectivo}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-brand-blue/10 px-2.5 py-1 text-xs font-bold text-brand-blue">
                          {Number(registo.notaFinal).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                            String(registo.resultado).toLowerCase() === "aprovado"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {registo.resultado}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {registros.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                        Não existem pautas para o ano seleccionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
