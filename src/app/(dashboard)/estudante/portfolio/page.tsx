import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaginaSecao } from "@/components/pagina-seccao";
import { PortfolioEstudanteClient, HabilidadeItem, ProjetoVitrineItem } from "@/features/academic/components/portfolio-estudante-client";

export const revalidate = 0;

export default async function EstudantePortfolioPage() {
  const sessao = await auth();
  const idUsuario = Number(sessao?.user?.id);
  const papeis = (sessao?.user as { roles?: string[] } | undefined)?.roles || [];

  if (!sessao || !Number.isInteger(idUsuario) || idUsuario <= 0) {
    redirect("/login");
  }

  // Buscar dados do estudante
  const estudante = await prisma.usuario.findUnique({
    where: { id: idUsuario },
    include: {
      cursos: { include: { curso: { select: { nomeCurso: true } } } },
      reputacao: true,
      habilidades: { include: { habilidade: { include: { competencia: true } } } },
      projetosAutor: {
        include: {
          projeto: {
            include: {
              _count: { select: { curtidores: true } },
            },
          },
        },
      },
    },
  });

  if (!estudante) redirect("/login");

  // Buscar todas as habilidades disponíveis no sistema para auto-atribuição
  const todasHabilidadesBrutas = await prisma.habilidade.findMany({
    include: { competencia: true },
    orderBy: { nomeHabilidade: "asc" },
  });

  const reputacaoObj = estudante.reputacao[0] || {
    pontos: 0,
    nivel: "iniciante",
    mentoriasRealizadas: 0,
    projetosPublicados: 0,
    feedbackPositivo: 0,
  };

  const habilidadesFormatadas: HabilidadeItem[] = estudante.habilidades.map((h) => ({
    idHabilidade: h.idHabilidade,
    nomeHabilidade: h.habilidade.nomeHabilidade,
    nomeCompetencia: h.habilidade.competencia.nomeCompetencia,
    nivel: h.nivelProficiencia,
  }));

  const todasHabilidadesDisponiveis = todasHabilidadesBrutas.map((h) => ({
    idHabilidade: h.id,
    nomeHabilidade: h.nomeHabilidade,
    nomeCompetencia: h.competencia.nomeCompetencia,
  }));

  const projetosFormatados: ProjetoVitrineItem[] = estudante.projetosAutor.map((pa) => ({
    id: pa.projeto.id,
    tituloProjeto: pa.projeto.tituloProjeto,
    descricao: pa.projeto.descricao,
    urlRepositorio: pa.projeto.urlRepositorio,
    urlDemonstracao: pa.projeto.urlDemonstracao,
    urlImagem: pa.projeto.urlImagem,
    urlAnexo: pa.projeto.urlAnexo,
    totalCurtidas: pa.projeto._count.curtidores,
    dataPublicacao: pa.projeto.dataPublicacao.toISOString(),
    autorizado: Boolean(pa.projeto.idProfessorAutorizador),
  }));

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="estudante"
        titulo="O Meu Portfólio & Reputação Académica"
        descricao="Gerir a sua reputação na Universidade, proficiência em competências técnicas e projetos da Vitrine."
        indicadores={[
          { titulo: "Pontos de Reputação", valor: `${reputacaoObj.pontos}`, observacao: `Medalha ${reputacaoObj.nivel.toUpperCase()}` },
          { titulo: "Habilidades", valor: `${habilidadesFormatadas.length}`, observacao: "Registadas" },
          { titulo: "Projetos Vitrine", valor: `${projetosFormatados.length}`, observacao: "Publicados" },
        ]}
        resumos={[
          {
            titulo: "Perfil Profissional Estudantil",
            descricao: "O seu portfólio de competências é visível para recrutadores e professores para atribuição de bolsas de estudo e estágios.",
            estado: "Ativo",
          },
        ]}
      />

      <div className="px-6 pb-8 lg:px-8">
        <PortfolioEstudanteClient
          estudante={{
            id: estudante.id,
            nome: estudante.nome,
            email: estudante.email,
            numEstudante: estudante.numEstudanteLogin,
            numBi: estudante.numBi,
            fotoPerfil: estudante.fotoPerfil,
            bio: estudante.bio,
            cursoNome: estudante.cursos[0]?.curso.nomeCurso || "Curso não atribuído",
          }}
          reputacao={{
            pontos: reputacaoObj.pontos,
            nivel: reputacaoObj.nivel,
            mentoriasRealizadas: reputacaoObj.mentoriasRealizadas,
            projetosPublicados: reputacaoObj.projetosPublicados,
            feedbackPositivo: reputacaoObj.feedbackPositivo,
          }}
          habilidades={habilidadesFormatadas}
          todasHabilidadesDisponiveis={todasHabilidadesDisponiveis}
          projetos={projetosFormatados}
        />
      </div>
    </div>
  );
}
