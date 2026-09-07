"use client";

import Link from "next/link";
import { AlertTriangle, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,143,217,0.12),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(58,138,80,0.10),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef6ff_100%)] px-4 py-10 text-slate-900">
      <div className="mx-auto flex min-h-[80vh] max-w-3xl items-center">
        <div className="w-full rounded-[2rem] border border-white/60 bg-white p-8 shadow-2xl shadow-slate-200/60">
          <div className="inline-flex rounded-2xl bg-rose-100 p-3 text-rose-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950">Ocorreu um erro</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Não foi possível carregar esta secção neste momento. Podes tentar novamente ou voltar à página inicial.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Tentar novamente
            </button>
            <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <Home className="h-4 w-4" />
              Ir para a página inicial
            </Link>
          </div>
          {process.env.NODE_ENV !== "production" && error?.message && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
              {error.message}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
