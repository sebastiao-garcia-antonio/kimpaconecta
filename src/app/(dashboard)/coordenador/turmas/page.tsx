import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { EstadoVazio } from "@/components/estado-vazio";
import { PaginaSecao } from "@/components/pagina-seccao";
import { FormularioTurmaClient } from "@/features/academic-management/components/formulario-turma-client";

export default async function PaginaTurmasCoordenador() {
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
    select: { id: true, nomeCurso: true },
    orderBy: { nomeCurso: "asc" },
  });
  const turmas = await prisma.turma.findMany({
    where: administrador ? {} : { curso: { idCoordenador } },
    include: {
      curso: {
        include: {
          unidade: true,
        },
      },
      matriculas: {
        select: {
          id: true,
          isMentor: true,
        },
      },
    },
    orderBy: [
      { anoCurricular: "asc" },
      { nomeTurma: "asc" },
    ],
  });

  const anosCurriculares = new Set(turmas.map((turma) => turma.anoCurricular));
  const totalEstudantes = turmas.reduce((total, turma) => total + turma.matriculas.length, 0);
  const totalMentores = turmas.reduce(
    (total, turma) => total + turma.matriculas.filter((matricula) => matricula.isMentor).length,
    0
  );

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="coordenador"
        titulo="Turmas"
        descricao="Acompanha turmas, estudantes matriculados e a distribuição académica do curso sob a tua coordenação."
        indicadores={[
          { titulo: "Turmas", valor: String(turmas.length), observacao: "Disponíveis" },
          { titulo: "Anos", valor: String(anosCurriculares.size), observacao: "Cobertura curricular" },
          { titulo: "Estudantes", valor: String(totalEstudantes), observacao: "Matrículas activas" },
          { titulo: "Mentores", valor: String(totalMentores), observacao: "Apoio entre pares" },
        ]}
        resumos={turmas.slice(0, 3).map((turma) => ({
          titulo: turma.nomeTurma,
          descricao: `${turma.curso.nomeCurso} · ${turma.anoCurricular}º ano · ${turma.periodo}`,
          estado: `${turma.matriculas.length} estudante(s)`,
        }))}
      />

      <div className="space-y-6 px-6 pb-8 lg:px-8">
        <FormularioTurmaClient cursos={cursos} turmas={turmas.map((turma) => ({ id: turma.id, idCurso: turma.idCurso, nomeTurma: turma.nomeTurma, anoCurricular: turma.anoCurricular, periodo: turma.periodo }))} />
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h3 className="text-lg font-bold text-slate-800">Mapa de turmas</h3>
            <p className="text-sm text-slate-500">Informação actualizada a partir das matrículas registadas na plataforma.</p>
          </div>

          {turmas.length === 0 ? (
            <EstadoVazio
              titulo="Ainda não existem turmas associadas"
              descricao="As turmas atribuídas aos cursos sob a tua coordenação serão apresentadas aqui."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {turmas.map((turma) => {
                const mentores = turma.matriculas.filter((matricula) => matricula.isMentor).length;

                return (
                  <article key={turma.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:bg-white hover:shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-slate-800">{turma.nomeTurma}</h4>
                        <p className="mt-1 text-sm text-slate-500">{turma.curso.nomeCurso}</p>
                      </div>
                      <span className="rounded-full bg-brand-blue/10 px-2.5 py-1 text-xs font-semibold text-brand-blue">
                        {turma.anoCurricular}º ano
                      </span>
                    </div>

                    <p className="mt-4 text-sm text-slate-600">
                      {turma.curso.unidade.nomeUo} · {turma.periodo}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                      <span className="rounded-full bg-slate-200 px-2.5 py-1 text-slate-600">{turma.matriculas.length} estudante(s)</span>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">{mentores} mentor(es)</span>
                    </div>
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
