import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PaginaSecao } from "@/components/pagina-seccao";
import { obterUtilizadores } from "@/features/admin/admin.actions";
import { GestaoUsuariosAdminClient } from "@/features/admin/components/gestao-usuarios-admin-client";

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
          <GestaoUsuariosAdminClient
            usuarios={usuarios.map((usuario: any) => ({
              id: usuario.id,
              nome: usuario.nome,
              email: usuario.email,
              status: usuario.status,
              numEstudanteLogin: usuario.numEstudanteLogin,
              perfis: usuario.perfis.map((perfil: any) => ({ perfil: { nomePerfil: perfil.perfil.nomePerfil } })),
            }))}
          />
        </div>
      </div>
    </div>
  );
}