import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PaginaSecao } from "@/components/pagina-seccao";
import { ListaNotificacoesEstudanteClient } from "@/features/notifications/components/lista-notificacoes-estudante-client";
import { NotificationsRepository } from "@/features/notifications/repositories/notifications.repository";

export default async function PaginaNotificacoes() {
  const sessao = await auth();
  const idUsuario = Number(sessao?.user?.id);
  if (!sessao?.user || !Number.isInteger(idUsuario) || idUsuario <= 0) redirect("/login");

  const papeis = (sessao.user as { roles?: string[] }).roles || [];
  const papel: "admin" | "professor" | "coordenador" | "estudante" = papeis.includes("admin")
    ? "admin"
    : papeis.includes("coordenador")
      ? "coordenador"
      : papeis.includes("professor")
        ? "professor"
        : "estudante";
  const notificacoes = await NotificationsRepository.listarNotificacoesDoUsuario(idUsuario);
  const naoLidas = notificacoes.filter((notificacao) => !notificacao.lida).length;

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel={papel}
        titulo="Notificações"
        descricao="Acompanhe aprovações, interações da comunidade e avisos académicos num só lugar."
        indicadores={[
          { titulo: "Total", valor: String(notificacoes.length), observacao: "Registos disponíveis" },
          { titulo: "Não lidas", valor: String(naoLidas), observacao: "Pendentes de leitura" },
          { titulo: "Lidas", valor: String(notificacoes.length - naoLidas), observacao: "Já consultadas" },
        ]}
        resumos={notificacoes.slice(0, 3).map((notificacao) => ({ titulo: notificacao.titulo, descricao: notificacao.mensagem, estado: notificacao.lida ? "Lida" : "Nova" }))}
      />

      <div className="space-y-6 px-6 pb-8 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          {naoLidas > 0 ? `${naoLidas} notificação(ões) ainda por ler.` : "Não tem notificações por ler neste momento."}
        </div>
        <ListaNotificacoesEstudanteClient notificacoes={notificacoes as any} />
      </div>
    </div>
  );
}