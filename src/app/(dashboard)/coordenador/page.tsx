import Link from "next/link";
import { BarChart2, BookOpen, Building, CheckCircle, ChevronRight, Clock, FolderGit2, Users, AlertTriangle, TrendingUp } from "lucide-react";
import { PaginaSecao } from "@/components/pagina-seccao";

const cursos = [
  { nome: "Engenharia Informática", alunos: 120, turmas: 4, taxa: 92, estado: "Muito forte" },
  { nome: "Ciências da Computação", alunos: 85, turmas: 3, taxa: 88, estado: "Estável" },
  { nome: "Sistemas de Informação", alunos: 67, turmas: 3, taxa: 95, estado: "Em alta" },
  { nome: "Engenharia de Redes", alunos: 48, turmas: 2, taxa: 85, estado: "Em consolidação" },
];

const pendencias = [
  { tipo: "Novo docente", nome: "Dr. Manuel Silva", curso: "Engenharia Informática", urgencia: "alta" },
  { tipo: "Mudança de turma", nome: "Ana Costa", curso: "Ciências da Computação", urgencia: "média" },
  { tipo: "Projeto em revisão", nome: "Grupo Alpha", curso: "Sistemas de Informação", urgencia: "baixa" },
];

const projetos = [
  { nome: "Smart Campus App", equipa: "Equipa Alpha", estado: "Aprovado" },
  { nome: "Sistema de Gestão Académica", equipa: "DevTeam KV", estado: "Em revisão" },
  { nome: "Plataforma E-Learning", equipa: "InnovateLab", estado: "Aprovado" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="coordenador"
        mostrarVoltar={false}
        titulo="Painel do Coordenador"
        descricao="Supervisão académica, validação de pedidos e acompanhamento dos cursos da unidade orgânica."
        indicadores={[
          { titulo: "Cursos", valor: "4", observacao: "Activos" },
          { titulo: "Disciplinas", valor: "24", observacao: "Registadas" },
          { titulo: "Turmas", valor: "12", observacao: "Em funcionamento" },
          { titulo: "Aprovações", valor: "5", observacao: "Pendentes" },
        ]}
        resumos={[
          { titulo: "Curso com mais adesão", descricao: "Engenharia Informática mantém a maior concentração de estudantes.", estado: "Destaque" },
          { titulo: "Fluxo académico", descricao: "As validações de acesso estão a ser analisadas pelo coordenador.", estado: "Em curso" },
          { titulo: "Projetos em vitrine", descricao: "Submissões seleccionadas para publicação pública.", estado: "Publicados" },
        ]}
        acaoPrincipal={
          <Link
            href="/coordenador/solicitacoes"
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-bold text-emerald-100 transition hover:bg-emerald-500/15"
          >
            Ver solicitações
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
            <div className="mt-3"><span className="text-3xl font-extrabold text-slate-800">4</span><span className="text-xs text-slate-400 ml-2">ativos</span></div>
            <div className="mt-2 flex items-center gap-1 text-emerald-600 text-xs font-semibold"><TrendingUp className="h-3 w-3" /><span>+1 neste semestre</span></div>
          </div>

          <div className="group p-5 bg-white border border-slate-200 rounded-2xl hover:border-brand-green/30 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-start">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Disciplinas</span>
              <div className="p-2 bg-emerald-100 rounded-xl"><BookOpen className="h-4 w-4 text-brand-green" /></div>
            </div>
            <div className="mt-3"><span className="text-3xl font-extrabold text-slate-800">24</span><span className="text-xs text-slate-400 ml-2">registadas</span></div>
            <div className="mt-2 flex items-center gap-1 text-brand-green text-xs font-semibold"><CheckCircle className="h-3 w-3" /><span>Todas atribuídas</span></div>
          </div>

          <div className="group p-5 bg-white border border-slate-200 rounded-2xl hover:border-amber-400/30 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-start">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Turmas</span>
              <div className="p-2 bg-amber-100 rounded-xl"><Users className="h-4 w-4 text-amber-600" /></div>
            </div>
            <div className="mt-3"><span className="text-3xl font-extrabold text-slate-800">12</span><span className="text-xs text-slate-400 ml-2">ativas</span></div>
            <div className="mt-2 flex items-center gap-1 text-amber-600 text-xs font-semibold"><Users className="h-3 w-3" /><span>~320 estudantes</span></div>
          </div>

          <div className="group p-5 bg-white border border-slate-200 rounded-2xl hover:border-red-300 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-start">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Aprovações</span>
              <div className="p-2 bg-red-100 rounded-xl"><AlertTriangle className="h-4 w-4 text-red-500" /></div>
            </div>
            <div className="mt-3"><span className="text-3xl font-extrabold text-slate-800">5</span><span className="text-xs text-slate-400 ml-2">pendentes</span></div>
            <div className="mt-2 flex items-center gap-1 text-red-500 text-xs font-semibold"><Clock className="h-3 w-3" /><span>Requer atenção</span></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg text-slate-800">Cursos supervisionados</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ano 2025/2026</span>
            </div>
            <div className="space-y-3">
              {cursos.map((curso) => (
                <div key={curso.nome} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-brand-blue/20 hover:shadow-sm transition group">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-blue to-brand-green flex items-center justify-center shrink-0"><Building className="h-5 w-5 text-white" /></div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-700 truncate">{curso.nome}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{curso.alunos} estudantes · {curso.turmas} turmas</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-extrabold text-slate-800">{curso.taxa}%</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">aprovação</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-lg text-slate-800 mb-5">Métricas do semestre</h3>
            <div className="space-y-4">
              {[
                { label: "Taxa de aprovação global", valor: 90, cor: "from-emerald-500 to-emerald-400" },
                { label: "Presenças médias", valor: 82, cor: "from-brand-blue to-brand-green" },
                { label: "Satisfação docente", valor: 76, cor: "from-amber-500 to-amber-400" },
                { label: "Entregas no prazo", valor: 68, cor: "from-brand-beige to-amber-500" },
              ].map((m) => (
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
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Índice geral</span>
                <span className="text-xl font-extrabold bg-gradient-to-r from-brand-blue to-brand-green bg-clip-text text-transparent">79%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg text-slate-800">Aprovações pendentes</h3>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-600 px-2.5 py-1 rounded-full uppercase tracking-wider">5 pendentes</span>
            </div>
            <div className="space-y-3">
              {pendencias.map((item) => (
                <div key={`${item.tipo}-${item.nome}`} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-amber-300 hover:shadow-sm transition">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${item.urgencia === "alta" ? "bg-red-100" : item.urgencia === "média" ? "bg-amber-100" : "bg-brand-blue/10"}`}>
                    <AlertTriangle className={`h-4 w-4 ${item.urgencia === "alta" ? "text-red-500" : item.urgencia === "média" ? "text-amber-500" : "text-brand-blue"}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-slate-700">{item.tipo}</h4>
                    <p className="text-[11px] text-slate-400">{item.nome} · {item.curso}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg text-slate-800">Projetos da vitrine</h3>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 px-2.5 py-1 rounded-full uppercase tracking-wider">Destaque</span>
            </div>
            <div className="space-y-3">
              {projetos.map((projeto) => (
                <div key={projeto.nome} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-brand-green/30 hover:shadow-sm transition">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-green to-emerald-400 flex items-center justify-center"><FolderGit2 className="h-4 w-4 text-white" /></div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-slate-700">{projeto.nome}</h4>
                    <p className="text-[11px] text-slate-400">{projeto.equipa}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${projeto.estado === "Aprovado" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                    {projeto.estado}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
