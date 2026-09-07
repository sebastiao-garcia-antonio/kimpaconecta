import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PaginaSecao } from "@/components/pagina-seccao";
import { FormularioMeuPerfilClient } from "@/features/users/components/formulario-meu-perfil-client";
import { UsersRepository } from "@/features/users/repositories/users.repository";

export default async function PaginaMeuPerfil() {
  const sessao = await auth();
  const idUsuario = Number(sessao?.user?.id);

  if (!sessao || !Number.isInteger(idUsuario) || idUsuario <= 0) {
    redirect("/login");
  }

  const papeis = (sessao.user as { roles?: string[] }).roles || [];
  const papel: "admin" | "professor" | "coordenador" | "estudante" = papeis.includes("admin")
    ? "admin"
    : papeis.includes("coordenador")
      ? "coordenador"
      : papeis.includes("professor")
        ? "professor"
        : "estudante";

  const perfil = await UsersRepository.obterPerfil(idUsuario);
  if (!perfil) redirect("/login");

  const perfilSerializado = JSON.parse(JSON.stringify(perfil));

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel={papel}
        titulo="Meu perfil"
        descricao="Gerir os dados pessoais, contacto e apresentação profissional."
        indicadores={[
          { titulo: "Foto", valor: perfil.fotoPerfil ? "Sim" : "Não", observacao: "Perfil visual" },
          { titulo: "Biografia", valor: perfil.bio ? "Preenchida" : "Pendente", observacao: "Apresentação" },
          { titulo: "Telefone", valor: perfil.telefone ? "Definido" : "Pendente", observacao: "Contacto" },
        ]}
        resumos={[{ titulo: perfil.nome, descricao: perfil.bio || "Complete a sua biografia para tornar o perfil mais informativo.", estado: perfil.email }]}
      />

      <div className="px-6 lg:px-8">
        <FormularioMeuPerfilClient perfil={perfilSerializado} />
      </div>
    </div>
  );
}