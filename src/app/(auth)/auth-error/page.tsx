"use client";

import Link from "next/link";
import { AlertCircle, LogIn, Home } from "lucide-react";

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl space-y-4 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-black text-slate-900">Erro de Autenticação</h1>
        <p className="text-xs text-slate-500">
          Não foi possível concluir a validação das credenciais. Verifique os dados introduzidos e tente novamente.
        </p>
        <div className="pt-2 flex flex-col gap-2">
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-blue px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-brand-blue-dark transition"
          >
            <LogIn className="h-4 w-4" /> Voltar ao Login
          </Link>
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            <Home className="h-4 w-4" /> Página Inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
