import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { EstadoVazio } from "@/components/estado-vazio";
import { PaginaSecao } from "@/components/pagina-seccao";
import { FormularioDisciplinaClient } from "@/features/academic-management/components/formulario-disciplina-client";

export default async function PaginaDisciplinasCoordenador() {
  const sessao = await auth();

  if (!sessao?.user) {
    redirect("/login");
  }

  const papeis = (sessao.user as any).roles || [];
  if (!papeis.includes("coordenador") && !papeis.includes("admin")) {
    redirect("/login");
  }

  const idCoordenador = Number(sessao.user.id);
  const administrador = papeis.includes("admin");
  const cursos = await prisma.curso.findMany({
    where: administrador ? {} : { idCoordenador },
    include: {
      unidade: true,
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

  const disciplinasParaGestao = cursos.flatMap((curso) => curso.disciplinas.map((disciplina) => ({ ...disciplina, idCurso: curso.id })));

  const totalDisciplinas = cursos.reduce((total, curso) => total + curso.disciplinas.length, 0);
  const totalTurmas = cursos.reduce((total, curso) => total + curso.turmas.length, 0);
  const totalEstudantes = cursos.reduce(
    (total, curso) => total + curso.turmas.reduce((subtotal, turma) => subtotal + turma.matriculas.length, 0),
    0
  );

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="coordenador"
        titulo="Disciplinas"
        descricao="Consulta a organização curricular e as disciplinas associadas aos cursos sob a tua coordenação."
        indicadores={[
          { titulo: "Cursos", valor: String(cursos.length), observacao: "Sob coordenação" },
          { titulo: "Disciplinas", valor: String(totalDisciplinas), observacao: "Distribuídas por curso" },
          { titulo: "Turmas", valor: String(totalTurmas), observacao: "Estrutura activa" },
          { titulo: "Estudantes", valor: String(totalEstudantes), observacao: "Matrículas registadas" },
        ]}
        resumos={cursos.slice(0, 3).flatMap((curso) =>
          curso.disciplinas.slice(0, 1).map((disciplina) => ({
            titulo: `${disciplina.nomeDisciplina} · ${curso.nomeCurso}`,
            descricao: `${curso.unidade.nomeUo} · Semestre ${disciplina.semestre} · ${curso.turmas.length} turma(s)`,
            estado: "Activa",
          }))
        )}
      />

      <div className="space-y-6 px-6 lg:px-8">
        <FormularioDisciplinaClient cursos={cursos.map((curso) => ({ id: curso.id, nomeCurso: curso.nomeCurso }))} disciplinas={disciplinasParaGestao} />
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h3 className="text-lg font-bold text-slate-800">Disciplinas por curso</h3>
            <p className="text-sm text-slate-500">Visão detalhada por curso, unidade orgânica e número de turmas.</p>
          </div>

          {cursos.length === 0 ? (
            <EstadoVazio
              titulo="Sem cursos associados"
              descricao="Quando um curso for associado ao teu perfil de coordenação, a estrutura curricular aparecerá aqui."
            />
          ) : (
            <div className="space-y-4">
              {cursos.map((curso) => (
                <article key={curso.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:bg-white hover:shadow-sm">
                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-800">{curso.nomeCurso}</h4>
                      <p className="text-sm text-slate-500">
                        {curso.unidade.nomeUo} · {curso.turmas.length} turma(s) · {curso.disciplinas.length} disciplina(s)
                      </p>
                    </div>
                    <span className="rounded-full bg-brand-blue/10 px-2.5 py-1 text-xs font-semibold text-brand-blue">{curso.unidade.sigla}</span>
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
                    <p className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">Este curso ainda não tem disciplinas configuradas.</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
