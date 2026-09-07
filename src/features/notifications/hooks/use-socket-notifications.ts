"use client";

import { useEffect, useState, useCallback } from "react";
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

export function useSocketNotifications(userId?: string | number) {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<number, string[]>>({});

  useEffect(() => {
    if (!userId) return;

    const socket = connectSocketUser(userId);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

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
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("new_notification", onNewNotification);
      socket.off("new_message", onNewMessage);
      socket.off("user_typing", onUserTyping);
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
