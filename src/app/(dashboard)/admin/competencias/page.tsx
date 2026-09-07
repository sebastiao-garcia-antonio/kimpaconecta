import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PaginaSecao } from "@/components/pagina-seccao";
import { obterCompetencias } from "@/features/admin/admin.actions";

export default async function CompetenciasAdminPage() {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");

  const papeis = (sessao.user as any).roles || [];
  if (!papeis.includes("admin")) redirect("/login");

  const competencias = await obterCompetencias();
  const totalHabilidades = competencias.reduce((total: number, competencia: any) => total + competencia.habilidades.length, 0);

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
          { titulo: "Cobertura", valor: "100%", observacao: "Estrutura base" },
        ]}
        resumos={competencias.slice(0, 4).map((competencia: any) => ({
          titulo: competencia.nomeCompetencia,
          descricao: competencia.habilidades.map((habilidade: any) => habilidade.nomeHabilidade).join(" · "),
          estado: `${competencia.habilidades.length} habilidade(s)`,
        }))}
      />

      <div className="px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-900">Catálogo de competências</h3>
              <p className="mt-1 text-sm text-slate-500">Lista das competências com as respetivas habilidades.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {competencias.map((competencia: any) => (
              <div key={competencia.id} className="rounded-2xl border border-slate-200 p-5">
                <h4 className="text-base font-bold text-slate-800">{competencia.nomeCompetencia}</h4>
                <div className="mt-3 flex flex-wrap gap-2">
                  {competencia.habilidades.map((habilidade: any) => (
                    <span key={habilidade.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {habilidade.nomeHabilidade}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
