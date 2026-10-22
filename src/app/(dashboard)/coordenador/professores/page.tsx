import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PaginaSecao } from "@/components/pagina-seccao";
import { ProfessoresCoordenadorClient } from "@/features/academic-management/components/professores-coordenador-client";

export default async function PaginaProfessoresCoordenador() {
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

  // Cursos sob a coordenação do utilizador (ou todos se for admin)
  const cursos = await prisma.curso.findMany({
    where: ehAdmin ? {} : { idCoordenador },
    select: { id: true, nomeCurso: true },
    orderBy: { nomeCurso: "asc" },
  });

  const idsCursos = cursos.map((c) => c.id);

  // Professores vinculados aos cursos do coordenador
  const professores = await prisma.usuario.findMany({
    where: {
      perfis: {
        some: {
          perfil: { nomePerfil: "professor" },
        },
      },
      ...(ehAdmin
        ? {}
        : {
            cursos: { some: { idCurso: { in: idsCursos } } },
          }),
    },
    include: {
      cursos: {
        where: ehAdmin ? {} : { idCurso: { in: idsCursos } },
        select: {
          idCurso: true,
          dataVinculo: true,
          curso: { select: { id: true, nomeCurso: true } },
        },
      },
      _count: {
        select: {
          avaliacoesCriadas: true,
          materiaisCriados: true,
          diariosAulaCriados: true,
        },
      },
    },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="coordenador"
        titulo="Professores do Curso"
        descricao="Gerencie os docentes associados ao seu curso: consulte o vínculo, disciplinas e produções académicas."
        indicadores={[
          { titulo: "Professores", valor: String(professores.length), observacao: "Vinculados ao curso" },
          { titulo: "Cursos", valor: String(cursos.length), observacao: "Sob coordenação" },
        ]}
        resumos={professores.slice(0, 3).map((p) => ({
          titulo: p.nome,
          descricao: `${p.email} · ${p.cursos.length} curso(s) vinculado(s)`,
          estado: p.status === "ativo" ? "Ativo" : "Inativo",
        }))}
      />

      <div className="px-6 pb-8 lg:px-8">
        <ProfessoresCoordenadorClient
          cursos={cursos}
          professores={professores.map((p) => ({
            id: p.id,
            nome: p.nome,
            email: p.email,
            status: p.status,
            cursos: p.cursos.map((uc) => ({
              idCurso: uc.idCurso,
              nomeCurso: uc.curso?.nomeCurso || "",
              dataVinculo: uc.dataVinculo instanceof Date ? uc.dataVinculo.toISOString() : String(uc.dataVinculo),
            })),
            totalAvaliacoes: p._count.avaliacoesCriadas,
            totalMateriais: p._count.materiaisCriados,
            totalDiarios: p._count.diariosAulaCriados,
          }))}
        />
      </div>
    </div>
  );
}
