import Link from "next/link";
import { notFound } from "next/navigation";
import { GraduationCap, Search, Home as HomeIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { UsersRepository } from "@/features/users/repositories/users.repository";
import { PerfilPublicoClient } from "@/features/users/components/perfil-publico-client";

export const revalidate = 0;

export default async function PaginaPerfilPublico({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idPerfil = Number(id);

  if (!Number.isInteger(idPerfil) || idPerfil <= 0) notFound();

  let session = null;
  try {
    session = await auth();
  } catch {
    // Continua como anónimo
  }

  const usuario = session?.user as { id?: string; name?: string | null; roles?: string[] } | undefined;
  const idVisitante = usuario?.id ? Number(usuario.id) : undefined;
  const roles = usuario?.roles || [];
  const nomeUtilizador = usuario?.name || null;

  const perfil = await UsersRepository.obterPerfilPublico(idPerfil, idVisitante ?? 0);
  if (!perfil) notFound();

  const perfilSerializado = JSON.parse(JSON.stringify(perfil));

  let hrefPainel = "/login";
  if (roles.includes("admin")) hrefPainel = "/admin";
  else if (roles.includes("coordenador")) hrefPainel = "/coordenador";
  else if (roles.includes("professor")) hrefPainel = "/professor";
  else if (roles.includes("estudante")) hrefPainel = "/estudante";

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      {/* Barra superior estilo Kimpa Connect */}
      <header className="sticky top-0 z-50 w-full bg-white/90 shadow-xs backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="rounded-xl bg-gradient-to-tr from-brand-blue to-brand-green p-1.5 text-white shadow-md shadow-brand-blue/20">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="hidden text-lg font-extrabold tracking-tight text-slate-800 sm:block">Kimpa Connect</span>
            </Link>
            <div className="hidden items-center rounded-full bg-slate-100 px-4 py-2 text-slate-600 md:flex">
              <Search className="mr-2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar na comunidade..."
                className="w-56 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {usuario ? (
              <>
                <Link
                  href={hrefPainel}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-brand-blue-dark"
                >
                  <HomeIcon className="h-4 w-4" /> O Meu Painel
                </Link>
                <Link
                  href="/perfil"
                  className="rounded-xl px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
                >
                  {nomeUtilizador?.split(" ")[0] || "Conta"}
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-brand-blue-dark"
              >
                Iniciar sessão
              </Link>
            )}
          </div>
        </div>
      </header>

      <PerfilPublicoClient
        perfil={perfilSerializado}
        visitanteAutenticado={Boolean(idVisitante && idVisitante > 0)}
        visitaPropria={idVisitante === idPerfil}
      />
    </div>
  );
}