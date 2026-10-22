import { redirect } from "next/navigation";

// As solicitações de acesso dos estudantes são geridas pelo coordenador do curso.
// Esta página redireciona para a área correta.
export default function SolicitacoesAdminRedirect() {
  redirect("/coordenador/solicitacoes");
}
