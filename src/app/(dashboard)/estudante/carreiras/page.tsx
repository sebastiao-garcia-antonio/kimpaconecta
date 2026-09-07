import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaginaSecao } from "@/components/pagina-seccao";
import { EstagiosECandidaturasClient, OportunidadeItem, CandidaturaItem } from "@/features/academic/components/estagios-e-candidaturas-client";

export const revalidate = 0;

export default async function EstudanteCarreirasPage() {
  const sessao = await auth();
  const idUsuario = Number(sessao?.user?.id);
  const papeis = (sessao?.user as { roles?: string[] } | undefined)?.roles || [];

  if (!sessao || !Number.isInteger(idUsuario) || idUsuario <= 0) {
    redirect("/login");
  }

  // Buscar todas as vagas de estágio
  const vagasBrutas = await prisma.oportunidadeAcademica.findMany({
    include: {
      criador: { select: { nome: true } },
      candidaturas: {
        where: { idUsuario },
        select: { idCandidatura: true, estado: true, dataCandidatura: true },
      },
    },
    orderBy: { dataPublicacao: "desc" },
  });

  // Buscar candidaturas do próprio estudante
  const minhasCandidaturasBrutas = await prisma.candidaturaOportunidade.findMany({
    where: { idUsuario },
    include: {
      oportunidade: { select: { idOportunidade: true, titulo: true, empresa: true, tipo: true } },
    },
    orderBy: { dataCandidatura: "desc" },
  });

  const oportunidades: OportunidadeItem[] = vagasBrutas.map((v) => ({
    id: Number(v.idOportunidade),
    titulo: v.titulo,
    descricao: v.descricao,
    tipo: v.tipo,
    empresa: v.empresa || "Universidade Kimpa Vita",
    requisitos: v.requisitos,
    dataLimite: v.dataLimite ? v.dataLimite.toISOString() : null,
    criadorNome: v.criador?.nome || "UKV",
    candidaturaAtual: v.candidaturas[0]
      ? {
          idCandidatura: Number(v.candidaturas[0].idCandidatura),
          estado: v.candidaturas[0].estado,
          dataCandidatura: v.candidaturas[0].dataCandidatura.toISOString(),
        }
      : null,
  }));

  const minhasCandidaturas: CandidaturaItem[] = minhasCandidaturasBrutas.map((c) => ({
    idCandidatura: Number(c.idCandidatura),
    idOportunidade: Number(c.oportunidade.idOportunidade),
    tituloVaga: c.oportunidade.titulo,
    empresa: c.oportunidade.empresa || "UKV",
    tipo: c.oportunidade.tipo,
    estado: c.estado,
    dataCandidatura: c.dataCandidatura.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="estudante"
        titulo="Estágios & Carreiras Académicas"
        descricao="Explore oportunidades de estágio profissional, bolsas de iniciação científica e submeta candidaturas."
        indicadores={[
          { titulo: "Vagas Ativas", valor: `${oportunidades.length}`, observacao: "Disponíveis" },
          { titulo: "Minhas Candidaturas", valor: `${minhasCandidaturas.length}`, observacao: "Submetidas" },
          { titulo: "Acompanhamento", valor: "Online", observacao: "Notificações ativas" },
        ]}
        resumos={[
          {
            titulo: "Portal de Carreiras UKV",
            descricao: "Candidatos qualificados conectados diretamente a empresas parceiras e projetos de investigação universitária.",
            estado: "Ativo",
          },
        ]}
      />

      <div className="px-6 pb-8 lg:px-8">
        <EstagiosECandidaturasClient
          oportunidades={oportunidades}
          minhasCandidaturas={minhasCandidaturas}
          usuarioAtual={{
            id: idUsuario,
            nome: sessao.user?.name || "Estudante",
            papeis,
          }}
        />
      </div>
    </div>
  );
}
