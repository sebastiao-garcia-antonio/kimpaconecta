"use client";

import { useState } from "react";
import { Download, Loader2, FileText } from "lucide-react";

interface RegistoNota {
  idHistorico?: number | string | bigint;
  anoLectivo: number;
  notaFinal: any;
  resultado: string;
  disciplina?: { nomeDisciplina: string; curso?: { nomeCurso: string } };
}

interface ExportarNotasBotaoProps {
  registos: RegistoNota[];
  nomeEstudante: string;
  anoLabel: string;
  media: number;
  aprovados: number;
  reprovados: number;
  taxaAprovacao: number;
}

export function ExportarNotasBotao({
  registos,
  nomeEstudante,
  anoLabel,
  media,
  aprovados,
  reprovados,
  taxaAprovacao,
}: ExportarNotasBotaoProps) {
  const [loading, setLoading] = useState(false);

  const exportar = () => {
    setLoading(true);
    const now = new Intl.DateTimeFormat("pt-PT", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date());

    const linhas = registos
      .map(
        (r, i) => `
        <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">
          <td style="padding:10px 14px;font-weight:600;color:#1e293b">${r.disciplina?.nomeDisciplina ?? "—"}</td>
          <td style="padding:10px 14px;color:#64748b">${r.disciplina?.curso?.nomeCurso ?? "—"}</td>
          <td style="padding:10px 14px;text-align:center;color:#334155">${r.anoLectivo}º</td>
          <td style="padding:10px 14px;text-align:center">
            <span style="background:#dbeafe;color:#1d4ed8;padding:3px 10px;border-radius:20px;font-weight:700;font-size:13px">
              ${Number(r.notaFinal).toFixed(2)}
            </span>
          </td>
          <td style="padding:10px 14px;text-align:center">
            <span style="background:${String(r.resultado).toLowerCase() === "aprovado" ? "#d1fae5" : "#fee2e2"};color:${String(r.resultado).toLowerCase() === "aprovado" ? "#065f46" : "#991b1b"};padding:3px 10px;border-radius:20px;font-weight:700;font-size:12px">
              ${r.resultado}
            </span>
          </td>
        </tr>`
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8"/>
  <title>Boletim de Notas — ${nomeEstudante}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, Arial, sans-serif; color: #1e293b; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1d4ed8; padding-bottom: 20px; margin-bottom: 24px; }
    .header h1 { font-size: 22px; font-weight: 900; color: #1d4ed8; }
    .header .sub { font-size: 13px; color: #64748b; margin-top: 4px; }
    .header .meta { text-align: right; font-size: 12px; color: #94a3b8; }
    .stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 24px; }
    .stat { background: #f1f5f9; border-radius: 12px; padding: 14px; text-align: center; }
    .stat .val { font-size: 24px; font-weight: 900; color: #1d4ed8; }
    .stat .lbl { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    thead { background: #1d4ed8; color: #fff; }
    thead th { padding: 12px 14px; text-align: left; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    tbody tr:hover { background: #f0f9ff; }
    .footer { margin-top: 28px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
    @media print { body { padding: 16px; } @page { margin: 1cm; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="sub">Universidade Kimpa Vita · Kimpa Connect</div>
      <h1>Boletim de Notas</h1>
      <div class="sub" style="margin-top:8px;font-weight:600;color:#334155">${nomeEstudante}</div>
      <div class="sub">${anoLabel}</div>
    </div>
    <div class="meta">
      <div>Emitido em</div>
      <div style="font-weight:600;color:#334155">${now}</div>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="val">${registos.length}</div><div class="lbl">Registos</div></div>
    <div class="stat"><div class="val">${aprovados}</div><div class="lbl">Aprovados</div></div>
    <div class="stat"><div class="val">${reprovados}</div><div class="lbl">Reprovados</div></div>
    <div class="stat"><div class="val">${media}</div><div class="lbl">Média</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Disciplina</th>
        <th>Curso</th>
        <th style="text-align:center">Ano</th>
        <th style="text-align:center">Nota Final</th>
        <th style="text-align:center">Resultado</th>
      </tr>
    </thead>
    <tbody>
      ${linhas || '<tr><td colspan="5" style="text-align:center;padding:24px;color:#94a3b8">Sem registos disponíveis</td></tr>'}
    </tbody>
  </table>

  <div class="footer">
    Documento gerado automaticamente pela plataforma Kimpa Connect · Universidade Kimpa Vita<br/>
    Taxa de aprovação: ${taxaAprovacao}%
  </div>

  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }</script>
</body>
</html>`;

    const janela = window.open("", "_blank", "width=900,height=700");
    if (janela) {
      janela.document.write(html);
      janela.document.close();
    }
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={exportar}
      disabled={loading || registos.length === 0}
      className="inline-flex items-center gap-2 rounded-xl border border-brand-blue/30 bg-brand-blue/10 px-4 py-2 text-sm font-bold text-brand-blue transition hover:bg-brand-blue hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      title={registos.length === 0 ? "Sem dados para exportar" : "Exportar boletim em PDF"}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      Exportar PDF
    </button>
  );
}
