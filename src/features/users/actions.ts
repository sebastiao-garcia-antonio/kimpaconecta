"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { validarVariosTextosSeguros } from "@/lib/validacao-texto";
import { UsersRepository } from "./repositories/users.repository";

type DadosPerfil = {
  nome: string;
  bio?: string;
  telefone?: string;
  numBi?: string;
  fotoPerfil?: string;
};

function validarFotoPerfil(urlFoto?: string) {
  if (!urlFoto) return null;

  // Permitir caminhos relativos de uploads locais (ex: /uploads/avatars/...)
  if (urlFoto.startsWith("/")) return null;

  try {
    const url = new URL(urlFoto);
    return ["http:", "https:"].includes(url.protocol)
      ? null
      : "A foto deve usar um endereço http ou https válido.";
  } catch {
    return "Introduza um endereço válido para a foto de perfil.";
  }
}

function validarDadosPerfil(data: DadosPerfil) {
  const validacao = validarVariosTextosSeguros([
    { nome: "nome", valor: data.nome, obrigatorio: true, maxLength: 120 },
    { nome: "bio", valor: data.bio, maxLength: 500 },
    { nome: "telefone", valor: data.telefone, maxLength: 40 },
    { nome: "numBi", valor: data.numBi, maxLength: 40 },
    { nome: "fotoPerfil", valor: data.fotoPerfil, maxLength: 500 },
  ]);

  if (!validacao.ok) return { erro: validacao.erro };

  const dados = validacao.valor as Record<string, string>;
  const erroFoto = validarFotoPerfil(dados.fotoPerfil);
  if (erroFoto) return { erro: erroFoto };

  return {
    dados: {
      nome: dados.nome,
      bio: dados.bio || undefined,
      telefone: dados.telefone || undefined,
      numBi: dados.numBi || undefined,
      fotoPerfil: dados.fotoPerfil || undefined,
    },
  };
}

async function obterSessaoValida() {
  const sessao = await auth();
  const idUsuario = Number(sessao?.user?.id);

  if (!Number.isInteger(idUsuario) || idUsuario <= 0) return null;

  return {
    idUsuario,
    papeis: (sessao?.user as { roles?: string[] }).roles || [],
  };
}

function erroDePerfil(error: unknown) {
  if ((error as { code?: string })?.code === "P2002") {
    return "Este número de BI já está associado a outro utilizador.";
  }

  return "Não foi possível atualizar o perfil. Tente novamente.";
}

export async function atualizarMeuPerfilServer(data: DadosPerfil) {
  try {
    const sessao = await obterSessaoValida();
    if (!sessao) return { error: "Sessão inválida. Inicie sessão novamente." };

    const resultado = validarDadosPerfil(data);
    if (resultado.erro) return { error: resultado.erro };

    const perfil = await UsersRepository.atualizarPerfilBase({
      idUsuario: sessao.idUsuario,
      ...resultado.dados!,
    });

    revalidatePath("/perfil");
    revalidatePath("/");
    return { success: true, data: perfil };
  } catch (error) {
    return { error: erroDePerfil(error) };
  }
}

export async function atualizarPerfilEstudanteServer(data: DadosPerfil & { habilidadeIds: number[] }) {
  try {
    const sessao = await obterSessaoValida();
    if (!sessao) return { error: "Sessão inválida. Inicie sessão novamente." };
    if (!sessao.papeis.includes("estudante")) {
      return { error: "Apenas estudantes podem alterar competências académicas." };
    }

    const resultado = validarDadosPerfil(data);
    if (resultado.erro) return { error: resultado.erro };

    const habilidadeIds = Array.isArray(data.habilidadeIds)
      ? Array.from(new Set(data.habilidadeIds.map(Number)))
      : [];
    if (habilidadeIds.some((id) => !Number.isInteger(id) || id <= 0)) {
      return { error: "Foram recebidas habilidades inválidas." };
    }

    const perfil = await UsersRepository.atualizarPerfilEstudante({
      idUsuario: sessao.idUsuario,
      ...resultado.dados!,
      habilidadeIds,
    });

    revalidatePath("/estudante/portfolio");
    revalidatePath("/estudante");
    revalidatePath("/perfil");
    return { success: true, data: perfil };
  } catch (error) {
    return { error: erroDePerfil(error) };
  }
}