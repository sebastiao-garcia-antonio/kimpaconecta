"use client";

import { useEffect, useState, useCallback } from "react";

export function useProctoring(idTentativa: number, onFocusLost?: () => void) {
  const [focusLossCount, setFocusLossCount] = useState(0);
  const [copyAttempts, setCopyAttempts] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const sendLog = useCallback(
    (tipoEvento: string, descricao: string) => {
      fetch("/api/proctoring/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idTentativa,
          tipoEvento,
          descricao,
        }),
      }).catch((err) => console.error("[PROCTORING LOG ERROR]", err));
    },
    [idTentativa]
  );

  useEffect(() => {
    if (!idTentativa) return;

    // 1. Mudança de separador/aba ativa
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setFocusLossCount((prev) => prev + 1);
        if (onFocusLost) onFocusLost();
        sendLog("perda_de_foco", "O estudante saiu da aba ativa do exame.");
      }
    };

    // 2. Bloqueio e registo de cópia (Ctrl+C / Cmd+C)
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      setCopyAttempts((prev) => prev + 1);
      sendLog("tentativa_copiar", "Tentativa de copiar texto do exame.");
    };

    // 3. Bloqueio e registo de colagem (Ctrl+V / Cmd+V)
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      sendLog("tentativa_colar", "Tentativa de colar texto no exame.");
    };

    // 4. Bloqueio de menu de contexto (clique direito)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      sendLog("clique_direito", "Tentativa de abrir menu de contexto (clique direito).");
    };

    // 5. Monitorização de Ecrã Inteiro (Fullscreen)
    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      if (!active) {
        sendLog("saida_fullscreen", "O estudante saiu do modo de ecrã inteiro.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [idTentativa, onFocusLost, sendLog]);

  const requestFullscreen = useCallback(() => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }, []);

  return {
    focusLossCount,
    copyAttempts,
    isFullscreen,
    requestFullscreen,
  };
}
