import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Sessão inválida ou não autenticada." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum ficheiro enviado." }, { status: 400 });
    }

    // Validar tipo de ficheiro
    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!tiposPermitidos.includes(file.type)) {
      return NextResponse.json({ error: "Apenas imagens (PNG, JPG, WEBP) são permitidas." }, { status: 400 });
    }

    // Validar tamanho máximo (5MB)
    const tamanhoMaximo = 5 * 1024 * 1024;
    if (file.size > tamanhoMaximo) {
      return NextResponse.json({ error: "A imagem não pode exceder 5MB." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Definir pasta de destino
    const pastaDestino = path.join(process.cwd(), "public", "uploads", "avatars");
    await mkdir(pastaDestino, { recursive: true });

    // Nome único para a foto
    const extensao = file.name.split(".").pop() || "jpg";
    const idUsuario = session.user.id || "user";
    const nomeFicheiro = `avatar-${idUsuario}-${Date.now()}.${extensao}`;
    const caminhoCompleto = path.join(pastaDestino, nomeFicheiro);

    await writeFile(caminhoCompleto, buffer);

    const urlPublica = `/uploads/avatars/${nomeFicheiro}`;

    return NextResponse.json({
      success: true,
      url: urlPublica,
      message: "Imagem carregada com sucesso.",
    });
  } catch (error: any) {
    console.error("[UPLOAD ERROR]", error);
    return NextResponse.json({ error: "Erro ao processar o carregamento da imagem." }, { status: 500 });
  }
}
