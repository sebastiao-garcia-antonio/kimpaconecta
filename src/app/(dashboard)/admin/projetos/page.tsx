import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PaginaSecao } from "@/components/pagina-seccao";
import { obterProjetosVitrineAdmin } from "@/features/admin/admin.actions";
import { GestaoProjetosAdminClient } from "@/features/admin/components/gestao-projetos-admin-client";

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
          titulo: projeto.tituloProjeto,
          descricao: `${projeto.disciplina?.nomeDisciplina || "Sem disciplina"} · ${projeto.professor?.nome || "Sem professor"}`,
          estado: projeto.idProfessorAutorizador ? "Aprovado" : "Pendente",
        }))}
      />

      <div className="px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h3 className="text-lg font-black text-slate-900">Projetos em destaque</h3>
            <p className="mt-1 text-sm text-slate-500">Aprovar projetos para publicação ou remover a autorização da vitrine pública.</p>
          </div>
          <GestaoProjetosAdminClient
            projetos={projetos.map((projeto: any) => ({
              id: projeto.id,
              titulo: projeto.tituloProjeto,
              descricao: projeto.descricao,
              idProfessorAutorizador: projeto.idProfessorAutorizador,
              disciplina: projeto.disciplina ? { nomeDisciplina: projeto.disciplina.nomeDisciplina } : null,
              professor: projeto.professor ? { nome: projeto.professor.nome } : null,
              autores: projeto.autores?.map((autor: any) => ({ usuario: { nome: autor.usuario.nome } })),
            }))}
          />
        </div>
      </div>
    </div>
  );
}