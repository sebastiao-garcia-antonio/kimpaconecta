import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PaginaSecao } from "@/components/pagina-seccao";
import { obterProjetosVitrineAdmin } from "@/features/admin/admin.actions";

export default async function ProjetosAdminPage() {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");

  const papeis = (sessao.user as any).roles || [];
  if (!papeis.includes("admin")) redirect("/login");

  const projetos = await obterProjetosVitrineAdmin();
  const autorizados = projetos.filter((projeto: any) => Boolean(projeto.idProfessorAutorizador)).length;
  const pendentes = projetos.filter((projeto: any) => !projeto.idProfessorAutorizador).length;

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="admin"
        titulo="Vitrine de projetos"
        descricao="Controle visual dos projetos submetidos, aprovados e destacados para publicação pública."
        indicadores={[
          { titulo: "Projetos", valor: String(projetos.length), observacao: "Registados" },
          { titulo: "Aprovados", valor: String(autorizados), observacao: "Publicados" },
          { titulo: "Pendentes", valor: String(pendentes), observacao: "Em análise" },
          { titulo: "Autores", valor: String(projetos.reduce((total: number, projeto: any) => total + (projeto.autores?.length || 0), 0)), observacao: "Participantes" },
        ]}
        resumos={projetos.slice(0, 4).map((projeto: any) => ({
          titulo: projeto.titulo,
          descricao: `${projeto.disciplina?.nomeDisciplina || "Sem disciplina"} · ${projeto.professor?.nome || "Sem professor"}`,
          estado: projeto.idProfessorAutorizador ? "Aprovado" : "Pendente",
        }))}
      />

      <div className="px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-900">Projetos em destaque</h3>
              <p className="mt-1 text-sm text-slate-500">Lista resumida para revisão e publicação.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projetos.map((projeto: any) => (
              <div key={projeto.id} className="rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-bold text-slate-800">{projeto.titulo}</h4>
                    <p className="mt-1 text-xs text-slate-500">{projeto.disciplina?.nomeDisciplina || "Sem disciplina"}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${projeto.idProfessorAutorizador ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {projeto.idProfessorAutorizador ? "Aprovado" : "Pendente"}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600 line-clamp-3">{projeto.descricao}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


