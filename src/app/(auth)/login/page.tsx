"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  GraduationCap,
  AlertCircle,
  Loader2,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { loginUsuarioAction } from "@/features/auth/actions";

function Field({
  id,
  label,
  icon,
  children,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
        <span className="text-brand-blue">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const identifier = String(formData.get("identifier") || "");
    const password = String(formData.get("password") || "");

    try {
      const res = await loginUsuarioAction({ identifier, password });
      if (res?.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      window.location.href = "/";
    } catch {
      setError("Não foi possível iniciar sessão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* ── Painel Esquerdo: Imagem e Apresentação (Idêntico ao Registo) ── */}
        <div className="relative hidden lg:block lg:w-[45%] lg:shrink-0">
          <Image
            src="/registro-hero.jpg"
            alt="Campus da Universidade Kimpa Vita"
            width={1200}
            height={1200}
            priority
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Overlay escuro */}
          <div className="absolute inset-0 bg-slate-900/65" />
          {/* Conteúdo centrado */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-10 text-center text-white">
            <div className="mb-5 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 p-1 backdrop-blur-sm">
              <Image
                src="/logo-oficial.jpeg"
                alt="Logo Universidade Kimpa Vita"
                width={72}
                height={72}
                className="rounded-xl object-cover"
                priority
              />
            </div>
            <h2 className="text-3xl font-extrabold leading-snug">
              Universidade<br />Kimpa Vita
            </h2>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/75">
              Plataforma colaborativa de integração académica para estudantes, docentes e coordenadores.
            </p>
            <div className="mt-6 w-full max-w-xs space-y-2">
              {[
                "Aceda ao seu painel com login seguro",
                "Acompanhe notas, disciplinas e pautas",
                "Colabore com a comunidade universitária",
              ].map((texto, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-left backdrop-blur-sm"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="text-sm text-white/85">{texto}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Painel Direito: Formulário de Login (Idêntico ao Registo) ── */}
        <div className="flex flex-1 items-center justify-center px-4 py-8 lg:px-12">
          <div className="w-full max-w-md">

            {/* Cabeçalho */}
            <div className="mb-7">
              <div className="mb-3 inline-flex items-center gap-2 rounded-xl bg-brand-blue/10 px-3 py-1.5 text-xs font-bold text-brand-blue">
                <ShieldCheck className="h-4 w-4" />
                Acesso Seguro
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800">Iniciar sessão</h1>
              <p className="mt-1 text-sm text-slate-500">
                Insira o seu e-mail institucional ou número de estudante para continuar.
              </p>
            </div>

            {/* Card Principal */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              {/* Alerta de erro */}
              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form method="POST" onSubmit={handleSubmit} className="space-y-4">
                <Field id="identificador" label="E-mail ou número de estudante" icon={<User className="h-3.5 w-3.5" />}>
                  <input
                    id="identificador"
                    type="text"
                    name="identifier"
                    required
                    autoComplete="username"
                    placeholder="Ex: admin@kimpa.ao ou EST2026001"
                    className={inputCls}
                  />
                </Field>

                <Field id="senha" label="Senha" icon={<Lock className="h-3.5 w-3.5" />}>
                  <div className="relative">
                    <input
                      id="senha"
                      type={mostrarSenha ? "text" : "password"}
                      name="password"
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className={`${inputCls} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:text-slate-600"
                      aria-label={mostrarSenha ? "Esconder senha" : "Mostrar senha"}
                    >
                      {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 py-3 text-sm font-bold text-white shadow-md shadow-brand-blue/20 transition hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      A entrar...
                    </>
                  ) : (
                    <>
                      Entrar no sistema
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Link para criar conta */}
            <p className="mt-5 text-center text-sm text-slate-500">
              Ainda não tem conta?{" "}
              <Link href="/registro" className="font-semibold text-brand-blue hover:underline">
                Pedir acesso à plataforma
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
