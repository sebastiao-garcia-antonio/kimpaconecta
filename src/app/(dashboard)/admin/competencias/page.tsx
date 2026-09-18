import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PaginaSecao } from "@/components/pagina-seccao";
import { obterCompetencias } from "@/features/admin/admin.actions";
import { GestaoCompetenciasAdminClient } from "@/features/admin/components/gestao-competencias-admin-client";

export default async function CompetenciasAdminPage() {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");

  const papeis = (sessao.user as any).roles || [];
  if (!papeis.includes("admin")) redirect("/login");

  const competencias = await obterCompetencias();
  const totalHabilidades = competencias.reduce((total: number, competencia: any) => total + competencia.habilidades.length, 0);
  const semHabilidades = competencias.filter((competencia: any) => competencia.habilidades.length === 0).length;

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="admin"
        titulo="Competências"
        descricao="Catálogo institucional de competências e habilidades aplicadas ao perfil do estudante."
        indicadores={[
          { titulo: "Competências", valor: String(competencias.length), observacao: "Registadas" },
          { titulo: "Habilidades", valor: String(totalHabilidades), observacao: "Associadas" },
          { titulo: "Média", valor: competencias.length ? (totalHabilidades / competencias.length).toFixed(1) : "0", observacao: "Por competência" },
          { titulo: "A estruturar", valor: String(semHabilidades), observacao: "Sem habilidades" },
        ]}
        resumos={competencias.slice(0, 4).map((competencia: any) => ({
          titulo: competencia.nomeCompetencia,
          descricao: competencia.habilidades.map((habilidade: any) => habilidade.nomeHabilidade).join(" · "),
          estado: `${competencia.habilidades.length} habilidade(s)`,
        }))}
      />

      <div className="px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <GestaoCompetenciasAdminClient
            competencias={competencias.map((competencia: any) => ({
              id: competencia.id,
              nomeCompetencia: competencia.nomeCompetencia,
              habilidades: competencia.habilidades.map((habilidade: any) => ({
                id: habilidade.id,
                nomeHabilidade: habilidade.nomeHabilidade,
              })),
            }))}
          />
        </div>
      </div>
    </div>
  );
}