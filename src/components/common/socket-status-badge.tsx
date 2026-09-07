"use client";

import { Wifi, WifiOff } from "lucide-react";
import { useSocketNotifications } from "@/features/notifications/hooks/use-socket-notifications";

interface SocketStatusBadgeProps {
  userId?: string | number;
}

export function SocketStatusBadge({ userId }: SocketStatusBadgeProps) {
  const { isConnected } = useSocketNotifications(userId);

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
        isConnected
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-amber-50 text-amber-700 border border-amber-200"
      }`}
      title={isConnected ? "Ligado ao servidor em tempo real (Socket.IO)" : "A estabelecer ligação em tempo real..."}
    >
      {isConnected ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Wifi className="h-3 w-3" />
          <span className="hidden sm:inline">Realtime Ativo</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3 animate-pulse" />
          <span className="hidden sm:inline">A conectar...</span>
        </>
      )}
    </div>
  );
}
