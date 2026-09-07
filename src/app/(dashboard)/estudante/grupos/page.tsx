import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaginaSecao } from "@/components/pagina-seccao";
import { GruposEMentoriaClient, ItemGrupo } from "@/features/academic/components/grupos-e-mentoria-client";

export const revalidate = 0;

export default async function EstudanteGruposPage() {
  const sessao = await auth();
  const idUsuario = Number(sessao?.user?.id);
  const papeis = (sessao?.user as { roles?: string[] } | undefined)?.roles || [];

  if (!sessao || !Number.isInteger(idUsuario) || idUsuario <= 0) {
    redirect("/login");
  }

  // Buscar grupos em que o estudante é membro ou criador
  const gruposBrutos = await prisma.grupo.findMany({
    where: {
      tipoGrupo: { in: ["turma", "disciplina", "mentoria", "trabalho"] },
      membros: {
        some: { idUsuario },
      },
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

  // Buscar mentores disponíveis (estudantes mentores ou docentes/coordenadores)
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
        papel="estudante"
        titulo="Grupos & Mentoria Académica"
        descricao="Aceda aos seus grupos de turma, grupos de disciplina e sessões de acompanhamento de mentores."
        indicadores={[
          { titulo: "Grupos Ativos", valor: `${gruposFormatados.length}`, observacao: "Inscritos" },
          { titulo: "Mentores", valor: `${mentores.length}`, observacao: "Disponíveis" },
          { titulo: "Comunicação", valor: "0 ms", observacao: "Real-time" },
        ]}
        resumos={[
          {
            titulo: "Rede de Apoio Académico",
            descricao: "Grupos dedicados para esclarecer dúvidas, partilhar resumos de aulas e realizar trabalhos de grupo.",
            estado: "Ativo",
          },
        ]}
      />

      <div className="px-6 pb-8 lg:px-8">
        <GruposEMentoriaClient
          grupos={gruposFormatados}
          usuarioAtual={{
            id: idUsuario,
            nome: sessao.user?.name || "Estudante",
            papeis,
          }}
          mentoresDisponiveis={mentores}
        />
      </div>
    </div>
  );
}
