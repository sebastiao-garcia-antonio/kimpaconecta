import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaginaSecao } from "@/components/pagina-seccao";
import { GruposEMentoriaClient, ItemGrupo } from "@/features/academic/components/grupos-e-mentoria-client";

export const revalidate = 0;

export default async function ProfessorGroupsPage() {
  const sessao = await auth();
  const idUsuario = Number(sessao?.user?.id);
  const papeis = (sessao?.user as { roles?: string[] } | undefined)?.roles || [];

  if (!sessao || !Number.isInteger(idUsuario) || idUsuario <= 0) {
    redirect("/login");
  }

  // Buscar todos os grupos no sistema
  const gruposBrutos = await prisma.grupo.findMany({
    where: {
      tipoGrupo: { in: ["turma", "disciplina", "mentoria", "trabalho"] },
    },
    include: {
      criador: { select: { id: true, nome: true } },
      _count: { select: { membros: true } },
      membros: {
        include: {
          usuario: { select: { id: true, nome: true, fotoPerfil: true } },
        },
      },
    },
    orderBy: { id: "desc" },
  });

  const mentores = await prisma.usuario.findMany({
    where: {
      status: "ativo",
      OR: [
        { matriculas: { some: { isMentor: true } } },
        { perfis: { some: { perfil: { nomePerfil: { in: ["coordenador", "professor"] } } } } },
      ],
    },
    select: { id: true, nome: true, email: true, numEstudanteLogin: true },
    take: 30,
  });

  const gruposFormatados: ItemGrupo[] = gruposBrutos.map((g) => ({
    id: g.id,
    nomeGrupo: g.nomeGrupo,
    tipoGrupo: g.tipoGrupo,
    idCriador: g.idCriador,
    criadorNome: g.criador?.nome || "UKV",
    totalMembros: g._count.membros,
    membros: g.membros.map((m) => ({
      idUsuario: m.usuario.id,
      nome: m.usuario.nome,
      fotoPerfil: m.usuario.fotoPerfil,
      funcao: m.funcaoNoGrupo || "membro",
    })),
  }));

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="professor"
        titulo="Gestão de Grupos & Mentoria"
        descricao="Supervisione os grupos de turma, disciplinas, grupos de trabalho e acompanhe os mentores da faculdade."
        indicadores={[
          { titulo: "Total Grupos", valor: `${gruposFormatados.length}`, observacao: "No sistema" },
          { titulo: "Mentores", valor: `${mentores.length}`, observacao: "Designados" },
          { titulo: "Comunicação", valor: "0 ms", observacao: "Real-time" },
        ]}
        resumos={[
          {
            titulo: "Supervisão Pedagógica",
            descricao: "Crie grupos de cadeira, atribua mentores aos estudantes e acompanhe a evolução colaborativa.",
            estado: "Ativo",
          },
        ]}
      />

      <div className="px-6 pb-8 lg:px-8">
        <GruposEMentoriaClient
          grupos={gruposFormatados}
          usuarioAtual={{
            id: idUsuario,
            nome: sessao.user?.name || "Professor",
            papeis,
          }}
          mentoresDisponiveis={mentores}
        />
      </div>
    </div>
  );
}
