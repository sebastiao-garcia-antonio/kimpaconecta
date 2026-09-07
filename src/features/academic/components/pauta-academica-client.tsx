"use client";

import { useState } from "react";
import { Download, Printer, GraduationCap, CheckCircle2, AlertTriangle, XCircle, FileSpreadsheet, Search } from "lucide-react";
import { PautaAcademica, LinhaPautaEstudante } from "../repositories/reports.repository";

interface PautaAcademicaClientProps {
  pautaInicial: PautaAcademica;
}

export function PautaAcademicaClient({ pautaInicial }: PautaAcademicaClientProps) {
  const [pauta] = useState<PautaAcademica>(pautaInicial);
  const [filtro, setFiltro] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"TODOS" | "APROVADO" | "RECURSO" | "REPROVADO">("TODOS");

  const estudantesFiltrados = pauta.estudantes.filter((est) => {
    const combinaTexto =
      est.nomeEstudante.toLowerCase().includes(filtro.toLowerCase()) ||
      (est.numEstudante && est.numEstudante.includes(filtro)) ||
      (est.numBi && est.numBi.toLowerCase().includes(filtro.toLowerCase()));

    const combinaEstado = filtroEstado === "TODOS" || est.estadoAcademico === filtroEstado;

    return combinaTexto && combinaEstado;
  });

  const exportarExcelCSV = () => {
    const cabecalho = [
      "Nº",
      "Nº Estudante",
      "Nome Completo",
      "Número de BI",
      "Presenças (%)",
      ...pauta.disciplina.nomeDisciplina ? pauta.estudantes[0]?.notasAvaliacoes.map((a) => a.titulo) || [] : [],
      "Média Frequência",
      "Nota Final",
      "Estado Académico",
    ];

    const linhas = pauta.estudantes.map((est, idx) => [
      idx + 1,
      est.numEstudante || "-",
      `"${est.nomeEstudante}"`,
      est.numBi || "-",
      `${est.presencasPorcentagem}%`,
      ...est.notasAvaliacoes.map((n) => (n.notaObtida !== null ? n.notaObtida.toFixed(1) : "-")),
      est.mediaFrequencia.toFixed(1),
      est.notaFinal.toFixed(1),
      est.estadoAcademico,
    ]);

    const csvContent =
      "\uFEFF" +
      [cabecalho.join(";"), ...linhas.map((e) => e.join(";"))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Pauta_${pauta.disciplina.nomeDisciplina.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const imprimirPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Botões de Ação e Filtros (Ocultos na Impressão) */}
      <div className="print:hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar estudante ou BI..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as any)}
            className="rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="TODOS">Todos os Estados</option>
            <option value="APROVADO">Aprovados</option>
            <option value="RECURSO">Em Recurso</option>
            <option value="REPROVADO">Reprovados</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={exportarExcelCSV}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <FileSpreadsheet className="h-4 w-4" /> Baixar Excel (.csv)
          </button>
          <button
            type="button"
            onClick={imprimirPDF}
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-blue-dark"
          >
            <Printer className="h-4 w-4" /> Imprimir Pauta (PDF)
          </button>
        </div>
      </div>

      {/* Cartões Estatísticos da Turma (Ocultos na Impressão) */}
      <div className="print:hidden grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Estudantes</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{pauta.estatisticas.totalEstudantes}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Aprovados</p>
          <p className="mt-1 text-2xl font-black text-emerald-700">{pauta.estatisticas.aprovados} ({pauta.estatisticas.taxaAprovacao}%)</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Em Recurso</p>
          <p className="mt-1 text-2xl font-black text-amber-700">{pauta.estatisticas.recurso}</p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-700">Reprovados</p>
          <p className="mt-1 text-2xl font-black text-red-700">{pauta.estatisticas.reprovados}</p>
        </div>
      </div>

      {/* PAUTA OFICIAL IMPRESSA / DOCUMENTO OFICIAL */}
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm print:shadow-none print:border-none print:p-0">
        {/* Cabeçalho Oficial da Universidade Kimpa Vita */}
        <div className="text-center border-b border-slate-200 pb-6 mb-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-blue to-brand-green text-white shadow-md mb-3">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-lg font-black uppercase tracking-tight text-slate-900">Universidade Kimpa Vita</h1>
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-600 mt-0.5">{pauta.disciplina.nomeUo}</h2>
          <h3 className="text-xs font-bold text-slate-500 mt-0.5">Curso: {pauta.disciplina.nomeCurso}</h3>
          <div className="mt-4 inline-flex items-center gap-4 rounded-2xl bg-slate-50 px-6 py-2 text-xs font-extrabold text-slate-800 border border-slate-200">
            <span>PAUTA OFICIAL DE FREQUÊNCIA E AVALIAÇÕES</span>
            <span>·</span>
            <span>{pauta.disciplina.nomeDisciplina}</span>
            <span>·</span>
            <span>Ano Lectivo 2025/2026</span>
          </div>
        </div>

        {/* Tabela Principal da Pauta */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b-2 border-slate-800 bg-slate-100 text-slate-800 font-extrabold">
                <th className="py-3 px-2 text-center w-10">Nº</th>
                <th className="py-3 px-3">Nº Estudante</th>
                <th className="py-3 px-3">Nome do Estudante</th>
                <th className="py-3 px-3">Nº de BI</th>
                <th className="py-3 px-2 text-center">Pres. (%)</th>
                {pauta.estudantes[0]?.notasAvaliacoes.map((av) => (
                  <th key={av.idAvaliacao} className="py-3 px-2 text-center max-w-[100px] truncate" title={av.titulo}>
                    {av.titulo}
                  </th>
                ))}
                <th className="py-3 px-3 text-center">Média Freq.</th>
                <th className="py-3 px-3 text-center font-black">Nota Final</th>
                <th className="py-3 px-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {estudantesFiltrados.map((est, idx) => (
                <tr key={est.idEstudante} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-2 text-center font-bold text-slate-500">{idx + 1}</td>
                  <td className="py-3 px-3 font-semibold text-slate-700">{est.numEstudante || "-"}</td>
                  <td className="py-3 px-3 font-extrabold text-slate-900">{est.nomeEstudante}</td>
                  <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">{est.numBi || "-"}</td>
                  <td className="py-3 px-2 text-center font-bold text-slate-700">{est.presencasPorcentagem}%</td>
                  {est.notasAvaliacoes.map((n) => (
                    <td key={n.idAvaliacao} className="py-3 px-2 text-center font-semibold text-slate-800">
                      {n.notaObtida !== null ? n.notaObtida.toFixed(1) : "-"}
                    </td>
                  ))}
                  <td className="py-3 px-3 text-center font-bold text-slate-800">{est.mediaFrequencia.toFixed(1)}</td>
                  <td className="py-3 px-3 text-center font-black text-sm text-slate-950">{est.notaFinal.toFixed(1)}</td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
                        est.estadoAcademico === "APROVADO"
                          ? "bg-emerald-600 text-white"
                          : est.estadoAcademico === "RECURSO"
                          ? "bg-amber-500 text-white"
                          : "bg-red-600 text-white"
                      }`}
                    >
                      {est.estadoAcademico}
                    </span>
                  </td>
                </tr>
              ))}
              {estudantesFiltrados.length === 0 && (
                <tr>
                  <td colSpan={8 + (pauta.estudantes[0]?.notasAvaliacoes.length || 0)} className="py-8 text-center text-slate-500 italic">
                    Nenhum estudante encontrado com o filtro selecionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé Oficial para Assinaturas e Validação */}
        <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs text-slate-600">
          <div>
            <div className="h-12 border-b border-slate-400 mb-2"></div>
            <p className="font-bold text-slate-800">{pauta.docente?.nome || "O Docente da Cadeira"}</p>
            <p className="text-[10px] text-slate-400">Assinatura do Professor</p>
          </div>
          <div>
            <div className="h-12 border-b border-slate-400 mb-2"></div>
            <p className="font-bold text-slate-800">{pauta.coordenador?.nome || "O Coordenador do Curso"}</p>
            <p className="text-[10px] text-slate-400">Validação Pedagógica</p>
          </div>
          <div>
            <div className="h-12 border-b border-slate-400 mb-2"></div>
            <p className="font-bold text-slate-800">Direção Académica UKV</p>
            <p className="text-[10px] text-slate-400">Carimbo e Homologação</p>
          </div>
        </div>
      </div>
    </div>
  );
}
