"use server";

import { AuthRepository } from "./repositories/auth.repository";
import { registroSchema, loginSchema } from "./schemas";
import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { validarVariosTextosSeguros } from "@/lib/validacao-texto";
import { enviarEmail } from "@/lib/email";
import { obterDestinoPorPapel } from "@/lib/destino-papel";

const CODIGO_VALIDADE_MINUTOS = 15;

function gerarCodigoSeisDigitos(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function criarSolicitacaoAcesso(formData: any) {
  const result = registroSchema.safeParse(formData);
  if (!result.success) {
    return { error: "Dados inválidos nos campos fornecidos." };
  }

  const validacaoTexto = validarVariosTextosSeguros([
    { nome: "nomeCompleto", valor: result.data.nomeCompleto, obrigatorio: true, maxLength: 120 },
    { nome: "email", valor: result.data.email, obrigatorio: true, maxLength: 120 },
    { nome: "numEstudante", valor: result.data.numEstudante, obrigatorio: true, maxLength: 60 },
    { nome: "numBi", valor: result.data.numBi, maxLength: 40 },
    { nome: "telefone", valor: result.data.telefone, maxLength: 40 }
  ]);

  if (!validacaoTexto.ok) {
    return { error: validacaoTexto.erro };
  }

  const { nomeCompleto, email, numEstudante, numBi, telefone, senhaProvisoria, idUo, idCurso, idTurma } = result.data;
  
  try {
    await AuthRepository.inicializarPerfis();

    const cursoId = Number(idCurso);
    const unidadeId = Number(idUo);
    const turmaId = idTurma ? Number(idTurma) : null;

    if (!cursoId || !unidadeId || !turmaId) {
      return { error: "Selecione instituição, curso e turma antes de enviar o pedido." };
    }

    const cursos = await AuthRepository.listarCursosPorUnidade(unidadeId);
    const cursoSelecionado = cursos.find((curso: any) => curso.id === cursoId);

    if (!cursoSelecionado) {
      return { error: "O curso selecionado não pertence à instituição indicada." };
    }

    const turmas = await AuthRepository.listarTurmasPorCurso(cursoId);
    const turmaSelecionada = turmas.find((turma: any) => turma.id === turmaId);

    if (!turmaSelecionada) {
      return { error: "A turma selecionada não pertence ao curso escolhido." };
    }

    const hashed = await bcrypt.hash(senhaProvisoria, 10);
    const count = await AuthRepository.countUsuarios();

    if (count === 0) {
      await AuthRepository.registrarUsuarioDireto({
        nome: nomeCompleto,
        email,
        senha: hashed,
        numEstudanteLogin: numEstudante,
        numBi: numBi || undefined,
        telefone: telefone || undefined,
        perfilNome: "admin"
      });
      return { 
        success: true, 
        message: "Primeiro utilizador registado com sucesso como ADMINISTRADOR! Pode fazer login diretamente." 
      };
    } else {
      await AuthRepository.registrarSolicitacaoAcesso({
        nomeCompleto,
        email,
        numEstudante,
        numBi: numBi || undefined,
        telefone: telefone || undefined,
        senhaProvisoria: hashed,
        idCurso: cursoId,
        idTurma: turmaId
      });
      return { 
        success: true, 
        message: "Pedido de acesso enviado com sucesso. Aguarde a aprovação do coordenador do curso." 
      };
    }
  } catch (error: any) {
    console.error("Erro no cadastro:", error);
    return { error: "Erro ao criar conta ou e-mail/número de estudante já existente." };
  }
}

export async function loginUsuarioAction(data: { identifier: string; password: string }) {
  const result = loginSchema.safeParse(data);
  if (!result.success) {
    return { error: "Identificador ou senha em formato inválido." };
  }

  const validacaoTexto = validarVariosTextosSeguros([
    { nome: "identificador", valor: result.data.identifier, obrigatorio: true, maxLength: 120 }
  ]);

  if (!validacaoTexto.ok) {
    return { error: validacaoTexto.erro };
  }

  const { identifier, password } = result.data;

  let destino = "/estudante";

  try {
    const utilizador = await AuthRepository.findUserByIdentifier(identifier);
    if (!utilizador) {
      return { error: "Identificador ou senha incorretos." };
    }
    if (utilizador.status !== "ativo") {
      return { error: "Esta conta ainda não está ativa. Contacte o administrador ou aguarde aprovação." };
    }

    const senhaCorreta = await bcrypt.compare(password, utilizador.senha);
    if (!senhaCorreta) {
      return { error: "Identificador ou senha incorretos." };
    }

    const papeis = utilizador.perfis?.map((p: any) => p.perfil.nomePerfil) ?? [];
    destino = obterDestinoPorPapel(papeis);
  } catch (err: any) {
    console.error("Erro ao validar credenciais do utilizador:", err);
    return { error: "Erro ao comunicar com a base de dados. Tente novamente." };
  }

  try {
    const res = await signIn("credentials", {
      identifier,
      password,
      redirect: false,
    });

    if (res && typeof res === "object" && "error" in res && (res as any).error) {
      return { error: "Identificador ou senha incorretos." };
    }

    return { success: true, destino };
  } catch (error: any) {
    const errorStr = String(error?.message || error?.digest || error?.name || error || "");
    const isRedirect =
      errorStr.includes("NEXT_REDIRECT") ||
      error?.digest?.startsWith("NEXT_REDIRECT") ||
      error?.name === "RedirectError";

    if (isRedirect) {
      return { success: true, destino };
    }

    if (error?.type === "CredentialsSignin" || error instanceof AuthError || error?.name === "CredentialsSignin") {
      return { error: "Identificador ou senha incorretos." };
    }

    console.error("Erro inesperado no signIn:", error);
    return { success: true, destino };
  }
}

export async function solicitarRecuperacaoSenha(data: { email: string }) {
  const email = String(data?.email || "").trim().toLowerCase();

  const validacaoTexto = validarVariosTextosSeguros([
    { nome: "email", valor: email, obrigatorio: true, maxLength: 120 }
  ]);

  if (!validacaoTexto.ok) return { error: validacaoTexto.erro };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Insira um e-mail válido." };
  }

  try {
    const user = await AuthRepository.findUserByEmail(email);
    if (!user) {
      return { error: "Não encontrámos nenhuma conta associada a este e-mail." };
    }
    if (user.status !== "ativo") {
      return { error: "Esta conta não está ativa. Contacte o coordenador do curso." };
    }

    const codigo = gerarCodigoSeisDigitos();
    const tokenHash = await bcrypt.hash(codigo, 10);
    const expiraEm = new Date(Date.now() + CODIGO_VALIDADE_MINUTOS * 60 * 1000);

    await AuthRepository.invalidarRecuperacoesDoUsuario(user.id);
    await AuthRepository.criarCodigoRecuperacao(user.id, tokenHash, expiraEm);

    const mensagem = [
      `Olá, ${user.nome}.`,
      "",
      "Recebemos um pedido para redefinir a senha da sua conta na Kimpa Connect.",
      `O seu código de verificação é: ${codigo}`,
      "",
      `Este código é válido durante ${CODIGO_VALIDADE_MINUTOS} minutos.`,
      "Se não solicitou esta alteração, ignore este e-mail.",
    ].join("\n");

    const resposta = await enviarEmail(user.email, "Código de recuperação de senha", mensagem);

    if (resposta && (resposta as any).skipped) {
      console.warn(`[RECUPERACAO] SMTP não configurado. Código para ${user.email}: ${codigo}`);
    } else if (!resposta?.success) {
      return { error: "Não foi possível enviar o e-mail de recuperação. Tente novamente." };
    }

    return {
      success: true,
      message: `Enviámos um código de 6 dígitos para ${user.email}.`,
    };
  } catch (error) {
    console.error("Erro ao solicitar recuperação de senha:", error);
    return { error: "Não foi possível processar o pedido. Tente novamente." };
  }
}

export async function verificarCodigoRecuperacao(data: { email: string; codigo: string }) {
  const email = String(data?.email || "").trim().toLowerCase();
  const codigo = String(data?.codigo || "").trim();

  if (!email) return { error: "E-mail inválido." };
  if (!/^\d{6}$/.test(codigo)) return { error: "O código deve ter 6 dígitos." };

  try {
    const user = await AuthRepository.findUserByEmail(email);
    if (!user) return { error: "Não encontrámos nenhuma conta associada a este e-mail." };

    const registro = await AuthRepository.obterRecuperacaoPendente(user.id);
    if (!registro) {
      return { error: "Código inválido ou expirado. Solicite um novo código." };
    }

    const valido = await bcrypt.compare(codigo, registro.token);
    if (!valido) return { error: "Código incorreto. Verifique e tente novamente." };

    return { success: true };
  } catch (error) {
    console.error("Erro ao verificar código de recuperação:", error);
    return { error: "Não foi possível validar o código. Tente novamente." };
  }
}

export async function redefinirSenhaComCodigo(data: {
  email: string;
  codigo: string;
  novaSenha: string;
  confirmarSenha: string;
}) {
  const email = String(data?.email || "").trim().toLowerCase();
  const codigo = String(data?.codigo || "").trim();
  const novaSenha = String(data?.novaSenha || "");
  const confirmarSenha = String(data?.confirmarSenha || "");

  if (!email) return { error: "E-mail inválido." };
  if (!/^\d{6}$/.test(codigo)) return { error: "O código deve ter 6 dígitos." };
  if (novaSenha.length < 6) return { error: "A senha deve ter pelo menos 6 caracteres." };
  if (novaSenha !== confirmarSenha) return { error: "As senhas não coincidem." };

  try {
    const user = await AuthRepository.findUserByEmail(email);
    if (!user) return { error: "Não encontrámos nenhuma conta associada a este e-mail." };

    const registro = await AuthRepository.obterRecuperacaoPendente(user.id);
    if (!registro) {
      return { error: "Código inválido ou expirado. Solicite um novo código." };
    }

    const valido = await bcrypt.compare(codigo, registro.token);
    if (!valido) return { error: "Código incorreto. Verifique e tente novamente." };

    const senhaHash = await bcrypt.hash(novaSenha, 10);
    await AuthRepository.atualizarSenhaUsuario(user.id, senhaHash);
    await AuthRepository.marcarRecuperacaoUtilizada(registro.idRecuperacao);

    return { success: true, message: "Senha redefinida com sucesso. Já pode iniciar sessão." };
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    return { error: "Não foi possível redefinir a senha. Tente novamente." };
  }
}
