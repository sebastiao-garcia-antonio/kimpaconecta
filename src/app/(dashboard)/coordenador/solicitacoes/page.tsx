import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PaginaSecao } from "@/components/pagina-seccao";
import { obterSolicitacoesDoCoordenador } from "@/features/admin/admin.actions";
import { SolicitacoesCoordenadorClient } from "@/features/admin/components/solicitacoes-coordenador-client";

export default async function PaginaSolicitacoesCoordenador() {
  const sessao = await auth();

  if (!sessao?.user) {
    redirect("/login");
  }

  const papeis = (sessao.user as any).roles || [];
  if (!papeis.includes("coordenador")) {
    redirect("/login");
  }

  const solicitacoes = await obterSolicitacoesDoCoordenador();
  const pendentes = solicitacoes.filter((item: any) => item.status === "pendente").length;
  const aprovadas = solicitacoes.filter((item: any) => item.status === "aprovado").length;
  const rejeitadas = solicitacoes.filter((item: any) => item.status === "rejeitado").length;

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="coordenador"
        titulo="Solicitações"
        descricao="Pedidos de acesso enviados pelos estudantes do seu curso, com aprovação e rejeição controladas."
        indicadores={[
          { titulo: "Pendentes", valor: String(pendentes), observacao: "Aguardando análise" },
          { titulo: "Aprovadas", valor: String(aprovadas), observacao: "Convertidas em conta" },
          { titulo: "Rejeitadas", valor: String(rejeitadas), observacao: "Pedidos recusados" },
          { titulo: "Total", valor: String(solicitacoes.length), observacao: "Histórico" },
        ]}
        resumos={solicitacoes.slice(0, 3).map((solicitacao: any) => ({
          titulo: solicitacao.nomeCompleto,
          descricao: `${solicitacao.curso.unidade.nomeUo} · ${solicitacao.curso.nomeCurso}`,
          estado: solicitacao.status,
        }))}
      />

      <div className="px-6 lg:px-8">
        <SolicitacoesCoordenadorClient solicitacoes={solicitacoes as any} />
      </div>
    </div>
  );
}

