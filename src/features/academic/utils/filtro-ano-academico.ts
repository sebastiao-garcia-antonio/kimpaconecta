export type FiltroAnoAcademico = "actual" | "historico" | number;

export function interpretarFiltroAnoAcademico(valor?: string | null): FiltroAnoAcademico {
  if (!valor || valor === "actual") return "actual";
  if (valor === "historico") return "historico";

  const ano = Number(valor);
  return Number.isFinite(ano) && ano > 0 ? ano : "actual";
}

export function normalizarFiltroAnoAcademico(
  filtro: FiltroAnoAcademico,
  anosDisponiveis: number[],
  anoActual?: number | null
): FiltroAnoAcademico {
  if (filtro === "historico") return "historico";

  const anosValidos = Array.from(new Set(anosDisponiveis)).sort((a, b) => a - b);

  if (filtro === "actual") {
    if (anoActual && anosValidos.includes(anoActual)) return anoActual;
    return anosValidos[anosValidos.length - 1] || "actual";
  }

  return anosValidos.includes(filtro) ? filtro : (anoActual && anosValidos.includes(anoActual) ? anoActual : (anosValidos[anosValidos.length - 1] || "actual"));
}

export function rotuloFiltroAnoAcademico(filtro: FiltroAnoAcademico, anoActual?: number | null) {
  if (filtro === "historico") return "Todos os anos";
  if (filtro === "actual") {
    return anoActual ? `${anoActual}º ano` : "Ano actual";
  }

  return `${filtro}º ano`;
}

export function deveFiltrarPorAno(filtro: FiltroAnoAcademico) {
  return typeof filtro === "number";
}
