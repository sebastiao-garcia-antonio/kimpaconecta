import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PaginaSecao } from "@/components/pagina-seccao";
import { GerenciadorDisciplinasCoordenador } from "@/features/academic-management/components/gerenciador-disciplinas-coordenador";

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
    select: {
      id: true,
      nomeCurso: true,
    },
    orderBy: { nomeCurso: "asc" },
  });

  const idsCursos = cursos.map((c) => c.id);

  // Disciplinas associadas aos cursos do coordenador
  const disciplinas = await prisma.disciplina.findMany({
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
          avaliacoes: true,
          materiais: true,
        },
      },
    },
    orderBy: [
      { semestre: "asc" },
      { nomeDisciplina: "asc" },
    ],
  });

  const semestresDistintos = new Set(disciplinas.map((d) => d.semestre));

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="coordenador"
        titulo="Disciplinas Curriculares"
        descricao="Gestão do plano de estudos e disciplinas curriculares dos cursos sob a sua coordenação."
        indicadores={[
          { titulo: "Disciplinas", valor: String(disciplinas.length), observacao: "No currículo" },
          { titulo: "Cursos", valor: String(cursos.length), observacao: "Sob coordenação" },
          { titulo: "Semestres", valor: String(semestresDistintos.size), observacao: "Cobertura" },
          { titulo: "Média/Semestre", valor: semestresDistintos.size > 0 ? (disciplinas.length / semestresDistintos.size).toFixed(1) : "0", observacao: "Disciplinas" },
        ]}
        resumos={disciplinas.slice(0, 3).map((disciplina) => ({
          titulo: `${disciplina.nomeDisciplina} · ${disciplina.curso.nomeCurso}`,
          descricao: `Semestre ${disciplina.semestre} · ${disciplina._count?.avaliacoes || 0} avaliação(ões) · ${disciplina._count?.materiais || 0} material(is)`,
          estado: "Activa",
        }))}
      />

      <div className="px-6 pb-8 lg:px-8">
        <GerenciadorDisciplinasCoordenador
          cursos={cursos}
          disciplinas={disciplinas}
        />
      </div>
    </div>
  );
}
