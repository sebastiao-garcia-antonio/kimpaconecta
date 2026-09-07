import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PaginaSecao } from "@/components/pagina-seccao";
import { obterDadosDashboardCompleto } from "@/features/admin/admin.actions";
import {
  Activity,
  ArrowRight,
  BookOpen,
  FolderGit2,
  GraduationCap,
  History,
  LayoutDashboard,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";

const acessosRapidos = [
  {
    titulo: "Utilizadores",
    descricao: "Gerir estudantes, docentes e coordenadores.",
    href: "/admin/usuarios",
    icone: Users,
  },
  {
    titulo: "Solicitações",
    descricao: "Acompanhar pedidos e encaminhar solicitações.",
    href: "/admin/solicitacoes",
    icone: ShieldAlert,
  },
  {
    titulo: "Académico",
    descricao: "Estrutura curricular, disciplinas e turmas.",
    href: "/admin/academico",
    icone: BookOpen,
  },
  {
    titulo: "Competências",
    descricao: "Controlar perfis, habilidades e áreas de atuação.",
    href: "/admin/competencias",
    icone: GraduationCap,
  },
  {
    titulo: "Projetos",
    descricao: "Vitrine pública e aprovação de projetos.",
    href: "/admin/projetos",
    icone: FolderGit2,
  },
  {
    titulo: "Proctoring",
    descricao: "Sala global de monitorização e bloqueio de riscos.",
    href: "/admin/proctoring",
    icone: ShieldCheck,
  },
];

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const roles = (session.user as any).roles || [];
  if (!roles.includes("admin")) {
    redirect("/login");
  }

  const dashboardData = await obterDadosDashboardCompleto();

  const indicadores = [
    {
      titulo: "Estudantes ativos",
      valor: dashboardData.metricas.totalEstudantes.toLocaleString("pt-PT"),
      observacao: "Registos ligados ao sistema",
      icone: Users,
    },
    {
      titulo: "Professores",
      valor: dashboardData.metricas.totalProfessores.toLocaleString("pt-PT"),
      observacao: "Corpo docente disponível",
      icone: GraduationCap,
    },
    {
      titulo: "Coordenadores",
      valor: dashboardData.metricas.totalCoordenadores.toLocaleString("pt-PT"),
      observacao: "Gestão por curso",
      icone: LayoutDashboard,
    },
    {
      titulo: "Alertas de segurança",
      valor: dashboardData.metricas.totalAlertasProctoring.toLocaleString("pt-PT"),
      observacao: "Monitorização em tempo real",
      icone: ShieldAlert,
    },
  ];

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="admin"
        mostrarVoltar={false}
        titulo="Painel Administrativo"
        descricao="Centro de controlo da plataforma colaborativa da Universidade Kimpa Vita, com gestão de acessos, supervisão académica e monitorização de segurança numa única vista."
        indicadores={[
          { titulo: "Utilizadores", valor: dashboardData.metricas.totalEstudantes.toLocaleString("pt-PT"), observacao: "Estudantes registados" },
          { titulo: "Cursos", valor: dashboardData.metricas.totalCursos.toLocaleString("pt-PT"), observacao: "Estrutura académica" },
          { titulo: "Projetos", valor: dashboardData.metricas.totalProjetos.toLocaleString("pt-PT"), observacao: "Vitrine activa" },
          { titulo: "Solicitações em curso", valor: dashboardData.metricas.totalSolicitacoes.toLocaleString("pt-PT"), observacao: "A aguardar o coordenador" },
        ]}
        resumos={[
          { titulo: "Fluxo de encaminhamento", descricao: "As solicitações são validadas pelo coordenador antes do registo no sistema.", estado: "Activo" },
          { titulo: "Sala de proctoring", descricao: "A vigilância das avaliações activas fica disponível para controlo imediato de riscos.", estado: "Online" },
          { titulo: "Estrutura académica", descricao: "Cursos, disciplinas, competências e turmas ficam organizados por módulos.", estado: "Organizado" },
        ]}
        acaoPrincipal={
          <Link
            href="/admin/proctoring"
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-bold text-emerald-100 transition hover:bg-emerald-500/15"
          >
            Abrir proctoring global
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="px-6 lg:px-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          {indicadores.map((indicador) => {
            const Icone = indicador.icone;
            return (
              <div
                key={indicador.titulo}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">{indicador.titulo}</p>
                    <div className="mt-3 text-3xl font-black text-slate-900">{indicador.valor}</div>
                    <p className="mt-1 text-xs text-slate-500">{indicador.observacao}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3 text-brand-blue">
                    <Icone className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Acesso rápido aos módulos</h3>
                <p className="mt-1 text-sm text-slate-500">Entradas já ligadas às páginas operacionais.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                <Activity className="h-3.5 w-3.5" /> Estrutura activa
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {acessosRapidos.map((item) => {
                const Icone = item.icone;
                return (
                  <Link
                    key={item.titulo}
                    href={item.href}
                    className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-brand-blue/30 hover:bg-white hover:shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className="rounded-2xl bg-white p-3 text-brand-blue shadow-sm transition group-hover:bg-brand-blue group-hover:text-white">
                        <Icone className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-black text-slate-800">{item.titulo}</h4>
                        <p className="mt-1 text-xs text-slate-500">{item.descricao}</p>
                      </div>
                      <ArrowRight className="mt-1 h-4 w-4 text-slate-300 transition group-hover:text-brand-blue" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-900">Estado do sistema</h3>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-emerald-50 p-4">
                <div className="flex items-center gap-2 text-emerald-700">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-xs font-black uppercase tracking-[0.18em]">Segurança</span>
                </div>
                <p className="mt-2 text-sm text-emerald-900">Validação de texto activa para reduzir entradas suspeitas nos formulários.</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-700">
                  <History className="h-4 w-4" />
                  <span className="text-xs font-black uppercase tracking-[0.18em]">Auditoria</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">Últimos registos aparecem no painel para apoio à fiscalização.</p>
              </div>

              <div className="rounded-2xl bg-amber-50 p-4">
                <div className="flex items-center gap-2 text-amber-700">
                  <BookOpen className="h-4 w-4" />
                  <span className="text-xs font-black uppercase tracking-[0.18em]">Académico</span>
                </div>
                <p className="mt-2 text-sm text-amber-900">A estrutura de disciplinas e anos segue o percurso já frequentado pelo estudante.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Alertas de proctoring</h3>
                <p className="mt-1 text-sm text-slate-500">Ocorrências recentes de monitorização académica.</p>
              </div>
              <Link href="/admin/proctoring" className="text-sm font-bold text-brand-blue hover:underline">
                Ver sala
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {dashboardData.logsSegurancaRecentes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  <ShieldCheck className="mx-auto h-10 w-10 text-emerald-500" />
                  Sem alertas suspeitos no momento.
                </div>
              ) : (
                dashboardData.logsSegurancaRecentes.map((log: any) => (
                  <div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-red-700">
                        {String(log.tipoEvento).replace(/_/g, " ")}
                      </span>
                      <span className="text-sm font-bold text-slate-800">{log.estudanteNome}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      <span className="font-bold text-slate-700">Prova:</span> {log.provaTitulo} · {log.descricao}
                    </p>
                    <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {new Date(log.dataRegisto).toLocaleString("pt-PT")}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-900">Auditoria recente</h3>
            <p className="mt-1 text-sm text-slate-500">Histórico dos últimos movimentos administrativos.</p>

            <div className="mt-5 space-y-4">
              {dashboardData.logsAuditoriaRecentes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  Nenhuma auditoria recente disponível.
                </div>
              ) : (
                dashboardData.logsAuditoriaRecentes.map((log: any) => (
                  <div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-black text-slate-800">{log.acao}</h4>
                        <p className="mt-1 text-sm text-slate-600">{log.descricao}</p>
                        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          {log.usuarioNome}
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {new Date(log.dataRegisto).toLocaleString("pt-PT")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

