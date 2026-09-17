import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

type ConfiguracaoTipo = {
  pasta: string;
  tiposPermitidos: string[];
  tamanhoMaximo: number;
};

const tiposImagem = ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/gif"];
const tiposDocumentos = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/x-zip-compressed",
];

const configuracaoPorTipo: Record<string, ConfiguracaoTipo> = {
  avatar: {
    pasta: "avatars",
    tiposPermitidos: tiposImagem,
    tamanhoMaximo: 5 * 1024 * 1024,
  },
  publicacao: {
    pasta: "publicacoes",
    tiposPermitidos: [...tiposImagem, ...tiposDocumentos],
    tamanhoMaximo: 10 * 1024 * 1024,
  },
  ficheiro: {
    pasta: "ficheiros",
    tiposPermitidos: [...tiposImagem, ...tiposDocumentos],
    tamanhoMaximo: 10 * 1024 * 1024,
  },
  projeto: {
    pasta: "projetos",
    tiposPermitidos: [...tiposImagem, ...tiposDocumentos],
    tamanhoMaximo: 10 * 1024 * 1024,
  },
};

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Sessão inválida ou não autenticada." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const tipo = String(formData.get("tipo") || "avatar");

    if (!file) {
      return NextResponse.json({ error: "Nenhum ficheiro enviado." }, { status: 400 });
    }

    const configuracao = configuracaoPorTipo[tipo] || configuracaoPorTipo.avatar;

    if (!configuracao.tiposPermitidos.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Tipo de ficheiro não permitido. Envie uma imagem (PNG, JPG, WEBP, GIF) ou um documento (PDF, DOC, XLS, PPT, TXT, ZIP).",
        },
        { status: 400 }
      );
    }

    if (file.size > configuracao.tamanhoMaximo) {
      const mb = Math.round(configuracao.tamanhoMaximo / (1024 * 1024));
      return NextResponse.json({ error: `O ficheiro não pode exceder ${mb}MB.` }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Definir pasta de destino
    const pastaDestino = path.join(process.cwd(), "public", "uploads", configuracao.pasta);
    await mkdir(pastaDestino, { recursive: true });

    // Nome único para o ficheiro
    const extensao = (file.name.split(".").pop() || "bin").replace(/[^a-zA-Z0-9]/g, "");
    const idUsuario = session.user.id || "user";
    const nomeFicheiro = `${tipo}-${idUsuario}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensao}`;
    const caminhoCompleto = path.join(pastaDestino, nomeFicheiro);

    await writeFile(caminhoCompleto, buffer);

    const urlPublica = `/uploads/${configuracao.pasta}/${nomeFicheiro}`;

    return NextResponse.json({
      success: true,
      url: urlPublica,
      nome: file.name,
      tipo: file.type,
      message: "Ficheiro carregado com sucesso.",
    });
  } catch (error: any) {
    console.error("[UPLOAD ERROR]", error);
    return NextResponse.json({ error: "Erro ao processar o carregamento do ficheiro." }, { status: 500 });
  }
}