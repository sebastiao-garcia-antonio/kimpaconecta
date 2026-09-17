import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PaginaSecao } from "@/components/pagina-seccao";
import { GerenciadorTurmasCoordenador } from "@/features/academic-management/components/gerenciador-turmas-coordenador";

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

  // Cursos sob a coordenação do utilizador (ou todos se admin)
  const cursos = await prisma.curso.findMany({
    where: administrador
      ? {}
      : {
          OR: [
            { idCoordenador },
            { usuarios: { some: { idUsuario: idCoordenador } } },
          ],
        },
    select: { id: true, nomeCurso: true },
    orderBy: { nomeCurso: "asc" },
  });

  const idsCursos = cursos.map((c) => c.id);

  // Turmas dos cursos do coordenador
  const turmas = await prisma.turma.findMany({
    where: administrador
      ? {}
      : {
          idCurso: { in: idsCursos },
        },
    include: {
      curso: {
        select: {
          id: true,
          nomeCurso: true,
        },
      },
      _count: {
        select: {
          matriculas: true,
        },
      },
    },
    orderBy: [
      { anoCurricular: "asc" },
      { nomeTurma: "asc" },
    ],
  });

  const anosCurriculares = new Set(turmas.map((turma) => turma.anoCurricular));
  const totalEstudantes = turmas.reduce((total, turma) => total + (turma._count?.matriculas || 0), 0);

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="coordenador"
        titulo="Turmas do Curso"
        descricao="Gestão de turmas curriculares, anos lectivos e turnos sob a coordenação dos seus cursos."
        indicadores={[
          { titulo: "Turmas", valor: String(turmas.length), observacao: "Em funcionamento" },
          { titulo: "Cursos", valor: String(cursos.length), observacao: "Sob coordenação" },
          { titulo: "Anos Curriculares", valor: String(anosCurriculares.size), observacao: "Cobertura" },
          { titulo: "Estudantes", valor: String(totalEstudantes), observacao: "Matrículas registadas" },
        ]}
        resumos={turmas.slice(0, 3).map((turma) => ({
          titulo: turma.nomeTurma,
          descricao: `${turma.curso.nomeCurso} · ${turma.anoCurricular}º ano · ${turma.periodo}`,
          estado: `${turma._count?.matriculas || 0} estudante(s)`,
        }))}
      />

      <div className="px-6 pb-8 lg:px-8">
        <GerenciadorTurmasCoordenador
          cursos={cursos}
          turmas={turmas}
        />
      </div>
    </div>
  );
}
