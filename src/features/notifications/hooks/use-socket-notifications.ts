"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { connectSocketUser, getSocket } from "@/lib/socket";

export interface RealtimeNotification {
  id: number;
  titulo: string;
  mensagem: string;
  tipo: "sistema" | "mensagem" | "avaliacao" | "acesso";
  prioridade: "normal" | "alta" | "urgente";
  criadoEm: string;
  lida: boolean;
}

export interface RealtimeMessage {
  id: number;
  idGrupo: number;
  conteudo: string;
  idEmissor: number;
  emissorNome: string;
  criadoEm: string;
}

export interface TypingState {
  roomId: number;
  userId: number;
  userName: string;
  isTyping: boolean;
}

/**
 * Hook that connects to real-time events via:
 * 1. Socket.IO (preferred — for messaging, typing, etc.)
 * 2. SSE fallback via /api/notifications/stream (Vercel-compatible)
 *
 * The SSE fallback activates automatically when socket fails to connect
 * within 4 seconds (e.g. in Vercel serverless environment).
 */
export function useSocketNotifications(userId?: string | number) {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<number, string[]>>({});
  const sseRef = useRef<EventSource | null>(null);
  const socketConnectedRef = useRef(false);

  // ── Socket.IO (messaging + typing) ──
  useEffect(() => {
    if (!userId) return;

    const socket = connectSocketUser(userId);
    let sseTimer: ReturnType<typeof setTimeout> | null = null;

    const onConnect = () => {
      setIsConnected(true);
      socketConnectedRef.current = true;
      // Cancel SSE fallback if socket connected in time
      if (sseTimer) clearTimeout(sseTimer);
      // Close existing SSE if socket took over
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
    };

    const onDisconnect = () => {
      setIsConnected(false);
      socketConnectedRef.current = false;
      // Re-open SSE fallback on socket disconnect
      openSse();
    };

    const onNewNotification = (notification: RealtimeNotification) => {
      setNotifications((prev) => [notification, ...prev]);
    };

    const onNewMessage = (msg: RealtimeMessage) => {
      setMessages((prev) => [...prev, msg]);
    };

    const onUserTyping = (data: TypingState) => {
      setTypingUsers((prev) => {
        const currentList = prev[data.roomId] || [];
        if (data.isTyping && !currentList.includes(data.userName)) {
          return { ...prev, [data.roomId]: [...currentList, data.userName] };
        } else if (!data.isTyping) {
          return { ...prev, [data.roomId]: currentList.filter((name) => name !== data.userName) };
        }
        return prev;
      });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("new_notification", onNewNotification);
    socket.on("new_message", onNewMessage);
    socket.on("user_typing", onUserTyping);

    if (socket.connected) {
      setIsConnected(true);
      socketConnectedRef.current = true;
    }

    // ── SSE fallback: activate if socket doesn't connect in 4s ──
    const openSse = () => {
      if (typeof window === "undefined") return;
      if (sseRef.current) return; // already open
      try {
        const es = new EventSource("/api/notifications/stream");
        sseRef.current = es;

        es.onopen = () => {
          if (!socketConnectedRef.current) setIsConnected(true);
        };

        es.addEventListener("message", (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.tipo === "notificacao") {
              setNotifications((prev) => [
                {
                  id: data.id,
                  titulo: data.titulo,
                  mensagem: data.mensagem,
                  tipo: data.tipoNotificacao,
                  prioridade: data.prioridade,
                  criadoEm: data.criadoEm,
                  lida: data.lida,
                },
                ...prev,
              ]);
            }
          } catch { /* ignore parse errors */ }
        });

        es.onerror = () => {
          es.close();
          sseRef.current = null;
          if (!socketConnectedRef.current) setIsConnected(false);
          // Retry SSE after 10s
          setTimeout(openSse, 10000);
        };
      } catch { /* SSE not supported */ }
    };

    sseTimer = setTimeout(() => {
      if (!socketConnectedRef.current) openSse();
    }, 4000);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("new_notification", onNewNotification);
      socket.off("new_message", onNewMessage);
      socket.off("user_typing", onUserTyping);
      if (sseTimer) clearTimeout(sseTimer);
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
    };
  }, [userId]);

  const joinRoom = useCallback((roomId: number) => {
    const socket = getSocket();
    socket.emit("join_room", roomId);
  }, []);

  const leaveRoom = useCallback((roomId: number) => {
    const socket = getSocket();
    socket.emit("leave_room", roomId);
  }, []);

  const sendMessageRealtime = useCallback(
    (data: { roomId: number; message: string; senderId: number; senderName: string }) => {
      const socket = getSocket();
      socket.emit("send_message", data);
    },
    []
  );

  const sendTypingIndicator = useCallback(
    (data: { roomId: number; userId: number; userName: string; isTyping: boolean }) => {
      const socket = getSocket();
      socket.emit("typing", data);
    },
    []
  );

  return {
    isConnected,
    notifications,
    messages,
    typingUsers,
    joinRoom,
    leaveRoom,
    sendMessageRealtime,
    sendTypingIndicator,
  };
}
