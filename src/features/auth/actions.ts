"use server";

import { AuthRepository } from "./repositories/auth.repository";
import { registroSchema, loginSchema } from "./schemas";
import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { validarVariosTextosSeguros } from "@/lib/validacao-texto";

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

  try {
    const res = await signIn("credentials", {
      identifier,
      password,
      redirect: false,
    });

    if (res && typeof res === "object" && "error" in res && (res as any).error) {
      return { error: "Identificador ou senha incorretos." };
    }

    return { success: true };
  } catch (error: any) {
    const errorStr = String(error?.message || error?.digest || error?.name || error || "");
    const isRedirect =
      errorStr.includes("NEXT_REDIRECT") ||
      error?.digest?.startsWith("NEXT_REDIRECT") ||
      error?.name === "RedirectError";

    if (isRedirect) {
      return { success: true };
    }

    if (error?.type === "CredentialsSignin" || error instanceof AuthError || error?.name === "CredentialsSignin") {
      return { error: "Identificador ou senha incorretos." };
    }

    console.error("Erro inesperado no loginUsuarioAction:", error);
    return { error: "Identificador ou senha incorretos." };
  }
}
