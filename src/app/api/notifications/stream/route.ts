import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Max duration for Vercel hobby plan is 60s, pro plan is 300s
export const maxDuration = 55;

export async function GET(req: NextRequest) {
  const sessao = await auth();
  const idUsuario = Number(sessao?.user?.id);

  if (!sessao?.user || !Number.isInteger(idUsuario) || idUsuario <= 0) {
    return new Response("Não autorizado", { status: 401 });
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };

      // Send initial connection event
      send({ tipo: "conectado", idUsuario });

      // Track last notification seen
      let ultimaNotificacao: Date | null = null;
      try {
        const ultima = await prisma.notificacao.findFirst({
          where: { idUsuario },
          orderBy: { dataEnvio: "desc" },
          select: { dataEnvio: true },
        });
        ultimaNotificacao = ultima?.dataEnvio ?? null;
      } catch {
        // Continue even if DB fails
      }

      const POLL_INTERVAL_MS = 5000;
      const HEARTBEAT_INTERVAL_MS = 25000;

      let pollingTimer: ReturnType<typeof setTimeout> | null = null;
      let heartbeatTimer: ReturnType<typeof setTimeout> | null = null;

      const poll = async () => {
        if (closed) return;
        try {
          const where = ultimaNotificacao
            ? { idUsuario, dataEnvio: { gt: ultimaNotificacao } }
            : { idUsuario };

          const novas = await prisma.notificacao.findMany({
            where,
            orderBy: { dataEnvio: "asc" },
            take: 10,
          });

          for (const n of novas) {
            send({
              tipo: "notificacao",
              id: Number(n.idNotificacao),
              titulo: n.titulo,
              mensagem: n.mensagem,
              tipoNotificacao: n.tipo,
              prioridade: n.prioridade,
              criadoEm: n.dataEnvio.toISOString(),
              lida: n.lida,
            });
            ultimaNotificacao = n.dataEnvio;
          }
        } catch {
          // DB error — keep alive silently
        }

        if (!closed) {
          pollingTimer = setTimeout(poll, POLL_INTERVAL_MS);
        }
      };

      const heartbeat = () => {
        if (closed) return;
        send({ tipo: "heartbeat" });
        heartbeatTimer = setTimeout(heartbeat, HEARTBEAT_INTERVAL_MS);
      };

      // Start loops
      pollingTimer = setTimeout(poll, POLL_INTERVAL_MS);
      heartbeatTimer = setTimeout(heartbeat, HEARTBEAT_INTERVAL_MS);

      // Clean up on abort
      req.signal.addEventListener("abort", () => {
        closed = true;
        if (pollingTimer) clearTimeout(pollingTimer);
        if (heartbeatTimer) clearTimeout(heartbeatTimer);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
