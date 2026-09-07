import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { EstadoVazio } from "@/components/estado-vazio";
import { PaginaSecao } from "@/components/pagina-seccao";
import { alterarEstadoPublicacaoServer } from "@/features/feed/actions";
import { FeedRepository } from "@/features/feed/repositories/feed.repository";

export default async function PaginaModeracaoFeedAdmin() {
  const sessao = await auth();

  if (!sessao?.user) {
    redirect("/login");
  }

  const papeis = (sessao.user as any).roles || [];
  if (!papeis.includes("admin")) {
    redirect("/login");
  }

  const publicacoes = await FeedRepository.listarPublicacoesParaModeracao();
  const publicadas = publicacoes.filter((publicacao) => publicacao.estado === "publicado").length;
  const ocultas = publicacoes.length - publicadas;
  const comentarios = publicacoes.reduce((total, publicacao) => total + publicacao._count.comentarios, 0);
  const gostos = publicacoes.reduce((total, publicacao) => total + publicacao._count.gostos, 0);

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="admin"
        titulo="Moderação do feed"
        descricao="Revê as publicações públicas da comunidade e mantém o espaço académico seguro, relevante e respeitoso."
        indicadores={[
          { titulo: "Publicadas", valor: String(publicadas), observacao: "Visíveis ao público" },
          { titulo: "Ocultas", valor: String(ocultas), observacao: "Fora do feed público" },
          { titulo: "Comentários", valor: String(comentarios), observacao: "Interações registadas" },
          { titulo: "Gostos", valor: String(gostos), observacao: "Apoios da comunidade" },
        ]}
        resumos={publicacoes.slice(0, 3).map((publicacao) => ({
          titulo: publicacao.autor.nome,
          descricao: publicacao.conteudo,
          estado: publicacao.estado === "publicado" ? "Publicada" : "Oculta",
        }))}
      />

      <div className="px-6 pb-8 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h3 className="text-lg font-bold text-slate-800">Publicações da comunidade</h3>
            <p className="text-sm text-slate-500">Ocultar remove a publicação do feed público; restaurar volta a disponibilizá-la.</p>
          </div>

          {publicacoes.length === 0 ? (
            <EstadoVazio
              titulo="Sem publicações para moderar"
              descricao="As publicações criadas pela comunidade aparecerão aqui para acompanhamento administrativo."
            />
          ) : (
            <div className="space-y-4">
              {publicacoes.map((publicacao) => {
                const proximoEstado = publicacao.estado === "publicado" ? "oculto" : "publicado";
                const acaoModeracao = async () => {
                  "use server";
                  await alterarEstadoPublicacaoServer(publicacao.id, proximoEstado);
                };

                return (
                  <article key={publicacao.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-slate-800">{publicacao.autor.nome}</h4>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${publicacao.estado === "publicado" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                            {publicacao.estado === "publicado" ? "Publicada" : "Oculta"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{publicacao.autor.email}</p>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{publicacao.conteudo}</p>
                        <p className="mt-3 text-xs text-slate-500">{publicacao._count.gostos} gosto(s) · {publicacao._count.comentarios} comentário(s)</p>
                      </div>

                      <form action={acaoModeracao}>
                        <button
                          type="submit"
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${publicacao.estado === "publicado" ? "bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-600" : "bg-brand-blue text-white hover:bg-brand-blue-dark focus-visible:outline-brand-blue"}`}
                        >
                          {publicacao.estado === "publicado" ? "Ocultar publicação" : "Restaurar publicação"}
                        </button>
                      </form>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}