import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, GraduationCap, Home as HomeIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { FeedRepository } from "@/features/feed/repositories/feed.repository";
import { FeedComunidadeClient } from "@/features/feed/components/feed-comunidade-client";

export const revalidate = 0;

export default async function PaginaPublicacao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idPublicacao = Number(id);

  if (!Number.isInteger(idPublicacao) || idPublicacao <= 0) notFound();

  let session = null;
  try {
    session = await auth();
  } catch {
    // Continua como anónimo
  }

  const usuario = session?.user as { id?: string; name?: string | null; roles?: string[] } | undefined;
  const idUsuario = usuario?.id ? Number(usuario.id) : undefined;
  const roles = usuario?.roles || [];

  let publicacao = null;
  try {
    publicacao = await FeedRepository.obterPublicacao(idPublicacao, idUsuario);
  } catch (err) {
    console.error("Erro ao carregar publicação:", err);
  }

  if (!publicacao) notFound();

  const publicacaoSerializada = {
    ...publicacao,
    dataPublicacao:
      typeof publicacao.dataPublicacao === "string"
        ? publicacao.dataPublicacao
        : publicacao.dataPublicacao?.toISOString
          ? publicacao.dataPublicacao.toISOString()
          : new Date().toISOString(),
    comentarios: (publicacao.comentarios || []).map((c: any) => ({
      ...c,
      dataPublicacao:
        typeof c.dataPublicacao === "string"
          ? c.dataPublicacao
          : c.dataPublicacao?.toISOString
            ? c.dataPublicacao.toISOString()
            : new Date().toISOString(),
    })),
  };

  const usuarioAtual =
    usuario?.id && usuario?.name
      ? { id: Number(usuario.id), nome: usuario.name, papeis: usuario.roles || [] }
      : undefined;

  let hrefPainel = "/login";
  if (roles.includes("admin")) hrefPainel = "/admin";
  else if (roles.includes("coordenador")) hrefPainel = "/coordenador";
  else if (roles.includes("professor")) hrefPainel = "/professor";
  else if (roles.includes("estudante")) hrefPainel = "/estudante";

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      <header className="sticky top-0 z-50 w-full bg-white/90 shadow-xs backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="rounded-xl bg-gradient-to-tr from-brand-blue to-brand-green p-1.5 text-white shadow-md shadow-brand-blue/20">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="hidden text-lg font-extrabold tracking-tight text-slate-800 sm:block">Kimpa Connect</span>
          </Link>
          {usuario ? (
            <Link
              href={hrefPainel}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-brand-blue-dark"
            >
              <HomeIcon className="h-4 w-4" /> O Meu Painel
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-brand-blue-dark"
            >
              Iniciar Sessão
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4 text-slate-500" /> Voltar ao feed
        </Link>
        <FeedComunidadeClient publicacoes={[publicacaoSerializada as any]} usuarioAtual={usuarioAtual} mostrarComposer={false} />
      </main>
    </div>
  );
}