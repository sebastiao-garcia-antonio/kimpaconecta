import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PaginaSecao } from "@/components/pagina-seccao";
import { obterDadosDashboardCoordenador } from "@/features/admin/admin.actions";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Building,
  CheckCircle,
  ChevronRight,
  Clock,
  FolderGit2,
  Users,
} from "lucide-react";

function gerarCorEstado(estado: string) {
  if (estado === "Muito forte") return "text-emerald-600";
  if (estado === "Estável") return "text-brand-blue";
  if (estado === "Em consolidação") return "text-amber-600";
  return "text-red-500";
}

function gerarBarraCor(estado: string) {
  if (estado === "Muito forte") return "from-emerald-500 to-emerald-400";
  if (estado === "Estável") return "from-brand-blue to-brand-green";
  if (estado === "Em consolidação") return "from-brand-beige to-amber-500";
  return "from-red-500 to-red-400";
}

function formatarData(data: Date) {
  return new Date(data).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const roles = (session.user as any).roles || [];
  if (!roles.includes("coordenador") && !roles.includes("admin")) {
    redirect("/login");
  }

  const dados = await obterDadosDashboardCoordenador();

  const aprovadas = dados.metricas.totalCursos > 0
    ? Math.round((dados.solicitacoesRecentes.filter((item) => item.status === "aprovado").length / Math.max(dados.solicitacoesRecentes.length, 1)) * 100)
    : 0;

  const metricasSemestre = [
    { label: "Taxa de aprovação global", valor: dados.metricas.taxaAprovacaoGlobal, cor: "from-emerald-500 to-emerald-400" },
    { label: "Presenças médias", valor: dados.metricas.presencasMedias, cor: "from-brand-blue to-brand-green" },
  ];

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="coordenador"
        mostrarVoltar={false}
        titulo="Painel do Coordenador"
        descricao="Supervisão académica, validação de pedidos e acompanhamento dos cursos da unidade orgânica."
        indicadores={[
          { titulo: "Cursos", valor: String(dados.metricas.totalCursos), observacao: "Sob coordenação" },
          { titulo: "Disciplinas", valor: String(dados.metricas.totalDisciplinas), observacao: "Registadas" },
          { titulo: "Turmas", valor: String(dados.metricas.totalTurmas), observacao: "Em funcionamento" },
          { titulo: "Aprovações", valor: String(dados.metricas.totalPendentes), observacao: "Pendentes" },
        ]}
        resumos={dados.cursos.slice(0, 3).map((curso) => ({
          titulo: curso.nomeCurso,
          descricao: `${curso.totalDisciplinas} disciplina(s) · ${curso.totalTurmas} turma(s) · ${curso.totalEstudantes} estudante(s)`,
          estado: curso.coordenador ? "Coordenado" : "Sem coordenador",
        }))}
        acaoPrincipal={
          <Link
            href="/coordenador/solicitacoes"
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-bold text-emerald-100 transition hover:bg-emerald-500/15"
          >
            Ver solicitações
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="px-6 lg:px-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="group p-5 bg-white border border-slate-200 rounded-2xl hover:border-brand-blue/30 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-start">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Cursos</span>
              <div className="p-2 bg-brand-blue/10 rounded-xl"><Building className="h-4 w-4 text-brand-blue" /></div>
            </div>
            <div className="mt-3"><span className="text-3xl font-extrabold text-slate-800">{dados.metricas.totalCursos}</span><span className="text-xs text-slate-400 ml-2">ativos</span></div>
            <div className="mt-2 flex items-center gap-1 text-emerald-600 text-xs font-semibold"><CheckCircle className="h-3 w-3" /><span>{dados.cursos.filter((curso) => curso.coordenador).length} com coordenador</span></div>
          </div>

          <div className="group p-5 bg-white border border-slate-200 rounded-2xl hover:border-brand-green/30 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-start">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Disciplinas</span>
              <div className="p-2 bg-emerald-100 rounded-xl"><BookOpen className="h-4 w-4 text-brand-green" /></div>
            </div>
            <div className="mt-3"><span className="text-3xl font-extrabold text-slate-800">{dados.metricas.totalDisciplinas}</span><span className="text-xs text-slate-400 ml-2">registadas</span></div>
            <div className="mt-2 flex items-center gap-1 text-brand-green text-xs font-semibold"><CheckCircle className="h-3 w-3" /><span>Estrutura curricular</span></div>
          </div>

          <div className="group p-5 bg-white border border-slate-200 rounded-2xl hover:border-amber-400/30 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-start">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Turmas</span>
              <div className="p-2 bg-amber-100 rounded-xl"><Users className="h-4 w-4 text-amber-600" /></div>
            </div>
            <div className="mt-3"><span className="text-3xl font-extrabold text-slate-800">{dados.metricas.totalTurmas}</span><span className="text-xs text-slate-400 ml-2">ativas</span></div>
            <div className="mt-2 flex items-center gap-1 text-amber-600 text-xs font-semibold"><Users className="h-3 w-3" /><span>{dados.metricas.totalEstudantes} estudantes</span></div>
          </div>

          <div className="group p-5 bg-white border border-slate-200 rounded-2xl hover:border-red-300 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-start">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Aprovações</span>
              <div className="p-2 bg-red-100 rounded-xl"><AlertTriangle className="h-4 w-4 text-red-500" /></div>
            </div>
            <div className="mt-3"><span className="text-3xl font-extrabold text-slate-800">{dados.metricas.totalPendentes}</span><span className="text-xs text-slate-400 ml-2">pendentes</span></div>
            <div className="mt-2 flex items-center gap-1 text-red-500 text-xs font-semibold"><Clock className="h-3 w-3" /><span>Requer atenção</span></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg text-slate-800">Cursos supervisionados</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ano atual</span>
            </div>
            {dados.cursos.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                Ainda não existem cursos associados à tua coordenação.
              </p>
            ) : (
              <div className="space-y-3">
                {dados.cursos.map((curso) => (
                  <Link
                    key={curso.id}
                    href="/coordenador/cursos"
                    className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-brand-blue/20 hover:shadow-sm transition group"
                  >
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-blue to-brand-green flex items-center justify-center shrink-0"><Building className="h-5 w-5 text-white" /></div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-slate-700 truncate">{curso.nomeCurso}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{curso.totalEstudantes} estudantes · {curso.totalTurmas} turmas · {curso.totalDisciplinas} disciplinas</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-sm font-extrabold ${gerarCorEstado(curso.estado)}`}>{curso.taxaAprovacao}%</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">{curso.estado}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-lg text-slate-800 mb-5">Métricas do semestre</h3>
            <div className="space-y-4">
              {metricasSemestre.map((m) => (
                <div key={m.label}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-semibold text-slate-600">{m.label}</span>
                    <span className="text-xs font-bold text-slate-800">{m.valor}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${m.cor} rounded-full transition-all duration-500`} style={{ width: `${m.valor}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Projetos em vitrine</span>
                <span className="text-sm font-extrabold text-slate-800">{dados.metricas.totalProjetos}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Solicitações recentes aprovadas</span>
                <span className="text-sm font-extrabold text-slate-800">{aprovadas}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg text-slate-800">Aprovações pendentes</h3>
              <Link href="/coordenador/solicitacoes" className="text-[10px] font-bold bg-amber-100 text-amber-600 px-2.5 py-1 rounded-full uppercase tracking-wider">
                {dados.metricas.totalPendentes} pendentes
              </Link>
            </div>
            {dados.solicitacoesPendentes.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                Nenhuma solicitação pendente. Tudo sob controlo.
              </p>
            ) : (
              <div className="space-y-3">
                {dados.solicitacoesPendentes.map((item) => (
                  <Link
                    key={item.id}
                    href="/coordenador/solicitacoes"
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-amber-300 hover:shadow-sm transition"
                  >
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-red-100">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-slate-700 truncate">{item.nomeCompleto}</h4>
                      <p className="text-[11px] text-slate-400 truncate">{item.nomeCurso} · {item.nomeTurma || "Sem turma"} · {formatarData(item.dataSolicitacao)}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg text-slate-800">Projetos da vitrine</h3>
              <Link href="/coordenador/projetos" className="text-[10px] font-bold bg-emerald-100 text-emerald-600 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Ver tudo
              </Link>
            </div>
            {dados.projetos.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                Nenhum projeto submetido ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {dados.projetos.map((projeto) => (
                  <Link
                    key={projeto.id}
                    href="/coordenador/projetos"
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-brand-green/30 hover:shadow-sm transition"
                  >
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-green to-emerald-400 flex items-center justify-center"><FolderGit2 className="h-4 w-4 text-white" /></div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-slate-700 truncate">{projeto.titulo}</h4>
                      <p className="text-[11px] text-slate-400 truncate">{projeto.disciplina} · {projeto.professor}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${projeto.autorizado ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                      {projeto.autorizado ? "Aprovado" : "Pendente"}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}