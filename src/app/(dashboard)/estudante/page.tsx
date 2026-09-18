import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AcademicRepository } from "@/features/academic/repositories/academic.repository";
import { NotificationsRepository } from "@/features/notifications/repositories/notifications.repository";
import { PaginaSecao } from "@/components/pagina-seccao";
import { interpretarFiltroAnoAcademico, normalizarFiltroAnoAcademico, rotuloFiltroAnoAcademico } from "@/features/academic/utils/filtro-ano-academico";

type PageProps = {
  searchParams?: Promise<{
    ano?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const sessao = await auth();

  if (!sessao?.user) {
    redirect("/login");
  }

  const papeis = (sessao.user as any).roles || [];
  if (!papeis.includes("estudante")) {
    redirect("/login");
  }

  const idEstudante = Number(sessao.user.id);
  const parametros = (await (searchParams ?? Promise.resolve({}))) as { ano?: string };
  const filtroAno = interpretarFiltroAnoAcademico(parametros.ano);
  const contextoAcademico = await AcademicRepository.obterContextoAcademicoDoEstudante(idEstudante);
  const anoAtivo = normalizarFiltroAnoAcademico(filtroAno, contextoAcademico.anosDisponiveis, contextoAcademico.anoActual);
  const disciplinasTodas = await AcademicRepository.obterDisciplinasDoEstudante(idEstudante);
  const historico = await AcademicRepository.obterHistoricoAcademicoDoEstudante(idEstudante);
  const oportunidades = await AcademicRepository.obterOportunidadesParaEstudante(idEstudante);
  const notificacoes = await NotificationsRepository.listarNotificacoesDoUsuario(idEstudante);

  const disciplinas = filtroAno === "historico"
    ? disciplinasTodas
    : anoAtivo
      ? disciplinasTodas.filter((disciplina: any) => disciplina.anoCurricular === anoAtivo)
      : disciplinasTodas;

  const resumosNotificacoes = notificacoes.slice(0, 3).map((notificacao: any) => ({
    titulo: notificacao.titulo,
    descricao: notificacao.mensagem,
    estado: notificacao.lida ? "Lida" : "Nova",
  }));

const totalDisciplinas = disciplinas.length;
  const registosPresenca = disciplinas.filter((disciplina: any) => disciplina.totalPresencas > 0);
  const mediaPresenca = registosPresenca.length
    ? Math.round(registosPresenca.reduce((total: number, disciplina: any) => total + (disciplina.taxaPresenca || 0), 0) / registosPresenca.length)
    : null;
  const totalHistorico = filtroAno === "historico" ? historico.length : historico.filter((item: any) => item.anoLectivo === anoAtivo).length;
  const naoLidas = notificacoes.filter((notificacao: any) => !notificacao.lida).length;

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="estudante"
        mostrarVoltar={false}
        titulo="Painel do estudante"
        descricao="Acompanha o teu percurso por ano, as disciplinas activas, notas e alertas do sistema."
        indicadores={[
          { titulo: "Disciplinas", valor: String(totalDisciplinas), observacao: "No ano seleccionado" },
          { titulo: "Presença média", valor: mediaPresenca === null ? "—" : `${mediaPresenca}%`, observacao: "Disciplinas com registos" },
          { titulo: "Histórico", valor: String(totalHistorico), observacao: "Lançamentos visíveis" },
          { titulo: "Não lidas", valor: String(naoLidas), observacao: "Notificações pendentes" },
        ]}
        resumos={[
          {
            titulo: `Ano em visualização: ${rotuloFiltroAnoAcademico(anoAtivo, contextoAcademico.anoActual)}`,
            descricao: "Apenas aparecem os anos que já frequentaste ou estás a frequentar.",
            estado: contextoAcademico.anosDisponiveis.join(", "),
          },
          ...resumosNotificacoes,
        ].slice(0, 3)}
      />

      <div className="px-6 lg:px-8 pb-8 space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          {filtroAno === "historico"
            ? "A visualizar o histórico de todos os anos disponíveis para o teu perfil."
            : `A visualizar ${rotuloFiltroAnoAcademico(anoAtivo, contextoAcademico.anoActual)}.`}
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            { titulo: "Disciplinas activas", valor: String(totalDisciplinas), detalhe: "No contexto seleccionado" },
            { titulo: "Presença média", valor: mediaPresenca === null ? "—" : `${mediaPresenca}%`, detalhe: "Disciplinas com registos" },
            { titulo: "Histórico visível", valor: String(totalHistorico), detalhe: "Notas e pautas" },
            { titulo: "Novas notificações", valor: String(naoLidas), detalhe: "Pendentes de leitura" },
          ].map((cartao) => (
            <div key={cartao.titulo} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{cartao.titulo}</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-800">{cartao.valor}</p>
              <p className="mt-1 text-sm text-slate-500">{cartao.detalhe}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">Disciplinas em acompanhamento</h3>
                  <p className="text-sm text-slate-500">Lista filtrada pelo ano que escolheste.</p>
                </div>
                <Link href="/estudante/disciplinas" className="text-sm font-semibold text-brand-blue hover:underline">
                  Abrir disciplinas
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {disciplinas.map((disciplina: any) => (
                  <article key={disciplina.idDisciplina} className="rounded-2xl border border-slate-200 p-4 transition hover:shadow-md">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-slate-800">{disciplina.nomeDisciplina}</h4>
                        <p className="text-sm text-slate-500 mt-1">
                          {disciplina.nomeCurso} · {disciplina.nomeTurma} · {disciplina.anoCurricular}º ano
                        </p>
                      </div>
<span className="rounded-full bg-brand-blue/10 px-2.5 py-1 text-xs font-bold text-brand-blue">
                        {disciplina.totalPresencas > 0 ? `${disciplina.taxaPresenca}%` : "—"}
                      </span>
                    </div>
                    <div className="mt-4 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-green" style={{ width: `${disciplina.totalPresencas > 0 ? disciplina.taxaPresenca : 0}%` }} />
                    </div>
                  </article>
                ))}
                {disciplinas.length === 0 && (
                  <p className="text-sm text-slate-500">Nenhuma disciplina encontrada para o ano seleccionado.</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {historico.slice(0, 4).map((item: any) => (
                <div key={String(item.idHistorico)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{item.anoLectivo}º ano lectivo</p>
                  <h4 className="mt-2 font-semibold text-slate-800">{item.disciplina?.nomeDisciplina}</h4>
                  <p className="mt-1 text-sm text-slate-500">{item.disciplina?.curso?.nomeCurso}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-600">Nota final</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                      {Number(item.notaFinal).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">Notificações recentes</h3>
                  <p className="text-sm text-slate-500">Mensagens e estados de aprovação do teu percurso.</p>
                </div>
                <Link href="/estudante/notificacoes" className="text-sm font-semibold text-brand-blue hover:underline">
                  Ver todas
                </Link>
              </div>

              <div className="space-y-3">
                {notificacoes.slice(0, 3).map((notificacao: any) => (
                  <div key={notificacao.idNotificacao} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-slate-800">{notificacao.titulo}</h4>
                        <p className="mt-1 text-sm text-slate-500">{notificacao.mensagem}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${notificacao.lida ? "bg-slate-100 text-slate-600" : "bg-emerald-100 text-emerald-700"}`}>
                        {notificacao.lida ? "Lida" : "Nova"}
                      </span>
                    </div>
                  </div>
                ))}
                {notificacoes.length === 0 && (
                  <p className="text-sm text-slate-500">Ainda não tens notificações.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-bold text-lg text-slate-800">Oportunidades activas</h3>
              <p className="text-sm text-slate-500 mt-1">Vagas e programas disponíveis para o teu perfil.</p>
              <div className="mt-4 space-y-3">
                {oportunidades.slice(0, 3).map((oportunidade: any) => (
                  <div key={String(oportunidade.idOportunidade)} className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                    <h4 className="font-semibold text-slate-800">{oportunidade.titulo}</h4>
                    <p className="mt-1 text-sm text-slate-500">{oportunidade.empresa || "Sem empresa"} · {oportunidade.tipo}</p>
                  </div>
                ))}
                {oportunidades.length === 0 && <p className="text-sm text-slate-500">Sem oportunidades publicadas no momento.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
