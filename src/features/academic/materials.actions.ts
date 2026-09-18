"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validarTextoSeguro } from "@/lib/validacao-texto";

async function obterIdUsuario() {
  const sessao = await auth();
  const idUsuario = Number(sessao?.user?.id);
  const papeis = (sessao?.user as { roles?: string[] } | undefined)?.roles || [];
  return Number.isInteger(idUsuario) && idUsuario > 0 ? { idUsuario, papeis } : null;
}

export async function publicarMaterialDidaticoServer(data: {
  idDisciplina: number;
  titulo: string;
  descricao?: string;
  tipoMaterial: string;
  urlArquivo: string;
  tamanhoArquivo?: string;
}) {
  const usuario = await obterIdUsuario();
  if (!usuario || (!usuario.papeis.includes("admin") && !usuario.papeis.includes("coordenador") && !usuario.papeis.includes("professor"))) {
    return { error: "Apenas docentes podem publicar materiais didáticos." };
  }

  const validTitulo = validarTextoSeguro(data.titulo, "O título do material", { obrigatorio: true, maxLength: 150 });
  if (!validTitulo.ok) return { error: validTitulo.erro };

  if (!data.urlArquivo) return { error: "Indique o ficheiro PDF/Material a publicar." };

  const material = await prisma.materialDidatico.create({
    data: {
      idDisciplina: Number(data.idDisciplina),
      idProfessor: usuario.idUsuario,
      titulo: validTitulo.valor,
      descricao: data.descricao || null,
      tipoMaterial: data.tipoMaterial || "PDF",
      urlArquivo: data.urlArquivo,
      tamanhoArquivo: data.tamanhoArquivo || null,
    },
  });

  revalidatePath("/estudante/biblioteca");
  revalidatePath("/professor/materials");
  return { success: true, data: { idMaterial: Number(material.idMaterial) } };
}
