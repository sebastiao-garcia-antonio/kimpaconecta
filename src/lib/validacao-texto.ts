type ResultadoValidacaoSucesso = {
  ok: true;
  valor: string;
};

type ResultadoValidacaoErro = {
  ok: false;
  erro: string;
};

type ResultadoValidacao = ResultadoValidacaoSucesso | ResultadoValidacaoErro;

type ResultadoValidacaoCamposSucesso = {
  ok: true;
  valor: Record<string, string>;
};

type ResultadoValidacaoCamposErro = {
  ok: false;
  erro: string;
};

type ResultadoValidacaoCampos = ResultadoValidacaoCamposSucesso | ResultadoValidacaoCamposErro;

const PADROES_BLOQUEADOS = [
  /<\s*script\b/i,
  /<\/\s*script\s*>/i,
  /\bon[a-z]+\s*=/i,
  /\bjavascript\s*:/i,
  /\bdata\s*:\s*text\/html\b/i,
  /\balert\s*\(/i,
  /\bconfirm\s*\(/i,
  /\bprompt\s*\(/i,
  /\beval\s*\(/i,
  /\bdocument\./i,
  /\bwindow\./i
];

// Formato oficial do Bilhete de Identidade (BI) de Angola: 9 dígitos + 2 letras maiúsculas + 3 dígitos (Ex: 000000000UE000 - Total: 14 caracteres)
export const REGEX_BI_ANGOLA = /^\d{9}[a-zA-Z]{2}\d{3}$/;

/**
 * Aplica máscara rigorosa em tempo real para o BI de Angola:
 * Posições 0..8 (1º ao 9º): Apenas dígitos (0-9)
 * Posições 9..10 (10º e 11º): Apenas letras (A-Z), convertidas em maiúsculas
 * Posições 11..13 (12º ao 14º): Apenas dígitos (0-9)
 */
export function formatarMascaraBIAngola(input: string): string {
  const limpo = input.toUpperCase().replace(/[^0-9A-Z]/g, "");
  let resultado = "";

  for (let i = 0; i < limpo.length && i < 14; i++) {
    const char = limpo[i];

    if (i < 9) {
      if (/[0-9]/.test(char)) {
        resultado += char;
      }
    } else if (i === 9 || i === 10) {
      if (/[A-Z]/.test(char)) {
        resultado += char;
      }
    } else if (i >= 11 && i < 14) {
      if (/[0-9]/.test(char)) {
        resultado += char;
      }
    }
  }

  return resultado;
}

export function validarBIAngola(valor: unknown): boolean {
  const bi = String(valor ?? "").trim();
  if (!bi) return true; // campo opcional
  return REGEX_BI_ANGOLA.test(bi);
}

export function validarTextoSeguro(
  valor: unknown,
  nomeCampo = "campo",
  opcoes?: { obrigatorio?: boolean; maxLength?: number }
): ResultadoValidacao {
  const texto = String(valor ?? "").trim().replace(/\s+/g, " ");

  if (opcoes?.obrigatorio && !texto) {
    return { ok: false, erro: `${nomeCampo} é obrigatório.` };
  }

  if (!texto) {
    return { ok: true, valor: "" };
  }

  if (opcoes?.maxLength && texto.length > opcoes.maxLength) {
    return { ok: false, erro: `${nomeCampo} excede o tamanho permitido.` };
  }

  if (PADROES_BLOQUEADOS.some((padrao) => padrao.test(texto))) {
    return { ok: false, erro: `${nomeCampo} contém conteúdo não permitido.` };
  }

  return { ok: true, valor: texto };
}

export function validarVariosTextosSeguros(
  campos: Array<{ nome: string; valor: unknown; obrigatorio?: boolean; maxLength?: number }>
): ResultadoValidacaoCampos {
  const resultado: Record<string, string> = {};

  for (const campo of campos) {
    const validacao = validarTextoSeguro(campo.valor, campo.nome, {
      obrigatorio: campo.obrigatorio,
      maxLength: campo.maxLength
    });

    if (!validacao.ok) {
      return { ok: false, erro: validacao.erro };
    }

    resultado[campo.nome] = validacao.valor;
  }

  return { ok: true, valor: resultado };
}
