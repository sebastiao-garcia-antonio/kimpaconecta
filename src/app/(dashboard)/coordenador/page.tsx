import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { FeedComunidadeClient } from "@/features/feed/components/feed-comunidade-client";
import { obterFeedInicial } from "@/features/feed/obter-feed-inicial";

export default async function PainelCoordenadorPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const roles = (session.user as any).roles || [];
  if (!roles.includes("coordenador") && !roles.includes("admin")) {
    redirect("/login");
  }

  const idCoordenador = Number(session.user.id);
  const feed = await obterFeedInicial({
    idUsuario: idCoordenador,
    nome: session.user.name,
    papeis: roles,
  }).catch(() => ({ publicacoes: [], proximoCursor: null, usuarioAtual: null }));

  return (
    <div className="mx-auto max-w-3xl py-2">
      <FeedComunidadeClient
        publicacoes={feed.publicacoes}
        proximoCursor={feed.proximoCursor}
        usuarioAtual={feed.usuarioAtual || undefined}
        mostrarComposer={true}
      />
    </div>
  );
}