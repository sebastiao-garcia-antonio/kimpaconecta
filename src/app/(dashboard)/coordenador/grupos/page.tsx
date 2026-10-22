import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PaginaSecao } from "@/components/pagina-seccao";
import { GruposCoordenadorClient } from "@/features/academic-management/components/grupos-coordenador-client";

export default async function PaginaGruposCoordenador() {
  const sessao = await auth();

  if (!sessao?.user) {
    redirect("/login");
  }

  const papeis = (sessao.user as any).roles || [];
  if (!papeis.includes("coordenador") && !papeis.includes("admin")) {
    redirect("/login");
  }

  const idCoordenador = Number(sessao.user.id);
  const ehAdmin = papeis.includes("admin");

  // Cursos sob coordenação
  const cursos = await prisma.curso.findMany({
    where: ehAdmin ? {} : { idCoordenador },
    select: { id: true, nomeCurso: true },
    orderBy: { nomeCurso: "asc" },
  });

  const idsCursos = cursos.map((c) => c.id);

  // Disciplinas dos cursos para filtrar grupos
  const disciplinas = idsCursos.length
    ? await prisma.disciplina.findMany({
        where: { idCurso: { in: idsCursos } },
        select: { id: true },
      })
    : [];

  const idsDisciplinas = disciplinas.map((d) => d.id);

  // Turmas dos cursos
  const turmas = idsCursos.length
    ? await prisma.turma.findMany({
        where: { idCurso: { in: idsCursos } },
        select: { id: true },
      })
    : [];

  const idsTurmas = turmas.map((t) => t.id);

  // Grupos ligados a disciplinas ou turmas dos cursos sob coordenação
  const grupos = await prisma.grupo.findMany({
    where:
      ehAdmin
        ? {}
        : {
            OR: [
              ...(idsDisciplinas.length ? [{ idDisciplina: { in: idsDisciplinas } }] : []),
              ...(idsTurmas.length ? [{ idTurma: { in: idsTurmas } }] : []),
            ],
          },
    include: {
      criador: { select: { id: true, nome: true } },
      disciplina: {
        select: {
          id: true,
          nomeDisciplina: true,
          curso: { select: { id: true, nomeCurso: true } },
        },
      },
      turma: {
        select: {
          id: true,
          nomeTurma: true,
          curso: { select: { id: true, nomeCurso: true } },
        },
      },
      _count: { select: { membros: true, mensagens: true } },
    },
    orderBy: { id: "desc" },
  });

  const totalMembros = grupos.reduce((acc, g) => acc + g._count.membros, 0);

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="coordenador"
        titulo="Grupos do Curso"
        descricao="Acompanhe todos os grupos de turma, disciplina, trabalho e mentoria associados ao seu curso."
        indicadores={[
          { titulo: "Grupos", valor: String(grupos.length), observacao: "Registados" },
          { titulo: "Membros", valor: String(totalMembros), observacao: "Total nos grupos" },
          { titulo: "Cursos", valor: String(cursos.length), observacao: "Sob coordenação" },
        ]}
        resumos={grupos.slice(0, 3).map((g) => ({
          titulo: g.nomeGrupo,
          descricao:
            g.disciplina
              ? `Disciplina: ${g.disciplina.nomeDisciplina} · ${g.disciplina.curso?.nomeCurso || ""}`
              : g.turma
              ? `Turma: ${g.turma.nomeTurma} · ${g.turma.curso?.nomeCurso || ""}`
              : "Grupo geral",
          estado: `${g._count.membros} membros`,
        }))}
      />

      <div className="px-6 pb-8 lg:px-8">
        <GruposCoordenadorClient
          grupos={grupos.map((g) => ({
            id: g.id,
            nomeGrupo: g.nomeGrupo,
            tipoGrupo: g.tipoGrupo,
            criadorNome: g.criador?.nome || "Sistema",
            totalMembros: g._count.membros,
            totalMensagens: g._count.mensagens,
            disciplina: g.disciplina
              ? { id: g.disciplina.id, nome: g.disciplina.nomeDisciplina, cursoNome: g.disciplina.curso?.nomeCurso || "" }
              : null,
            turma: g.turma
              ? { id: g.turma.id, nome: g.turma.nomeTurma, cursoNome: g.turma.curso?.nomeCurso || "" }
              : null,
          }))}
        />
      </div>
    </div>
  );
}
