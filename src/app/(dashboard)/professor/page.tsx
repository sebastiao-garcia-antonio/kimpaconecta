import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FeedComunidadeClient } from "@/features/feed/components/feed-comunidade-client";
import { obterFeedInicial } from "@/features/feed/obter-feed-inicial";

export default async function PainelProfessorPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const roles = (session.user as any).roles || [];
  if (!roles.includes("professor") && !roles.includes("admin")) {
    redirect("/login");
  }

  const professorId = Number(session.user.id);
  const professorNome = session.user.name || "Professor";

  const feed = await obterFeedInicial({
    idUsuario: professorId,
    nome: professorNome,
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
