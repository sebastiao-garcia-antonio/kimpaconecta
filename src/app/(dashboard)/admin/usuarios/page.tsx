import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PaginaSecao } from "@/components/pagina-seccao";
import { obterUtilizadores } from "@/features/admin/admin.actions";

export default async function UsuariosAdminPage() {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");

  const papeis = (sessao.user as any).roles || [];
  if (!papeis.includes("admin")) redirect("/login");

  const usuarios = await obterUtilizadores();
  const totalAtivos = usuarios.filter((usuario: any) => usuario.status === "ativo").length;
  const totalBloqueados = usuarios.filter((usuario: any) => usuario.status !== "ativo").length;
  const totalEstudantes = usuarios.filter((usuario: any) => usuario.perfis.some((perfil: any) => perfil.perfil.nomePerfil === "estudante")).length;
  const totalDocentes = usuarios.filter((usuario: any) => usuario.perfis.some((perfil: any) => ["professor", "coordenador"].includes(perfil.perfil.nomePerfil))).length;

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="admin"
        titulo="Utilizadores"
        descricao="Gestão visual de contas, perfis e estados de acesso de toda a plataforma."
        indicadores={[
          { titulo: "Total", valor: String(usuarios.length), observacao: "Contas registadas" },
          { titulo: "Ativos", valor: String(totalAtivos), observacao: "Com acesso liberado" },
          { titulo: "Bloqueados", valor: String(totalBloqueados), observacao: "Em revisão" },
          { titulo: "Estudantes / Docentes", valor: `${totalEstudantes}/${totalDocentes}`, observacao: "Perfis principais" },
        ]}
        resumos={usuarios.slice(0, 4).map((usuario: any) => ({
          titulo: usuario.nome,
          descricao: `${usuario.email} · ${usuario.perfis.map((perfil: any) => perfil.perfil.nomePerfil).join(", ")}`,
          estado: usuario.status,
        }))}
      />

      <div className="px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Lista de utilizadores</h3>
              <p className="mt-1 text-sm text-slate-500">Vista resumida das contas e dos seus perfis.</p>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400">
                  <th className="px-4 py-3 font-bold uppercase tracking-[0.18em]">Nome</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-[0.18em]">E-mail</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-[0.18em]">Perfis</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-[0.18em]">Estado</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario: any) => (
                  <tr key={usuario.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-4 font-semibold text-slate-800">{usuario.nome}</td>
                    <td className="px-4 py-4 text-slate-500">{usuario.email}</td>
                    <td className="px-4 py-4 text-slate-600">{usuario.perfis.map((perfil: any) => perfil.perfil.nomePerfil).join(", ")}</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${usuario.status === "ativo" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                        {usuario.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

