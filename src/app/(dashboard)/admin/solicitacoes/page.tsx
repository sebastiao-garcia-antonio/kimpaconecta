import { Shield } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PaginaSecao } from "@/components/pagina-seccao";
import { obterSolicitacoesAcesso } from "@/features/admin/admin.actions";
import { CheckCircle2, Clock3, UserCheck } from "lucide-react";
import { EstadoVazio } from "@/components/estado-vazio";

export default async function SolicitacoesAdminPage() {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");

  const papeis = (sessao.user as any).roles || [];
  if (!papeis.includes("admin")) redirect("/login");

  const solicitacoes = await obterSolicitacoesAcesso();
  const pendentes = solicitacoes.filter((solicitacao: any) => solicitacao.status === "pendente").length;
  const aprovadas = solicitacoes.filter((solicitacao: any) => solicitacao.status === "aprovado").length;
  const rejeitadas = solicitacoes.filter((solicitacao: any) => solicitacao.status === "rejeitado").length;

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="admin"
        titulo="Solicitações de acesso"
        descricao="Visão administrativa dos pedidos enviados pelos estudantes. A aprovação é feita pelo coordenador do curso, e aqui apenas acompanhamos o estado geral do processo."
        indicadores={[
          { titulo: "Pendentes", valor: String(pendentes), observacao: "A aguardar coordenador" },
          { titulo: "Aprovadas", valor: String(aprovadas), observacao: "Concluídas" },
          { titulo: "Rejeitadas", valor: String(rejeitadas), observacao: "Recusadas" },
          { titulo: "Total", valor: String(solicitacoes.length), observacao: "Histórico global" },
        ]}
        resumos={solicitacoes.slice(0, 4).map((solicitacao: any) => ({
          titulo: solicitacao.nomeCompleto,
          descricao: `${solicitacao.curso.unidade.nomeUo} · ${solicitacao.curso.nomeCurso}`,
          estado: solicitacao.status,
        }))}
        acaoPrincipal={
          <Link
            href="/coordenador/solicitacoes"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/15"
          >
            Abrir área do coordenador
          </Link>
        }
      />

      <div className="px-6 lg:px-8 space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900">Estado das solicitações</h3>
              <p className="mt-1 text-sm text-slate-500">A aprovação acontece no painel do coordenador; o administrador acompanha o resultado final.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
              <Shield className="h-4 w-4" /> Modo observação
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-amber-600">
                <Clock3 className="h-4 w-4" />
                <span className="text-xs font-black uppercase tracking-[0.18em]">Pendentes</span>
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900">{pendentes}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-black uppercase tracking-[0.18em]">Aprovadas</span>
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900">{aprovadas}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-rose-600">
                <UserCheck className="h-4 w-4" />
                <span className="text-xs font-black uppercase tracking-[0.18em]">Rejeitadas</span>
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900">{rejeitadas}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {solicitacoes.map((solicitacao: any) => (
            <div key={solicitacao.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900">{solicitacao.nomeCompleto}</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    {solicitacao.email} · {solicitacao.numEstudante} · {solicitacao.numBi || "Sem BI"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {solicitacao.curso.unidade.nomeUo} · {solicitacao.curso.nomeCurso}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
                  {solicitacao.status}
                </span>
              </div>
            </div>
          ))}

          {solicitacoes.length === 0 && (
            <EstadoVazio
              titulo="Nenhuma solicitação registada"
              descricao="Quando estudantes enviarem pedidos de acesso, eles aparecerão aqui para acompanhamento administrativo."
              icone={<Shield className="h-6 w-6" />}
            />
          )}
        </div>
      </div>
    </div>
  );
}
