"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import {
  AlertCircle,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Users,
  BellRing,
  BookOpen,
} from "lucide-react";
import Image from "next/image";

const destaques = [
  { icon: <ShieldCheck className="h-5 w-5" />, texto: "Acesso seguro por e-mail ou número de estudante" },
  { icon: <Users className="h-5 w-5" />, texto: "Perfis para estudante, docente, coordenador e admin" },
  { icon: <BellRing className="h-5 w-5" />, texto: "Notificações e aprovações em tempo real" },
  { icon: <BookOpen className="h-5 w-5" />, texto: "Disciplinas, notas e percurso académico num só lugar" },
];

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const identifier = String(formData.get("identifier") || "");
    const password = String(formData.get("password") || "");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        identifier,
        password,
        callbackUrl: "/login",
      });

      if (result?.error || !result?.ok) {
        setError("Identificador ou senha incorretos.");
        setLoading(false);
        return;
      }

      router.replace(result.url || "/login");
      router.refresh();
    } catch {
      setError("Não foi possível iniciar sessão.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">

      {/* ── Esquerda: Imagem com overlay ── */}
      <div className="relative hidden lg:block lg:w-[45%] lg:shrink-0">
        {/* Imagem de fundo */}
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

        {/* Conteúdo centralizado sobre a imagem */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-10 text-center text-white">
          <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold leading-snug">
            Universidade<br />Kimpa Vita
          </h2>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/75">
            Plataforma colaborativa de integração académica para estudantes, docentes e coordenadores.
          </p>

          <div className="mt-8 w-full max-w-xs space-y-3">
            {destaques.map((d, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-left backdrop-blur-sm"
              >
                <span className="shrink-0 text-white/80">{d.icon}</span>
                <span className="text-sm text-white/85">{d.texto}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Direita: Formulário ── */}
      <div className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-12 lg:px-12">
        <div className="w-full max-w-sm">
          {/* Logo (visível só em mobile) */}
          <div className="mb-8 flex flex-col items-center gap-3 text-center lg:hidden">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue text-white shadow-lg shadow-brand-blue/30">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800">Kimpa Connect</h1>
              <p className="mt-1 text-sm text-slate-500">Universidade Kimpa Vita</p>
            </div>
          </div>

          {/* Título do form */}
          <div className="mb-7">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-800">
              Iniciar sessão
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Entre com o e-mail ou número de estudante.
            </p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            {error && (
              <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="identificador"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  E-mail ou número de estudante
                </label>
                <input
                  id="identificador"
                  type="text"
                  name="identifier"
                  required
                  autoComplete="username"
                  placeholder="ex: EST2026001 ou admin@kimpa.ao"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
                />
              </div>

              <div>
                <label
                  htmlFor="senha"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="senha"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:text-slate-600"
                    aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 py-3 text-sm font-bold text-white shadow-md shadow-brand-blue/20 transition hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
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

          <p className="mt-5 text-center text-sm text-slate-500">
            Ainda não tens conta?{" "}
            <Link href="/registro" className="font-semibold text-brand-blue hover:underline">
              Criar pedido de acesso
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
