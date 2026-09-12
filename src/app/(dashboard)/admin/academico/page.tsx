import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PaginaSecao } from "@/components/pagina-seccao";
import { obterCoordenadoresDisponiveis } from "@/features/admin/admin.actions";
import { GerenciadorAcademicoTabs } from "@/features/academic-management/components/gerenciador-academico-tabs";

export default async function AcademicoAdminPage() {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");

  const papeis = (sessao.user as any).roles || [];
  if (!papeis.includes("admin")) redirect("/login");

  // Carregar dados de estrutura académica
  const [unidades, cursos, turmas, coordenadores, totalDisciplinas] = await Promise.all([
    prisma.unidadeOrganica.findMany({
      include: {
        _count: {
          select: { cursos: true },
        },
      },
      orderBy: { nomeUo: "asc" },
    }),
    prisma.curso.findMany({
      include: {
        unidade: { select: { id: true, nomeUo: true, sigla: true } },
        coordenador: { select: { id: true, nome: true } },
        _count: {
          select: { turmas: true, disciplinas: true },
        },
      },
      orderBy: { nomeCurso: "asc" },
    }),
    prisma.turma.findMany({
      include: {
        curso: {
          select: {
            id: true,
            nomeCurso: true,
            unidade: { select: { id: true, sigla: true, nomeUo: true } },
          },
        },
        _count: {
          select: { matriculas: true },
        },
      },
      orderBy: { nomeTurma: "asc" },
    }),
    obterCoordenadoresDisponiveis(),
    prisma.disciplina.count(),
  ]);

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="admin"
        titulo="Estrutura académica"
        descricao="Gestão centralizada de unidades orgânicas, cursos de graduação e turmas curriculares."
        indicadores={[
          {
            titulo: "Unidades",
            valor: String(unidades.length),
            observacao: "Faculdades / Institutos",
          },
          {
            titulo: "Cursos",
            valor: String(cursos.length),
            observacao: "Distribuídos",
          },
          {
            titulo: "Disciplinas",
            valor: String(totalDisciplinas),
            observacao: "Currículo geral",
          },
          {
            titulo: "Turmas",
            valor: String(turmas.length),
            observacao: "Em funcionamento",
          },
        ]}
        resumos={cursos.slice(0, 4).map((curso) => ({
          titulo: `${curso.nomeCurso} · ${curso.unidade?.sigla || ""}`,
          descricao: `${curso._count?.disciplinas || 0} disciplina(s) · ${curso._count?.turmas || 0} turma(s)`,
          estado: curso.coordenador?.nome || "Sem coordenador",
        }))}
      />

      <div className="px-6 lg:px-8">
        <GerenciadorAcademicoTabs
          unidades={unidades}
          cursos={cursos}
          turmas={turmas}
          coordenadores={coordenadores}
        />
      </div>
    </div>
  );
}
