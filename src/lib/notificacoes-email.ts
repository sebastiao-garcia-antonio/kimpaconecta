import { enviarEmail } from "@/lib/email";

type SolicitacaoPendenciaEmail = {
  nomeEstudante: string;
  emailEstudante: string;
  nomeCurso: string;
  nomeUnidade: string;
  nomeCoordenador?: string | null;
  emailCoordenador?: string | null;
};

type SolicitacaoDecisaoEmail = {
  nomeEstudante: string;
  emailEstudante: string;
  nomeCurso: string;
  nomeUnidade: string;
  aprovado: boolean;
  nomeCoordenador?: string | null;
};

export async function enviarEmailSolicitacaoPendente(dados: SolicitacaoPendenciaEmail) {
  const assuntoEstudante = "Recebemos o seu pedido de acesso";
  const mensagemEstudante = [
    `Olá, ${dados.nomeEstudante}.`,
    "Recebemos o seu pedido de acesso à plataforma Kimpa Connect.",
    `Instituição: ${dados.nomeUnidade}`,
    `Curso: ${dados.nomeCurso}`,
    "O seu pedido está pendente de validação pelo coordenador do curso.",
    "Assim que houver uma decisão, receberá outro email com o resultado.",
  ].join("\n");

  const resultados = [] as Array<{ destinatario: string; sucesso: boolean }>;

  try {
    const respostaEstudante = await enviarEmail(dados.emailEstudante, assuntoEstudante, mensagemEstudante);
    resultados.push({ destinatario: dados.emailEstudante, sucesso: Boolean(respostaEstudante.success) });
  } catch (error) {
    console.error("[EMAIL] Falha ao enviar email ao estudante:", error);
    resultados.push({ destinatario: dados.emailEstudante, sucesso: false });
  }

  if (dados.emailCoordenador) {
    try {
      const assuntoCoordenador = "Novo pedido de acesso para validação";
      const mensagemCoordenador = [
        `Olá, ${dados.nomeCoordenador || "Coordenador"}.`,
        "Existe um novo pedido de acesso à plataforma que requer a sua validação.",
        `Estudante: ${dados.nomeEstudante}`,
        `Email: ${dados.emailEstudante}`,
        `Instituição: ${dados.nomeUnidade}`,
        `Curso: ${dados.nomeCurso}`,
        "Por favor, consulte a área do coordenador para aprovar ou rejeitar o pedido.",
      ].join("\n");

      const respostaCoordenador = await enviarEmail(dados.emailCoordenador, assuntoCoordenador, mensagemCoordenador);
      resultados.push({ destinatario: dados.emailCoordenador, sucesso: Boolean(respostaCoordenador.success) });
    } catch (error) {
      console.error("[EMAIL] Falha ao enviar email ao coordenador:", error);
      resultados.push({ destinatario: dados.emailCoordenador, sucesso: false });
    }
  }

  return resultados;
}

export async function enviarEmailDecisaoSolicitacao(dados: SolicitacaoDecisaoEmail) {
  const estado = dados.aprovado ? "aprovado" : "rejeitado";
  const assunto = dados.aprovado ? "O seu pedido foi aprovado" : "O seu pedido foi rejeitado";
  const mensagem = [
    `Olá, ${dados.nomeEstudante}.`,
    `O seu pedido de acesso ao curso ${dados.nomeCurso} (${dados.nomeUnidade}) foi ${estado}.`,
    dados.aprovado
      ? "Pode agora entrar na plataforma e concluir a configuração do seu perfil."
      : "Se considerar necessário, pode submeter novamente o pedido com dados corrigidos.",
    dados.nomeCoordenador ? `Decisão registada pelo coordenador: ${dados.nomeCoordenador}.` : "",
  ].filter(Boolean).join("\n");

  try {
    const resposta = await enviarEmail(dados.emailEstudante, assunto, mensagem);
    return { sucesso: Boolean(resposta.success) };
  } catch (error) {
    console.error("[EMAIL] Falha ao enviar email de decisão:", error);
    return { sucesso: false };
  }
}
