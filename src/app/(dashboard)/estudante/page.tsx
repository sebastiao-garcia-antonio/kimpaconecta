import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FeedComunidadeClient } from "@/features/feed/components/feed-comunidade-client";
import { obterFeedInicial } from "@/features/feed/obter-feed-inicial";

export default async function PainelEstudantePage() {
  const sessao = await auth();

  if (!sessao?.user) {
    redirect("/login");
  }

  const papeis = (sessao.user as any).roles || [];
  if (!papeis.includes("estudante")) {
    redirect("/login");
  }

  const idEstudante = Number(sessao.user.id);
  const feed = await obterFeedInicial({
    idUsuario: idEstudante,
    nome: sessao.user.name,
    papeis,
  });

  return (
    <div className="mx-auto max-w-3xl py-2">
      <FeedComunidadeClient
        publicacoes={feed.publicacoes}
        proximoCursor={feed.proximoCursor}
        usuarioAtual={feed.usuarioAtual}
        mostrarComposer={true}
      />
    </div>
  );
}
