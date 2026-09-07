import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaginaSecao } from "@/components/pagina-seccao";
import { AulasVirtuaisClient, AulaVirtualItem } from "@/features/academic/components/aulas-virtuais-client";

export const revalidate = 0;

export default async function EstudanteAulasVirtuaisPage() {
  const sessao = await auth();
  const idUsuario = Number(sessao?.user?.id);
  const papeis = (sessao?.user as { roles?: string[] } | undefined)?.roles || [];

  if (!sessao || !Number.isInteger(idUsuario) || idUsuario <= 0) {
    redirect("/login");
  }

  // Buscar reuniões e aulas virtuais agendadas
  const reunioesBrutas = await prisma.reuniaoVirtual.findMany({
    include: {
      criador: { select: { nome: true } },
      grupo: { select: { nomeGrupo: true } },
    },
    orderBy: { dataInicio: "desc" },
    take: 30,
  });

  const aulasFormatadas: AulaVirtualItem[] = reunioesBrutas.map((r) => ({
    id: Number(r.idReuniao),
    titulo: r.titulo,
    descricao: r.descricao,
    criadorNome: r.criador.nome,
    grupoNome: r.grupo?.nomeGrupo || null,
    linkReuniao: r.linkReuniao || `https://meet.jit.si/kimpa-room-${r.idReuniao}`,
    plataforma: r.plataforma || "WebRTC / Kimpa Room",
    dataInicio: r.dataInicio.toISOString(),
    status: r.status,
  }));

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="estudante"
        titulo="Aulas Virtuais & Videochamadas"
        descricao="Participe em videochamadas ao vivo, sessões de tutoria e conferências interativas com qualidade WebRTC."
        indicadores={[
          { titulo: "Aulas Agendadas", valor: `${aulasFormatadas.length}`, observacao: "Em curso / Futuras" },
          { titulo: "Tecnologia", valor: "WebRTC", observacao: "Encriptado" },
          { titulo: "Acesso", valor: "1-Click", observacao: "Sem apps externas" },
        ]}
        resumos={[
          {
            titulo: "Salas de Transmissão UKV",
            descricao: "Salas virtuais integradas com suporte a câmara, microfone, partilha de ecrã e gravação.",
            estado: "Ativo",
          },
        ]}
      />

      <div className="px-6 pb-8 lg:px-8">
        <AulasVirtuaisClient
          aulas={aulasFormatadas}
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
