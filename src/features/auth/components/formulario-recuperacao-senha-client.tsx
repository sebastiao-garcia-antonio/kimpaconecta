"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Mail,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import {
  solicitarRecuperacaoSenha,
  verificarCodigoRecuperacao,
  redefinirSenhaComCodigo,
} from "@/features/auth/actions";

const STEPS = [
  { id: 1, label: "E-mail", icon: <Mail className="h-4 w-4" /> },
  { id: 2, label: "Código", icon: <KeyRound className="h-4 w-4" /> },
  { id: 3, label: "Nova senha", icon: <Lock className="h-4 w-4" /> },
];

function calcularForcaSenha(senha: string): {
  score: number;
  label: string;
  colorClass: string;
} {
  if (!senha) return { score: 0, label: "", colorClass: "" };
  let score = 0;
  if (senha.length >= 6) score++;
  if (senha.length >= 10) score++;
  if (/[A-Z]/.test(senha)) score++;
  if (/[0-9]/.test(senha)) score++;
  if (/[^A-Za-z0-9]/.test(senha)) score++;

  if (score <= 1) return { score, label: "Muito fraca", colorClass: "bg-red-500" };
  if (score === 2) return { score, label: "Fraca", colorClass: "bg-orange-400" };
  if (score === 3) return { score, label: "Razoável", colorClass: "bg-yellow-400" };
  if (score === 4) return { score, label: "Boa", colorClass: "bg-brand-blue" };
  return { score, label: "Excelente", colorClass: "bg-brand-green" };
}

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

export function FormularioRecuperacaoSenhaClient() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [digitos, setDigitos] = useState<string[]>(["", "", "", "", "", ""]);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const forcaSenha = calcularForcaSenha(novaSenha);
  const codigo = digitos.join("");

  function alterarDigito(index: number, valor: string) {
    const apenasDigitos = valor.replace(/\D/g, "");
    setDigitos((atual) => {
      const proximo = [...atual];
      if (apenasDigitos.length > 1) {
        // colagem de vários dígitos
        for (let i = 0; i < apenasDigitos.length && index + i < 6; i++) {
          proximo[index + i] = apenasDigitos[i];
        }
        const foco = Math.min(index + apenasDigitos.length, 5);
        refs.current[foco]?.focus();
      } else {
        proximo[index] = apenasDigitos;
        if (apenasDigitos && index < 5) refs.current[index + 1]?.focus();
      }
      return proximo;
    });
  }

  function teclaDigito(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digitos[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  async function enviarCodigo(event?: React.FormEvent) {
    event?.preventDefault();
    setError(null);
    setInfo(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Insira um e-mail válido.");
      return;
    }
    setLoading(true);
    const res = await solicitarRecuperacaoSenha({ email });
    setLoading(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setInfo(res?.message || "Enviámos um código de 6 dígitos para o seu e-mail.");
    setDigitos(["", "", "", "", "", ""]);
    setStep(2);
    setTimeout(() => refs.current[0]?.focus(), 50);
  }

  async function verificarCodigo(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(codigo)) {
      setError("Informe os 6 dígitos do código recebido.");
      return;
    }
    setLoading(true);
    const res = await verificarCodigoRecuperacao({ email, codigo });
    setLoading(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setInfo(null);
    setStep(3);
  }

  async function redefinirSenha(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (novaSenha.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    const res = await redefinirSenhaComCodigo({ email, codigo, novaSenha, confirmarSenha });
    setLoading(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setSuccess(res?.message || "Senha redefinida com sucesso.");
  }

  /* ── Tela de sucesso ── */
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-green/10 text-brand-green">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800">Senha redefinida!</h2>
          <p className="mt-2 text-slate-500">{success}</p>
          <Link
            href="/login"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-brand-blue px-6 py-3 text-sm font-bold text-white shadow-md shadow-brand-blue/20 transition hover:bg-brand-blue/90"
          >
            Ir para o login <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* ── Painel esquerdo ── */}
        <div className="relative hidden lg:block lg:w-[45%] lg:shrink-0">
          <Image
            src="/registro-hero.jpg"
            alt="Campus da Universidade Kimpa Vita"
            width={1200}
            height={1200}
            priority
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-900/65" />
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
              Recupere o acesso à plataforma em três passos simples e seguros.
            </p>
            <div className="mt-6 w-full max-w-xs space-y-2">
              {[
                "Informe o e-mail da sua conta",
                "Insira o código de 6 dígitos recebido",
                "Defina a sua nova senha de acesso",
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

        {/* ── Painel direito ── */}
        <div className="flex flex-1 items-center justify-center px-4 py-8 lg:px-12">
          <div className="w-full max-w-md">
            {/* Cabeçalho */}
            <div className="mb-7">
              <div className="mb-3 inline-flex items-center gap-2 rounded-xl bg-brand-blue/10 px-3 py-1.5 text-xs font-bold text-brand-blue">
                <ShieldCheck className="h-4 w-4" />
                Recuperação de senha
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800">Repor a sua senha</h1>
              <p className="mt-1 text-sm text-slate-500">
                {step === 1 && "Informe o e-mail associado à sua conta para receber o código de verificação."}
                {step === 2 && "Insira o código de 6 dígitos que enviámos para o seu e-mail."}
                {step === 3 && "Escolha uma nova senha forte para a sua conta."}
              </p>
            </div>

            {/* Indicador de passos */}
            <div className="mb-7 flex items-center gap-2">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex flex-1 items-center gap-2">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      step > s.id
                        ? "bg-brand-green text-white"
                        : step === s.id
                        ? "bg-brand-blue text-white ring-4 ring-brand-blue/20"
                        : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    {step > s.id ? "✓" : s.id}
                  </div>
                  <span
                    className={`hidden text-xs font-semibold sm:block ${
                      step === s.id
                        ? "text-slate-700"
                        : step > s.id
                        ? "text-brand-green"
                        : "text-slate-400"
                    }`}
                  >
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div className={`h-px flex-1 transition-all ${step > s.id ? "bg-brand-green" : "bg-slate-200"}`} />
                  )}
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {info && !error && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-brand-blue/20 bg-brand-blue/5 p-3.5 text-sm text-brand-blue">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>{info}</span>
                </div>
              )}

              {/* ── Passo 1: E-mail ── */}
              {step === 1 && (
                <form onSubmit={enviarCodigo} className="space-y-4">
                  <Field id="email-recuperacao" label="E-mail" icon={<Mail className="h-3.5 w-3.5" />}>
                    <input
                      id="email-recuperacao"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder="nome@exemplo.com"
                      className={inputCls}
                    />
                  </Field>
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 py-3 text-sm font-bold text-white shadow-md shadow-brand-blue/20 transition hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> A enviar...
                      </>
                    ) : (
                      <>
                        Enviar código <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* ── Passo 2: Código ── */}
              {step === 2 && (
                <form onSubmit={verificarCodigo} className="space-y-5">
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                      <span className="text-brand-blue">
                        <KeyRound className="h-3.5 w-3.5" />
                      </span>
                      Código de verificação
                    </label>
                    <div className="flex justify-between gap-2">
                      {digitos.map((digito, i) => (
                        <input
                          key={i}
                          ref={(el) => {
                            refs.current[i] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          value={digito}
                          onChange={(e) => alterarDigito(i, e.target.value)}
                          onKeyDown={(e) => teclaDigito(i, e)}
                          className="h-14 w-full rounded-xl border border-slate-200 bg-slate-50 text-center text-xl font-bold text-slate-800 outline-none transition focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 py-3 text-sm font-bold text-white shadow-md shadow-brand-blue/20 transition hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> A validar...
                      </>
                    ) : (
                      <>
                        Validar código <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setInfo(null);
                        setStep(1);
                      }}
                      className="inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-slate-700"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Alterar e-mail
                    </button>
                    <button
                      type="button"
                      onClick={() => enviarCodigo()}
                      disabled={loading}
                      className="font-semibold text-brand-blue hover:underline disabled:opacity-60"
                    >
                      Reenviar código
                    </button>
                  </div>
                </form>
              )}

              {/* ── Passo 3: Nova senha ── */}
              {step === 3 && (
                <form onSubmit={redefinirSenha} className="space-y-4">
                  <Field id="nova-senha" label="Nova senha" icon={<Lock className="h-3.5 w-3.5" />}>
                    <div className="relative">
                      <input
                        id="nova-senha"
                        type={mostrarSenha ? "text" : "password"}
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        required
                        autoComplete="new-password"
                        placeholder="Mínimo 6 caracteres"
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
                    {novaSenha && (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className={`h-1.5 flex-1 rounded-full transition-all ${
                                i <= forcaSenha.score ? forcaSenha.colorClass : "bg-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-slate-500">
                          Força:{" "}
                          <span
                            className={
                              forcaSenha.score <= 2
                                ? "font-semibold text-red-500"
                                : forcaSenha.score === 3
                                ? "font-semibold text-yellow-600"
                                : "font-semibold text-brand-green"
                            }
                          >
                            {forcaSenha.label}
                          </span>
                        </p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          {[
                            { check: novaSenha.length >= 8, label: "8+ caracteres" },
                            { check: /[A-Z]/.test(novaSenha), label: "Letra maiúscula" },
                            { check: /[0-9]/.test(novaSenha), label: "Número" },
                            { check: /[^A-Za-z0-9]/.test(novaSenha), label: "Caractere especial" },
                          ].map((tip) => (
                            <span
                              key={tip.label}
                              className={`text-xs ${tip.check ? "text-brand-green" : "text-slate-400"}`}
                            >
                              {tip.check ? "✓" : "·"} {tip.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </Field>

                  <Field id="confirmar-nova-senha" label="Confirmar senha" icon={<ShieldCheck className="h-3.5 w-3.5" />}>
                    <div className="relative">
                      <input
                        id="confirmar-nova-senha"
                        type={mostrarConfirmar ? "text" : "password"}
                        value={confirmarSenha}
                        onChange={(e) => setConfirmarSenha(e.target.value)}
                        required
                        autoComplete="new-password"
                        placeholder="Repita a nova senha"
                        className={`${inputCls} pr-11 ${
                          confirmarSenha
                            ? novaSenha === confirmarSenha
                              ? "border-brand-green/60 focus:border-brand-green focus:ring-brand-green/10"
                              : "border-red-300 focus:border-red-400 focus:ring-red-100"
                            : ""
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:text-slate-600"
                        aria-label={mostrarConfirmar ? "Esconder senha" : "Mostrar senha"}
                      >
                        {mostrarConfirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirmarSenha && (
                      <p className={`mt-1 text-xs font-medium ${novaSenha === confirmarSenha ? "text-brand-green" : "text-red-500"}`}>
                        {novaSenha === confirmarSenha ? "✓ As senhas coincidem." : "✗ As senhas não coincidem."}
                      </p>
                    )}
                  </Field>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-3 text-sm font-bold text-white shadow-md shadow-brand-green/20 transition hover:bg-brand-green/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> A guardar...
                      </>
                    ) : (
                      <>
                        Redefinir senha <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            <p className="mt-5 text-center text-sm text-slate-500">
              Lembrou-se da senha?{" "}
              <Link href="/login" className="font-semibold text-brand-blue hover:underline">
                Voltar ao login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
