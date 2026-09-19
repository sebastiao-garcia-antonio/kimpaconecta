import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FeedRepository } from "@/features/feed/repositories/feed.repository";
import { FeedComunidadeClient } from "@/features/feed/components/feed-comunidade-client";
import { SocketStatusBadge } from "@/components/common/socket-status-badge";
import {
  GraduationCap,
  Briefcase,
  Search,
  Home as HomeIcon,
  FolderGit2,
  FileText,
} from "lucide-react";

export const revalidate = 0;

export default async function HomePage() {
  let session = null;
  try {
    session = await auth();
  } catch (err) {
    console.error("Erro ao verificar sessão na página inicial:", err);
  }

  const usuario = session?.user as { id?: string; name?: string | null; roles?: string[] } | undefined;
  const idUsuario = usuario?.id ? Number(usuario.id) : undefined;
  const roles = usuario?.roles || [];

  let publicacoesBrutas: any[] = [];
  let projetosVitrine: any[] = [];
  let oportunidades: any[] = [];
  let seguidosBrutos: any[] = [];

  try {
    const [pubRes, projRes, opRes, segRes] = await Promise.all([
      FeedRepository.listarPublicacoesPublicas(idUsuario).catch(() => []),
      prisma.projetoVitrine.findMany({
        include: {
          autores: {
            include: {
              usuario: {
                select: { id: true, nome: true, fotoPerfil: true },
              },
            },
          },
          _count: {
            select: { curtidores: true },
          },
        },
        where: { idProfessorAutorizador: { not: null } },
        orderBy: { dataPublicacao: "desc" },
        take: 5,
      }).catch(() => []),
      prisma.oportunidadeAcademica.findMany({
        orderBy: { dataPublicacao: "desc" },
        take: 5,
      }).catch(() => []),
      idUsuario
        ? prisma.seguidorUsuario.findMany({
            where: { idSeguidor: idUsuario },
            select: { idSeguido: true },
          }).catch(() => [])
        : Promise.resolve([]),
    ]);

    publicacoesBrutas = pubRes || [];
    projetosVitrine = projRes || [];
    oportunidades = opRes || [];
    seguidosBrutos = segRes || [];
  } catch (dbError) {
    console.error("Erro ao carregar dados da base de dados:", dbError);
  }

  const seguidosSet = new Set(seguidosBrutos.map((s) => s.idSeguido));

  const publicacoes = publicacoesBrutas.map((p) => ({
    ...p,
    dataPublicacao: typeof p.dataPublicacao === "string" ? p.dataPublicacao : p.dataPublicacao?.toISOString ? p.dataPublicacao.toISOString() : new Date().toISOString(),
    autor: {
      ...p.autor,
      estaAAcompanhar: seguidosSet.has(p.autor.id),
    },
    comentarios: (p.comentarios || []).map((c: any) => ({
      ...c,
      dataPublicacao: typeof c.dataPublicacao === "string" ? c.dataPublicacao : c.dataPublicacao?.toISOString ? c.dataPublicacao.toISOString() : new Date().toISOString(),
    })),
  }));

  const usuarioAtual = usuario?.id && usuario?.name
    ? {
        id: Number(usuario.id),
        nome: usuario.name,
        papeis: roles,
      }
    : undefined;

  let hrefPainel = "/login";
  if (roles.includes("admin")) hrefPainel = "/admin";
  else if (roles.includes("coordenador")) hrefPainel = "/coordenador";
  else if (roles.includes("professor")) hrefPainel = "/professor";
  else if (roles.includes("estudante")) hrefPainel = "/estudante";

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      {/* Barra de Navegação Superior */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 shadow-xs backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="rounded-xl bg-gradient-to-tr from-brand-blue to-brand-green p-1.5 text-white shadow-md shadow-brand-blue/20">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="hidden text-lg font-extrabold tracking-tight text-slate-800 sm:block">
                Kimpa Connect
              </span>
            </Link>
            <div className="hidden items-center rounded-full bg-slate-100 px-4 py-2 text-slate-600 md:flex w-72">
              <Search className="mr-2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar disciplinas, notas, oportunidades, documentos e pessoas..."
                className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <nav className="flex items-center gap-3">
            {usuario ? (
              <>
                <SocketStatusBadge userId={usuario.id} />
                <Link
                  href={hrefPainel}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-brand-blue-dark"
                >
                  <HomeIcon className="h-4 w-4" />
                  <span>O Meu Painel</span>
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Iniciar sessão
                </Link>
                <Link
                  href="/registro"
                  className="rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-brand-blue-dark"
                >
                  Pedir acesso à plataforma
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Painel Esquerdo — Perfil / Links Rápidos */}
          <aside className="space-y-6 lg:col-span-1">
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-brand-green text-xl font-black text-white shadow-md">
                  {usuario?.name ? usuario.name.substring(0, 2).toUpperCase() : "UKV"}
                </div>
                <h3 className="mt-3 text-base font-extrabold text-slate-900">
                  {usuario?.name || "Universidade Kimpa Vita"}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {roles.length > 0 ? roles.join(" · ").toUpperCase() : "A comunidade académica da UKV num só lugar"}
                </p>
                {usuario ? (
                  <Link
                    href={hrefPainel}
                    className="mt-4 w-full rounded-2xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                  >
                    Aceder ao Painel
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="mt-4 w-full rounded-2xl bg-brand-blue py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-brand-blue-dark"
                  >
                    Entrar na plataforma
                  </Link>
                )}
              </div>
            </div>

            {/* Vitrine de Projetos Académicos Dinâmicos */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FolderGit2 className="h-4 w-4 text-brand-blue" /> Projetos Vitrine
                </h4>
              </div>
              <div className="space-y-3">
                {projetosVitrine.length > 0 ? (
                  projetosVitrine.map((proj) => (
                    <div key={proj.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/70 transition hover:bg-white hover:shadow-xs">
                      {proj.urlImagem && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={proj.urlImagem} alt={proj.tituloProjeto} className="h-24 w-full object-cover" />
                      )}
                      <div className="p-3.5">
                        <p className="text-xs font-extrabold text-slate-800">{proj.tituloProjeto}</p>
                        <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">{proj.descricao}</p>
                        <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-slate-400 font-semibold">
                          <span>{proj.autores[0]?.usuario.nome || "Estudante UKV"}</span>
                          <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5">
                            {proj._count?.curtidores || 0} curtidas
                          </span>
                        </div>
                        {proj.urlAnexo && (
                          <a href={proj.urlAnexo} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-brand-blue hover:underline">
                            <FileText className="h-3 w-3" /> Ver documento
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic py-2">Sem projetos publicados.</p>
                )}
              </div>
            </div>
          </aside>

          {/* Coluna Central — Feed de Publicações Dinâmico */}
          <section className="lg:col-span-2 space-y-6">
            <FeedComunidadeClient publicacoes={publicacoes as any} usuarioAtual={usuarioAtual} />
          </section>

          {/* Painel Direito — Oportunidades & Avisos Dinâmicos */}
          <aside className="space-y-6 lg:col-span-1">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-brand-blue" /> Oportunidades
                </h4>
              </div>
              <div className="space-y-3">
                {oportunidades.length > 0 ? (
                  oportunidades.map((opp) => (
                    <div key={String(opp.idOportunidade)} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 transition hover:bg-white hover:shadow-xs">
                      <span className="rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-[9px] font-bold text-brand-blue uppercase tracking-wider">
                        {opp.tipo}
                      </span>
                      <p className="mt-1.5 text-xs font-extrabold text-slate-800">{opp.titulo}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{opp.empresa || "Universidade Kimpa Vita"}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic py-2">Sem oportunidades registadas.</p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3 text-xs text-slate-500">
              <p className="font-bold text-slate-700">© 2026 Universidade Kimpa Vita</p>
              <p>A comunidade académica da Universidade Kimpa Vita num só lugar.</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
