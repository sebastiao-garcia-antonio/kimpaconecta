import { prisma } from "@/lib/prisma";

function serializar<T>(valor: T): T {
  return JSON.parse(JSON.stringify(valor, (_chave, item) => (typeof item === "bigint" ? Number(item) : item)));
}

export class NotificationsRepository {
  static async listarNotificacoesDoUsuario(idUsuario: number) {
    const notificacoes = await prisma.notificacao.findMany({
      where: { idUsuario },
      orderBy: [{ lida: "asc" }, { dataEnvio: "desc" }],
      take: 50,
    });

    return serializar(notificacoes);
  }

  static async contarNaoLidas(idUsuario: number) {
    return prisma.notificacao.count({ where: { idUsuario, lida: false } });
  }

  static async criar(dados: {
    idUsuario: number;
    titulo: string;
    mensagem: string;
    tipo?: string;
    prioridade?: string;
  }) {
    return prisma.notificacao.create({
      data: {
        ...dados,
        tipo: dados.tipo || "informacao",
        prioridade: dados.prioridade || "normal",
      },
    });
  }

  static async marcarComoLida(idUsuario: number, idNotificacao: number) {
    const resultado = await prisma.notificacao.updateMany({
      where: { idNotificacao: BigInt(idNotificacao), idUsuario, lida: false },
      data: { lida: true },
    });

    return resultado.count > 0;
  }

  static async marcarTodasComoLidas(idUsuario: number) {
    const resultado = await prisma.notificacao.updateMany({
      where: { idUsuario, lida: false },
      data: { lida: true },
    });

    return resultado.count;
  }
}