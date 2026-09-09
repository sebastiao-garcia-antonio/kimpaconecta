"use client";

import Link from "next/link";
import { AlertTriangle, Home, LogIn } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900 flex items-center justify-center">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-2xl bg-rose-100 p-3 text-rose-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Kimpa Connect — Recuperação de Sessão</h1>
            <p className="text-xs text-slate-500">Foi detetada uma desconexão temporária com o servidor.</p>
          </div>
        </div>

        <p className="text-xs leading-5 text-slate-600">
          A sua ligação foi interrompida ou a sessão expirou. Pode tentar recarregar a secção ou voltar a iniciar sessão na sua conta.
        </p>

        {error?.message && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[11px] font-mono text-slate-600 break-words">
            <strong>Detalhe Técnico:</strong> {error.message}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-brand-blue-dark transition"
          >
            Tentar Novamente
          </button>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
          >
            <LogIn className="h-4 w-4" />
            Ir para a Página de Login
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            <Home className="h-4 w-4" />
            Página Inicial
          </Link>
        </div>
      </div>
    </main>
  );
}
