import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaginaSecao } from "@/components/pagina-seccao";
import { EstagiosECandidaturasClient, OportunidadeItem, CandidaturaItem } from "@/features/academic/components/estagios-e-candidaturas-client";

export const revalidate = 0;

export default async function ProfessorOpportunitiesPage() {
  const sessao = await auth();
  const idUsuario = Number(sessao?.user?.id);
  const papeis = (sessao?.user as { roles?: string[] } | undefined)?.roles || [];

  if (!sessao || !Number.isInteger(idUsuario) || idUsuario <= 0) {
    redirect("/login");
  }

  // Buscar vagas criadas pelo próprio docente
  const vagasBrutas = await prisma.oportunidadeAcademica.findMany({
    where: { criadoPor: idUsuario },
    include: {
      criador: { select: { nome: true } },
      candidaturas: { select: { idCandidatura: true } },
    },
    orderBy: { dataPublicacao: "desc" },
  });
  const idsOportunidades = vagasBrutas.map((vaga) => vaga.idOportunidade);

  // Candidaturas recebidas nas vagas deste docente
  const candidaturasBrutas = idsOportunidades.length
    ? await prisma.candidaturaOportunidade.findMany({
        where: { idOportunidade: { in: idsOportunidades } },
        include: {
          oportunidade: { select: { idOportunidade: true, titulo: true, empresa: true, tipo: true } },
          usuario: { select: { nome: true, email: true } },
        },
        orderBy: { dataCandidatura: "desc" },
      })
    : [];

  const oportunidades: OportunidadeItem[] = vagasBrutas.map((v) => ({
    id: Number(v.idOportunidade),
    titulo: v.titulo,
    descricao: v.descricao,
    tipo: v.tipo,
    empresa: v.empresa || "Universidade Kimpa Vita",
    requisitos: v.requisitos,
    dataLimite: v.dataLimite ? v.dataLimite.toISOString() : null,
    criadorNome: v.criador?.nome || "Utilizador",
    totalCandidaturas: v.candidaturas.length,
  }));

  const todasCandidaturasParaDocente: CandidaturaItem[] = candidaturasBrutas.map((c) => ({
    idCandidatura: Number(c.idCandidatura),
    idOportunidade: Number(c.oportunidade.idOportunidade),
    tituloVaga: c.oportunidade.titulo,
    empresa: c.oportunidade.empresa || "Universidade Kimpa Vita",
    tipo: c.oportunidade.tipo,
    estado: c.estado,
    dataCandidatura: c.dataCandidatura.toISOString(),
    estudanteNome: c.usuario.nome,
    estudanteEmail: c.usuario.email,
  }));

  const candidaturasAvaliadas = todasCandidaturasParaDocente.filter((c) => c.estado !== "pendente").length;

  const minhasCandidaturasBrutas = await prisma.candidaturaOportunidade.findMany({
    where: { idUsuario },
    include: {
      oportunidade: { select: { idOportunidade: true, titulo: true, empresa: true, tipo: true } },
    },
    orderBy: { dataCandidatura: "desc" },
  });

  const minhasCandidaturas: CandidaturaItem[] = minhasCandidaturasBrutas.map((c) => ({
    idCandidatura: Number(c.idCandidatura),
    idOportunidade: Number(c.oportunidade.idOportunidade),
    tituloVaga: c.oportunidade.titulo,
    empresa: c.oportunidade.empresa || "Universidade Kimpa Vita",
    tipo: c.oportunidade.tipo,
    estado: c.estado,
    dataCandidatura: c.dataCandidatura.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="professor"
        titulo="Gestão de Oportunidades & Estágios"
        descricao="Publicar oportunidades de estágio, bolsas de iniciação científica e gerir candidaturas dos estudantes."
        indicadores={[
          { titulo: "Vagas Publicadas", valor: `${oportunidades.length}`, observacao: "Publicadas por ti" },
          { titulo: "Candidaturas", valor: `${todasCandidaturasParaDocente.length}`, observacao: "Recebidas" },
          { titulo: "Avaliadas", valor: `${candidaturasAvaliadas}`, observacao: "Processadas" },
        ]}
        resumos={[
          {
            titulo: "Recrutamento Académico",
            descricao: "Promova a integração dos seus estudantes em projetos de investigação e estágios em empresas parceiras.",
            estado: "Ativo",
          },
        ]}
      />

      <div className="px-6 pb-8 lg:px-8">
        <EstagiosECandidaturasClient
          oportunidades={oportunidades}
          minhasCandidaturas={minhasCandidaturas}
          todasCandidaturasParaDocente={todasCandidaturasParaDocente}
          usuarioAtual={{
            id: idUsuario,
            nome: sessao.user?.name || "Professor",
            papeis,
          }}
        />
      </div>
    </div>
  );
}
