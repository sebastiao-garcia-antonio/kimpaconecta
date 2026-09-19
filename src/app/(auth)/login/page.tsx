"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import {
  AlertCircle,
  GraduationCap,
  Loader2,
  ShieldCheck,
  Sparkles,
  Users,
  BellRing,
} from "lucide-react";

const destaques = [
  {
    icon: <ShieldCheck className="h-4 w-4" />,
    titulo: "Acesso seguro",
    descricao: "Login por e-mail ou número de estudante.",
  },
  {
    icon: <Users className="h-4 w-4" />,
    titulo: "Perfis por papel",
    descricao: "Administrador, coordenador, docente e estudante.",
  },
  {
    icon: <BellRing className="h-4 w-4" />,
    titulo: "Notificações",
    descricao: "Pedidos e aprovações aparecem no painel.",
  },
];

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const identifier = String(formData.get("identifier") || "");
    const password = String(formData.get("password") || "");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        identifier,
        password,
      });

      if (res?.error || !res?.ok) {
        setError("Identificador ou senha incorretos.");
        setLoading(false);
        return;
      }

      // Login bem sucedido -> navegar para a página principal que redirecionará conforme o perfil
      window.location.href = "/";
    } catch {
      setError("Não foi possível iniciar sessão.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.12),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef6ff_100%)] px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-2">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-slate-900 p-8 text-white shadow-2xl shadow-slate-900/10">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(37,99,235,0.22),rgba(16,185,129,0.18))]" />
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-12 h-44 w-44 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="relative space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-white/80 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Universidade Kimpa Vita
            </div>

            <div className="space-y-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                <GraduationCap className="h-8 w-8" />
              </div>
              <h1 className="max-w-md text-3xl font-extrabold tracking-tight sm:text-4xl">
                Plataforma colaborativa para integração académica
              </h1>
              <p className="max-w-lg text-sm leading-6 text-white/75 sm:text-base">
                Aceda ao seu painel, acompanhe pedidos de acesso, aprovações,
                disciplinas, notificações e o seu percurso académico num só lugar.
              </p>
            </div>

            <div className="grid gap-3">
              {destaques.map((item) => (
                <div
                  key={item.titulo}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur"
                >
                  <div className="mt-0.5 rounded-xl bg-white/10 p-2 text-white">{item.icon}</div>
                  <div>
                    <p className="font-semibold text-white">{item.titulo}</p>
                    <p className="text-sm text-white/70">{item.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
              <GraduationCap className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-800">
              Iniciar sessão
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Entre com o e-mail institucional ou número de estudante.
            </p>
          </div>

          {error && (
            <div className="mt-6 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="identificador" className="text-sm font-semibold text-slate-700">E-mail ou número</label>
              <input
                id="identificador"
                type="text"
                name="identifier"
                required
                autoComplete="username"
                placeholder="ex: admin@kimpa.ao ou EST2026001"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-800 outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
              />
            </div>

            <div>
              <label htmlFor="senha" className="text-sm font-semibold text-slate-700">Senha</label>
              <input
                id="senha"
                type="password"
                name="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-800 outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-blue px-4 py-3.5 font-semibold text-white shadow-lg shadow-brand-blue/20 transition hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  A entrar...
                </>
              ) : (
                "Entrar no sistema"
              )}
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-700">Ainda não tens conta?</p>
            <p className="mt-1">
              Faz o pedido de acesso e aguarda a validação do coordenador.
            </p>
            <Link href="/registro" className="mt-3 inline-flex font-semibold text-brand-blue hover:underline">
              Criar pedido de acesso
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
