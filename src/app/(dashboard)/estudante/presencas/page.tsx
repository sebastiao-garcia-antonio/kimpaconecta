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

export default async function PaginaPresencasEstudante({ searchParams }: PageProps) {
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
  const presencas = await AcademicRepository.obterPresencasDoEstudante(idEstudante);

  const registros = filtroAno === "historico"
    ? presencas
    : presencas.filter((registo: any) => registo.anoCurricular === anoAtivo);

  const total = registros.length;
  const presentes = registros.filter((registo: any) => registo.presente).length;
  const ausentes = total - presentes;
  const taxaPresenca = total ? Math.round((presentes / total) * 100) : 0;

  const formatarData = (valor: string) =>
    new Intl.DateTimeFormat("pt-PT", {
      dateStyle: "medium"
    }).format(new Date(valor));

  const porDisciplina = Array.from(
    registros.reduce((mapa: Map<string, { total: number; presentes: number }>, registo: any) => {
      const chave = registo.nomeDisciplina || "Disciplina";
      const actual = mapa.get(chave) || { total: 0, presentes: 0 };
      actual.total += 1;
      if (registo.presente) {
        actual.presentes += 1;
      }
      mapa.set(chave, actual);
      return mapa;
    }, new Map<string, { total: number; presentes: number }>())
  ).map(([nomeDisciplina, valor]) => ({
    nomeDisciplina,
    taxa: valor.total ? Math.round((valor.presentes / valor.total) * 100) : 0,
    total: valor.total,
  }));

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="estudante"
        titulo="Presenças"
        descricao="Acompanha o registo de presenças por disciplina e ano lectivo."
        indicadores={[
          { titulo: "Registos", valor: String(total), observacao: "Disponíveis" },
          { titulo: "Presentes", valor: String(presentes), observacao: "Marcados como presentes" },
          { titulo: "Ausentes", valor: String(ausentes), observacao: "Marcados como ausentes" },
          { titulo: "Taxa", valor: `${taxaPresenca}%`, observacao: "Presença geral" },
        ]}
        resumos={registros.slice(0, 3).map((registo: any) => ({
          titulo: registo.nomeDisciplina || "Disciplina",
          descricao: `${registo.nomeCurso || "Curso"} · ${registo.nomeTurma || "Turma"} · ${registo.anoLectivo}º ano lectivo`,
          estado: registo.presente ? "Presente" : "Ausente",
        }))}
      />

      <div className="px-6 lg:px-8 pb-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          {filtroAno === "historico"
            ? "A visualizar presenças de todos os anos."
            : `A visualizar ${rotuloFiltroAnoAcademico(anoAtivo, contextoAcademico.anoActual)}.`}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            { titulo: "Taxa de presença", valor: `${taxaPresenca}%`, detalhe: "Presença acumulada no ano" },
            { titulo: "Presentes", valor: String(presentes), detalhe: "Aulas assistidas" },
            { titulo: "Ausentes", valor: String(ausentes), detalhe: "Faltas registadas" },
            { titulo: "Registos", valor: String(total), detalhe: "Total de lançamentos" },
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
                <h3 className="font-bold text-lg text-slate-800">Presença por disciplina</h3>
                <p className="text-sm text-slate-500">Vista resumida do comportamento em cada cadeira.</p>
              </div>
            </div>

            <div className="space-y-4">
              {porDisciplina.map((item) => (
                <div key={item.nomeDisciplina} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-800">{item.nomeDisciplina}</p>
                      <p className="text-sm text-slate-500">{item.total} registos</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        item.taxa >= 75 ? "bg-emerald-100 text-emerald-700" : item.taxa >= 50 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {item.taxa}%
                    </span>
                  </div>
                  <div className="mt-3 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.taxa >= 75
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                          : item.taxa >= 50
                            ? "bg-gradient-to-r from-amber-500 to-amber-400"
                            : "bg-gradient-to-r from-rose-500 to-rose-400"
                      }`}
                      style={{ width: `${item.taxa}%` }}
                    />
                  </div>
                </div>
              ))}
              {porDisciplina.length === 0 && (
                <p className="text-sm text-slate-500">Não há dados suficientes para resumir por disciplina.</p>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Registo de presenças</h3>
                <p className="text-sm text-slate-500">Aulas assistidas e faltas por disciplina.</p>
              </div>
            </div>

            <div className="space-y-3">
              {registros.map((registo: any) => (
                <div
                  key={String(registo.idPresenca)}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-slate-200 p-4"
                >
                  <div>
                    <h4 className="font-semibold text-slate-800">{registo.nomeDisciplina}</h4>
                    <p className="text-sm text-slate-500">
                      {registo.nomeCurso} · {registo.nomeTurma} · {registo.anoLectivo}º ano lectivo · {formatarData(registo.dataAula)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                        registo.presente ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {registo.presente ? "Presente" : "Ausente"}
                    </span>
                    {registo.observacao && (
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {registo.observacao}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {registros.length === 0 && (
                <p className="text-sm text-slate-500">Não existem presenças para o ano seleccionado.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
