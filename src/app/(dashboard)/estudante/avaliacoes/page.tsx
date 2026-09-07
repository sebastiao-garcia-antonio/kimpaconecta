import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PaginaSecao } from "@/components/pagina-seccao";
import { AcademicRepository } from "@/features/academic/repositories/academic.repository";
import { interpretarFiltroAnoAcademico, normalizarFiltroAnoAcademico, rotuloFiltroAnoAcademico } from "@/features/academic/utils/filtro-ano-academico";

type PageProps = {
  searchParams?: Promise<{
    pesquisa?: string;
    estado?: string;
    ano?: string;
  }>;
};

export default async function PaginaAvaliacoesEstudante({ searchParams }: PageProps) {
  const sessao = await auth();

  if (!sessao?.user) {
    redirect("/login");
  }

  const papeis = (sessao.user as any).roles || [];
  if (!papeis.includes("estudante")) {
    redirect("/login");
  }

  const idEstudante = Number(sessao.user.id);
  const parametros = (await (searchParams ?? Promise.resolve({}))) as {
    pesquisa?: string;
    estado?: string;
    ano?: string;
  };
  const pesquisa = String(parametros.pesquisa || "").trim().toLowerCase();
  const estadoFiltro = String(parametros.estado || "");
  const filtroAno = interpretarFiltroAnoAcademico(parametros.ano);
  const contextoAcademico = await AcademicRepository.obterContextoAcademicoDoEstudante(idEstudante);
  const anoActual = contextoAcademico.anoActual;
  const anoEmVisualizacao = normalizarFiltroAnoAcademico(filtroAno, contextoAcademico.anosDisponiveis, anoActual);

  const matriculas = await prisma.matricula.findMany({
    where: { idUsuario: idEstudante },
    include: {
      turma: {
        include: {
          curso: {
            include: {
              disciplinas: {
                include: {
                  avaliacoes: {
                    include: {
                      disciplina: true,
                      tentativas: {
                        where: { idEstudante },
                        orderBy: { inicioEm: "desc" },
                        take: 1,
                      },
                    },
                    orderBy: { dataInicio: "desc" },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const avaliacoesMap = new Map<number, any>();

  for (const matricula of matriculas) {
    const curso = matricula.turma?.curso;
    if (!curso) continue;

    for (const disciplina of curso.disciplinas || []) {
      for (const avaliacao of disciplina.avaliacoes || []) {
        const tentativaAtual = avaliacao.tentativas?.[0] || null;
        const estadoAtual = tentativaAtual
          ? tentativaAtual.statusTentativa === "submetida"
            ? "submetida"
            : tentativaAtual.statusTentativa === "bloqueada"
              ? "bloqueada"
              : "em_curso"
          : "pendente";

        avaliacoesMap.set(avaliacao.id, {
          id: avaliacao.id,
          titulo: avaliacao.titulo,
          nomeDisciplina: disciplina.nomeDisciplina,
          nomeCurso: curso.nomeCurso,
          anoCurricular: matricula.turma?.anoCurricular,
          dataInicio: avaliacao.dataInicio,
          dataFim: avaliacao.dataFim,
          duracaoMinutos: avaliacao.duracaoMinutos,
          notaMaxima: String(avaliacao.notaMaxima),
          estadoAtual,
          tentativaAtual,
        });
      }
    }
  }

  let avaliacoes = Array.from(avaliacoesMap.values());

  if (pesquisa) {
    avaliacoes = avaliacoes.filter((avaliacao) =>
      `${avaliacao.titulo} ${avaliacao.nomeDisciplina} ${avaliacao.nomeCurso}`.toLowerCase().includes(pesquisa)
    );
  }

  if (estadoFiltro) {
    avaliacoes = avaliacoes.filter((avaliacao) => avaliacao.estadoAtual === estadoFiltro);
  }

  if (filtroAno !== "historico" && anoEmVisualizacao && typeof anoEmVisualizacao === "number") {
    avaliacoes = avaliacoes.filter((avaliacao) => avaliacao.anoCurricular === anoEmVisualizacao);
  }

  const pendentes = avaliacoes.filter((avaliacao) => avaliacao.estadoAtual === "pendente").length;
  const submetidas = avaliacoes.filter((avaliacao) => avaliacao.estadoAtual === "submetida").length;
  const emCurso = avaliacoes.filter((avaliacao) => avaliacao.estadoAtual === "em_curso").length;
  const mediaNotas = avaliacoes.length
    ? Math.round(
        avaliacoes.reduce((total, avaliacao) => {
          const nota = avaliacao.tentativaAtual?.notaObtida ? Number(avaliacao.tentativaAtual.notaObtida) : 0;
          return total + nota;
        }, 0) / avaliacoes.length
      )
    : 0;

  const formatarData = (valor?: Date | string | null) =>
    valor
      ? new Intl.DateTimeFormat("pt-PT", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(valor))
      : "Sem data";

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="estudante"
        titulo="Avaliações"
        descricao="Acesso a exames, trabalhos e histórico de submissões por disciplina."
        indicadores={[
          { titulo: "Pendentes", valor: String(pendentes), observacao: "Aguardando abertura" },
          { titulo: "Em curso", valor: String(emCurso), observacao: "Avaliações activas" },
          { titulo: "Submetidas", valor: String(submetidas), observacao: "Entregues" },
          { titulo: "Média", valor: String(mediaNotas), observacao: "Da submissão atual" },
        ]}
        resumos={avaliacoes.slice(0, 3).map((avaliacao) => ({
          titulo: avaliacao.titulo,
          descricao: `${avaliacao.nomeDisciplina} · ${avaliacao.nomeCurso} · ${avaliacao.duracaoMinutos} minutos`,
          estado: avaliacao.estadoAtual === "submetida" ? "Submetida" : avaliacao.estadoAtual === "em_curso" ? "Em curso" : "Pendente",
        }))}
      />

      <div className="px-6 lg:px-8 pb-8 space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {filtroAno === "historico"
                ? "A visualizar avaliações de todos os anos."
                : `A visualizar ${rotuloFiltroAnoAcademico(filtroAno, anoActual)}.`}
            </div>
            <div className="text-xs font-semibold text-slate-400">
              {avaliacoes.length} avaliação(ões) depois dos filtros
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            { titulo: "Avaliações filtradas", valor: String(avaliacoes.length), detalhe: "Resultado da pesquisa actual" },
            { titulo: "Em curso", valor: String(emCurso), detalhe: "Podem ser abertas agora" },
            { titulo: "Submetidas", valor: String(submetidas), detalhe: "Já entregues" },
            { titulo: "Média", valor: String(mediaNotas), detalhe: "Última tentativa visível" },
          ].map((cartao) => (
            <div key={cartao.titulo} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{cartao.titulo}</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-800">{cartao.valor}</p>
              <p className="mt-1 text-sm text-slate-500">{cartao.detalhe}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm h-fit">
            <h3 className="font-bold text-lg text-slate-800">Filtrar avaliações</h3>
            <p className="text-sm text-slate-500 mt-1">Mantém o ano seleccionado e ajusta pesquisa/estado.</p>

            <form className="mt-5 space-y-4" method="get">
              <input type="hidden" name="ano" value={parametros.ano || "actual"} />
              <label className="space-y-2 text-sm font-semibold text-slate-700 block">
                <span>Pesquisar avaliação</span>
                <input
                  name="pesquisa"
                  defaultValue={parametros.pesquisa || ""}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
                  placeholder="Título, disciplina ou curso"
                />
              </label>

              <label className="space-y-2 text-sm font-semibold text-slate-700 block">
                <span>Estado</span>
                <select
                  name="estado"
                  defaultValue={parametros.estado || ""}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
                >
                  <option value="">Todos</option>
                  <option value="pendente">Pendente</option>
                  <option value="em_curso">Em curso</option>
                  <option value="submetida">Submetida</option>
                  <option value="bloqueada">Bloqueada</option>
                </select>
              </label>

              <button
                type="submit"
                className="w-full rounded-2xl bg-brand-blue px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-blue/20 transition hover:bg-brand-blue/90"
              >
                Aplicar filtros
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">Visão geral das avaliações</h3>
                  <p className="text-sm text-slate-500">Resumo rápido do que está disponível para este contexto.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { titulo: "Pendente", valor: pendentes, cor: "bg-amber-50 text-amber-700" },
                  { titulo: "Em curso", valor: emCurso, cor: "bg-brand-blue/10 text-brand-blue" },
                  { titulo: "Submetidas", valor: submetidas, cor: "bg-emerald-50 text-emerald-700" },
                ].map((item) => (
                  <div key={item.titulo} className={`rounded-2xl p-4 ${item.cor}`}>
                    <p className="text-xs font-bold uppercase tracking-wider">{item.titulo}</p>
                    <p className="mt-2 text-3xl font-extrabold">{item.valor}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">Histórico de avaliações</h3>
                  <p className="text-sm text-slate-500">Lista das avaliações associadas às disciplinas matriculadas.</p>
                </div>
              </div>

              <div className="space-y-4">
                {avaliacoes.map((avaliacao) => (
                  <div key={avaliacao.id} className="rounded-2xl border border-slate-200 p-4 transition hover:shadow-md">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-slate-800">{avaliacao.titulo}</h4>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            {avaliacao.estadoAtual === "submetida"
                              ? "Submetida"
                              : avaliacao.estadoAtual === "em_curso"
                                ? "Em curso"
                                : avaliacao.estadoAtual === "bloqueada"
                                  ? "Bloqueada"
                                  : "Pendente"}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">
                          {avaliacao.nomeDisciplina} · {avaliacao.nomeCurso} · {avaliacao.duracaoMinutos} minutos · nota máxima {avaliacao.notaMaxima}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                          <span className="rounded-full bg-slate-50 px-2.5 py-1">Início: {formatarData(avaliacao.dataInicio)}</span>
                          <span className="rounded-full bg-slate-50 px-2.5 py-1">Fim: {formatarData(avaliacao.dataFim)}</span>
                          <span className="rounded-full bg-slate-50 px-2.5 py-1">{avaliacao.anoCurricular}º ano</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-start gap-2 lg:items-end">
                        {avaliacao.tentativaAtual?.notaObtida && (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                            Nota {String(avaliacao.tentativaAtual.notaObtida)}
                          </span>
                        )}
                        {avaliacao.tentativaAtual?.submetidoEm && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            Submetida em {formatarData(avaliacao.tentativaAtual.submetidoEm)}
                          </span>
                        )}
                        <Link href={`/estudante/avaliacoes/${avaliacao.id}`} className="rounded-full bg-brand-blue/10 px-3 py-1.5 text-xs font-semibold text-brand-blue transition hover:bg-brand-blue hover:text-white">Abrir avaliação</Link>
                      </div>
                    </div>
                  </div>
                ))}
                {avaliacoes.length === 0 && (
                  <p className="text-sm text-slate-500">Não existem avaliações para os filtros escolhidos.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

