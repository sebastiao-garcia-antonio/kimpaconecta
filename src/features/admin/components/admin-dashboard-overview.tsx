"use client";

import { AlertTriangle, CheckCircle, History, ShieldAlert, ShieldCheck, Users } from "lucide-react";

interface AdminDashboardOverviewProps {
  dashboardData: any;
  onAbrirProctoring: () => void;
}

export function AdminDashboardOverview({ dashboardData, onAbrirProctoring }: AdminDashboardOverviewProps) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Estudantes activos</span>
            <span className="text-[10px] text-emerald-500 bg-emerald-50 font-bold px-2 py-0.5 rounded-full">+4%</span>
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-4xl font-extrabold text-brand-blue">{dashboardData.metricas.totalEstudantes}</span>
            <span className="text-xs text-slate-400">alunos</span>
          </div>
          <svg className="w-full h-8 text-brand-blue/30 mt-4" viewBox="0 0 100 10" preserveAspectRatio="none">
            <path d="M0,5 Q10,1 20,8 T40,2 T60,9 T80,4 T100,7" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Corpo docente</span>
            <span className="text-[10px] text-slate-400 bg-slate-100 font-bold px-2 py-0.5 rounded-full">Estável</span>
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-4xl font-extrabold text-brand-green">{dashboardData.metricas.totalProfessores}</span>
            <span className="text-xs text-slate-400">professores</span>
          </div>
          <svg className="w-full h-8 text-brand-green/30 mt-4" viewBox="0 0 100 10" preserveAspectRatio="none">
            <path d="M0,3 Q10,8 20,2 T40,9 T60,3 T80,7 T100,4" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Coordenadores</span>
            <span className="text-[10px] text-slate-400 bg-slate-100 font-bold px-2 py-0.5 rounded-full">Gestores</span>
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-4xl font-extrabold text-brand-beige">{dashboardData.metricas.totalCoordenadores}</span>
            <span className="text-xs text-slate-400">de cursos</span>
          </div>
          <svg className="w-full h-8 text-brand-beige/30 mt-4" viewBox="0 0 100 10" preserveAspectRatio="none">
            <path d="M0,7 Q10,3 20,8 T40,4 T60,7 T80,3 T100,9" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Fraudes e proctoring</span>
            <span className="text-[10px] text-red-500 bg-red-50 font-bold px-2 py-0.5 rounded-full">Crítico</span>
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-4xl font-extrabold text-red-600">{dashboardData.metricas.totalAlertasProctoring}</span>
            <span className="text-xs text-slate-400">alertas</span>
          </div>
          <svg className="w-full h-8 text-red-500/30 mt-4" viewBox="0 0 100 10" preserveAspectRatio="none">
            <path d="M0,9 Q10,1 20,9 T40,1 T60,9 T80,1 T100,9" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-red-600" />
              <h3 className="font-extrabold text-lg">Alertas de fraude académica</h3>
            </div>
            <button onClick={onAbrirProctoring} className="text-brand-blue text-xs font-bold hover:underline">
              Ver todos os registos
            </button>
          </div>

          {dashboardData.logsSegurancaRecentes.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <ShieldCheck className="h-10 w-10 mx-auto text-emerald-500 mb-2" />
              <p className="text-sm">Nenhuma ocorrência suspeita nas sessões de provas activas.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dashboardData.logsSegurancaRecentes.map((log: any) => (
                <div key={log.id} className="flex justify-between items-start p-4 border border-slate-200 bg-slate-50 rounded-xl hover:bg-slate-800/40 transition">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-red-100 text-red-600 border border-red-900 uppercase">
                        {log.tipoEvento.replace(/_/g, " ")}
                      </span>
                      <span className="text-sm font-bold">{log.estudanteNome}</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      <strong>Prova:</strong> {log.provaTitulo} | <strong>Evento:</strong> {log.descricao}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {new Date(log.dataRegisto).toLocaleTimeString("pt-PT")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-extrabold text-lg mb-6 flex items-center gap-2">
            <History className="h-5 w-5 text-brand-green" />
            Auditoria de ações
          </h3>
          {dashboardData.logsAuditoriaRecentes.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">Nenhum log de alteração registado.</p>
          ) : (
            <div className="relative border-l border-slate-200 ml-3 space-y-6">
              {dashboardData.logsAuditoriaRecentes.map((log: any) => (
                <div key={log.id} className="relative pl-6">
                  <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-brand-green" />
                  <div className="text-xs text-slate-400">{new Date(log.dataRegisto).toLocaleTimeString("pt-PT")}</div>
                  <h4 className="text-sm font-bold mt-1 text-slate-700 dark:text-slate-600">{log.acao}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{log.descricao}</p>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-1">por {log.usuarioNome}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
