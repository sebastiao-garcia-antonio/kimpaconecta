import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { EstadoVazio } from "@/components/estado-vazio";
import { PaginaSecao } from "@/components/pagina-seccao";

type PropriedadesPagina = {
  searchParams?: Promise<{
    pesquisa?: string;
    unidade?: string;
  }>;
};

export default async function PaginaCursosCoordenador({ searchParams }: PropriedadesPagina) {
  const sessao = await auth();

  if (!sessao?.user) {
    redirect("/login");
  }

  const papeis = (sessao.user as any).roles || [];
  if (!papeis.includes("coordenador") && !papeis.includes("admin")) {
    redirect("/login");
  }

  const parametros = (await (searchParams ?? Promise.resolve({}))) as {
    pesquisa?: string;
    unidade?: string;
  };
  const idCoordenador = Number(sessao.user.id);
  const administrador = papeis.includes("admin");
  const pesquisa = String(parametros.pesquisa || "").trim().toLowerCase();
  const unidadeSelecionada = String(parametros.unidade || "");

  const cursos = await prisma.curso.findMany({
    where: administrador ? {} : { idCoordenador },
    include: {
      unidade: true,
      coordenador: {
        select: {
          nome: true,
        },
      },
      disciplinas: {
        orderBy: { semestre: "asc" },
      },
      turmas: {
        include: {
          matriculas: true,
        },
      },
    },
    orderBy: { nomeCurso: "asc" },
  });

  const unidades = Array.from(new Map(cursos.map((curso) => [curso.unidade.id, curso.unidade])).values())
    .sort((primeira, segunda) => primeira.nomeUo.localeCompare(segunda.nomeUo));
  const cursosFiltrados = cursos.filter((curso) => {
    const textoPesquisavel = `${curso.nomeCurso} ${curso.unidade.nomeUo} ${curso.unidade.sigla}`.toLowerCase();
    return textoPesquisavel.includes(pesquisa) && (!unidadeSelecionada || String(curso.idUo) === unidadeSelecionada);
  });

  const totalDisciplinas = cursosFiltrados.reduce((total, curso) => total + curso.disciplinas.length, 0);
  const totalTurmas = cursosFiltrados.reduce((total, curso) => total + curso.turmas.length, 0);
  const totalEstudantes = cursosFiltrados.reduce(
    (total, curso) => total + curso.turmas.reduce((subtotal, turma) => subtotal + turma.matriculas.length, 0),
    0
  );

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="coordenador"
        titulo="Cursos"
        descricao="Consulta os cursos sob a tua coordenação, a respetiva estrutura curricular e a distribuição de estudantes."
        indicadores={[
          { titulo: "Cursos", valor: String(cursosFiltrados.length), observacao: "No contexto actual" },
          { titulo: "Disciplinas", valor: String(totalDisciplinas), observacao: "Estrutura curricular" },
          { titulo: "Turmas", valor: String(totalTurmas), observacao: "Organizadas por curso" },
          { titulo: "Estudantes", valor: String(totalEstudantes), observacao: "Matrículas activas" },
        ]}
        resumos={cursosFiltrados.slice(0, 3).map((curso) => ({
          titulo: curso.nomeCurso,
          descricao: `${curso.unidade.nomeUo} · ${curso.disciplinas.length} disciplina(s) · ${curso.turmas.length} turma(s)`,
          estado: curso.coordenador?.nome ? "Coordenado" : "Sem coordenador",
        }))}
      />

      <div className="space-y-6 px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <form className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_260px_auto]" method="get">
            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Pesquisar curso</span>
              <input
                name="pesquisa"
                defaultValue={parametros.pesquisa || ""}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                placeholder="Nome do curso, unidade ou sigla"
              />
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Unidade orgânica</span>
              <select
                name="unidade"
                defaultValue={parametros.unidade || ""}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              >
                <option value="">Todas</option>
                {unidades.map((unidade) => (
                  <option key={unidade.id} value={unidade.id}>{unidade.nomeUo}</option>
                ))}
              </select>
            </label>

            <div className="flex items-end">
              <button
                type="submit"
                className="h-[42px] rounded-full bg-brand-blue px-4 text-sm font-semibold text-white transition hover:bg-brand-blue-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
              >
                Filtrar
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h3 className="text-lg font-bold text-slate-800">Lista de cursos</h3>
            <p className="text-sm text-slate-500">Visão consolidada por curso, unidade orgânica e turmas associadas.</p>
          </div>

          {cursosFiltrados.length === 0 ? (
            <EstadoVazio
              titulo="Sem cursos para apresentar"
              descricao="Ajusta os filtros ou aguarda a associação de cursos ao teu perfil de coordenação."
            />
          ) : (
            <div className="space-y-4">
              {cursosFiltrados.map((curso) => {
                const totalMatriculas = curso.turmas.reduce((total, turma) => total + turma.matriculas.length, 0);

                return (
                  <article key={curso.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:bg-white hover:shadow-sm">
                    <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-800">{curso.nomeCurso}</h4>
                        <p className="text-sm text-slate-500">
                          {curso.unidade.nomeUo} · {curso.unidade.sigla} · {curso.disciplinas.length} disciplina(s) · {curso.turmas.length} turma(s)
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-brand-blue/10 px-2.5 py-1 text-xs font-semibold text-brand-blue">{totalMatriculas} matrícula(s)</span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${curso.coordenador?.nome ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {curso.coordenador?.nome || "Sem coordenador"}
                        </span>
                      </div>
                    </div>

                    {curso.disciplinas.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {curso.disciplinas.map((disciplina) => (
                          <div key={disciplina.id} className="rounded-xl border border-slate-100 bg-white p-4">
                            <p className="font-semibold text-slate-800">{disciplina.nomeDisciplina}</p>
                            <p className="mt-1 text-xs text-slate-500">Semestre {disciplina.semestre}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">Ainda não existem disciplinas associadas a este curso.</p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
