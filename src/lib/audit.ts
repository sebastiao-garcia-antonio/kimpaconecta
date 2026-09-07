import { prisma } from "@/lib/prisma";

export async function registrarAuditoria(payload: {
  idUsuario?: number | null;
  acao: string;
  tabelaAfetada: string;
  idRegistroAfetado?: number | bigint | null;
  descricao?: string;
  ip?: string;
}) {
  try {
    await prisma.auditoriaSistema.create({
      data: {
        idUsuario: payload.idUsuario || null,
        acao: payload.acao,
        tabelaAfetada: payload.tabelaAfetada,
        idRegistroAfetado: payload.idRegistroAfetado ? BigInt(payload.idRegistroAfetado) : null,
        descricao: payload.descricao || null,
        ip: payload.ip || "127.0.0.1",
      },
    });
  } catch (err) {
    console.error("[AUDIT ERROR]", err);
  }
}
