"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  CreditCard,
  Hash,
  Building2,
  BookOpen,
  Users,
  Lock,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { criarSolicitacaoAcesso } from "@/features/auth/actions";
import { formatarMascaraBIAngola } from "@/lib/validacao-texto";
import Image from "next/image";

type Turma = {
  id: number;
  nomeTurma: string;
  anoCurricular: number;
  periodo: string;
};

type Curso = {
  id: number;
  nomeCurso: string;
  turmas: Turma[];
};

type UnidadeOrganica = {
  id: number;
  nomeUo: string;
  sigla: string;
  cursos: Curso[];
};

interface FormularioRegistroSolicitacaoClientProps {
  unidades: UnidadeOrganica[];
}

const STEPS = [
  { id: 1, label: "Dados pessoais", icon: <User className="h-4 w-4" /> },
  { id: 2, label: "Dados académicos", icon: <BookOpen className="h-4 w-4" /> },
  { id: 3, label: "Segurança", icon: <Lock className="h-4 w-4" /> },
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

export function FormularioRegistroSolicitacaoClient({
  unidades,
}: FormularioRegistroSolicitacaoClientProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  // Step 1
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [numBi, setNumBi] = useState("");
  const [telefone, setTelefone] = useState("");

  // Step 2
  const [numEstudante, setNumEstudante] = useState("");
  const [idUoSelecionado, setIdUoSelecionado] = useState(
    String(unidades[0]?.id ?? "")
  );
  const [idCursoSelecionado, setIdCursoSelecionado] = useState(
    String(unidades[0]?.cursos[0]?.id ?? "")
  );
  const [idTurmaSelecionado, setIdTurmaSelecionado] = useState(
    String(unidades[0]?.cursos[0]?.turmas[0]?.id ?? "")
  );

  // Step 3
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  const forcaSenha = calcularForcaSenha(senha);

  const unidadeAtual = useMemo(
    () => unidades.find((u) => String(u.id) === idUoSelecionado),
    [unidades, idUoSelecionado]
  );
  const cursosDisponiveis = useMemo(() => unidadeAtual?.cursos || [], [unidadeAtual?.cursos]);
  const cursoAtual = useMemo(
    () => cursosDisponiveis.find((c) => String(c.id) === idCursoSelecionado),
    [cursosDisponiveis, idCursoSelecionado]
  );
  const turmasDisponiveis = cursoAtual?.turmas || [];

  function validarStep(s: number) {
    setError(null);
    if (s === 1) {
      if (!nomeCompleto.trim() || nomeCompleto.trim().length < 3) {
        setError("Nome completo deve ter pelo menos 3 caracteres.");
        return false;
      }
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError("Insira um e-mail válido.");
        return false;
      }
    }
    if (s === 2) {
      if (!numEstudante.trim() || numEstudante.trim().length < 4) {
        setError("Número de estudante inválido.");
        return false;
      }
    }
    return true;
  }

  function avancar() {
    if (!validarStep(step)) return;
    setStep((s) => s + 1);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (senha.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmarSenha) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);

    const res = await criarSolicitacaoAcesso({
      nomeCompleto,
      email,
      numEstudante,
      numBi,
      telefone,
      senhaProvisoria: senha,
      idUo: Number(idUoSelecionado),
      idCurso: Number(idCursoSelecionado),
      idTurma: Number(idTurmaSelecionado),
    });

    setLoading(false);
    if (res?.error) setError(res.error);
    else if (res?.success) setSuccess(res.message || "Pedido enviado com sucesso.");
  }

  /* ── Success screen ── */
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-green/10 text-brand-green">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800">Pedido enviado!</h2>
          <p className="mt-2 text-slate-500">{success}</p>
          <p className="mt-1 text-sm text-slate-400">
            O seu coordenador irá analisar e aprovar o seu acesso em breve.
          </p>
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

  /* ── Main layout ── */
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen flex-col lg:flex-row">

        {/* ── Left: Image panel ── */}
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
            <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-extrabold leading-snug">
              Universidade<br />Kimpa Vita
            </h2>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/75">
              Plataforma colaborativa de integração académica para estudantes, docentes e coordenadores.
            </p>
            <div className="mt-6 w-full max-w-xs space-y-2">
              {[
                "Registe os seus dados pessoais e académicos",
                "O coordenador valida e aprova o seu acesso",
                "Aceda ao painel com tudo num só lugar",
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

        {/* ── Right: Form panel ── */}
        <div className="flex flex-1 items-center justify-center px-4 py-5 lg:px-12">
          <div className="w-full max-w-md">

            {/* Header */}
            <div className="mb-7">
              <p className="text-sm text-slate-500">
                Preencha os dados abaixo para solicitar o seu acesso à plataforma.
              </p>
            </div>

            {/* Step indicator */}
            <div className="mb-7">
              <div className="flex items-center gap-2">
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
                      <div
                        className={`h-px flex-1 transition-all ${
                          step > s.id ? "bg-brand-green" : "bg-slate-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              {/* Step title */}
              <p className="mb-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                Passo {step} de {STEPS.length} — {STEPS[step - 1].label}
              </p>

              {/* Error */}
              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* ── Step 1 ── */}
                {step === 1 && (
                  <div className="space-y-4">
                    <Field id="nome-completo" label="Nome completo" icon={<User className="h-3.5 w-3.5" />}>
                      <input
                        id="nome-completo"
                        type="text"
                        name="nomeCompleto"
                        value={nomeCompleto}
                        onChange={(e) => setNomeCompleto(e.target.value)}
                        required
                        autoComplete="name"
                        placeholder="Ex: João Manuel"
                        className={inputCls}
                      />
                    </Field>
                    <Field id="email" label="E-mail" icon={<Mail className="h-3.5 w-3.5" />}>
                      <input
                        id="email"
                        type="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        placeholder="nome@exemplo.com"
                        className={inputCls}
                      />
                    </Field>
                    <Field id="numero-bi" label="Número de BI (opcional)" icon={<CreditCard className="h-3.5 w-3.5" />}>
                      <input
                        id="numero-bi"
                        type="text"
                        name="numBi"
                        value={numBi}
                        onChange={(e) => setNumBi(formatarMascaraBIAngola(e.target.value))}
                        placeholder="Ex: 000000000UE000"
                        maxLength={14}
                        pattern="\d{9}[a-zA-Z]{2}\d{3}"
                        title="Formato: 9 dígitos + 2 letras + 3 dígitos"
                        className={`${inputCls} font-mono tracking-wider`}
                      />
                    </Field>
                    <Field id="telefone" label="Telefone (opcional)" icon={<Phone className="h-3.5 w-3.5" />}>
                      <input
                        id="telefone"
                        type="text"
                        name="telefone"
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        autoComplete="tel"
                        placeholder="Ex: 923 000 000"
                        className={inputCls}
                      />
                    </Field>
                  </div>
                )}

                {/* ── Step 2 ── */}
                {step === 2 && (
                  <div className="space-y-4">
                    <Field id="numero-estudante" label="Número de estudante" icon={<Hash className="h-3.5 w-3.5" />}>
                      <input
                        id="numero-estudante"
                        type="text"
                        name="numEstudante"
                        value={numEstudante}
                        onChange={(e) => setNumEstudante(e.target.value)}
                        required
                        placeholder="Ex: 242091"
                        className={inputCls}
                      />
                    </Field>
                    <Field id="instituicao" label="Instituição" icon={<Building2 className="h-3.5 w-3.5" />}>
                      <select
                        id="instituicao"
                        name="idUo"
                        required
                        value={idUoSelecionado}
                        onChange={(e) => {
                          const novoIdUo = e.target.value;
                          setIdUoSelecionado(novoIdUo);
                          const unidade = unidades.find((u) => String(u.id) === novoIdUo);
                          const primeiroCurso = unidade?.cursos[0];
                          setIdCursoSelecionado(String(primeiroCurso?.id ?? ""));
                          setIdTurmaSelecionado(String(primeiroCurso?.turmas[0]?.id ?? ""));
                        }}
                        className={inputCls}
                      >
                        {unidades.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.nomeUo} ({u.sigla})
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field id="curso" label="Curso" icon={<BookOpen className="h-3.5 w-3.5" />}>
                      <select
                        id="curso"
                        name="idCurso"
                        required
                        value={idCursoSelecionado}
                        onChange={(e) => {
                          const novoIdCurso = e.target.value;
                          setIdCursoSelecionado(novoIdCurso);
                          const curso = cursosDisponiveis.find((c) => String(c.id) === novoIdCurso);
                          setIdTurmaSelecionado(String(curso?.turmas[0]?.id ?? ""));
                        }}
                        className={inputCls}
                      >
                        {cursosDisponiveis.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nomeCurso}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field id="turma" label="Turma" icon={<Users className="h-3.5 w-3.5" />}>
                      <select
                        id="turma"
                        name="idTurma"
                        required
                        value={idTurmaSelecionado}
                        onChange={(e) => setIdTurmaSelecionado(e.target.value)}
                        className={inputCls}
                      >
                        {turmasDisponiveis.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nomeTurma} · {t.anoCurricular}º ano · {t.periodo}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                )}

                {/* ── Step 3 ── */}
                {step === 3 && (
                  <div className="space-y-4">
                    {/* Senha */}
                    <Field id="senha-acesso" label="Senha de acesso" icon={<Lock className="h-3.5 w-3.5" />}>
                      <div className="relative">
                        <input
                          id="senha-acesso"
                          type={mostrarSenha ? "text" : "password"}
                          value={senha}
                          onChange={(e) => setSenha(e.target.value)}
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
                      {/* Strength bar */}
                      {senha && (
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
                              { check: senha.length >= 8, label: "8+ caracteres" },
                              { check: /[A-Z]/.test(senha), label: "Letra maiúscula" },
                              { check: /[0-9]/.test(senha), label: "Número" },
                              { check: /[^A-Za-z0-9]/.test(senha), label: "Caractere especial" },
                            ].map((tip) => (
                              <div key={tip.label} className="flex items-center gap-1.5">
                                <span className={`text-xs ${tip.check ? "text-brand-green" : "text-slate-400"}`}>
                                  {tip.check ? "✓" : "·"} {tip.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </Field>

                    {/* Confirmar senha */}
                    <Field id="confirmar-senha" label="Confirmar senha" icon={<ShieldCheck className="h-3.5 w-3.5" />}>
                      <div className="relative">
                        <input
                          id="confirmar-senha"
                          type={mostrarConfirmar ? "text" : "password"}
                          value={confirmarSenha}
                          onChange={(e) => setConfirmarSenha(e.target.value)}
                          required
                          autoComplete="new-password"
                          placeholder="Repita a senha"
                          className={`${inputCls} pr-11 ${
                            confirmarSenha
                              ? senha === confirmarSenha
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
                        <p className={`mt-1 text-xs font-medium ${senha === confirmarSenha ? "text-brand-green" : "text-red-500"}`}>
                          {senha === confirmarSenha ? "✓ As senhas coincidem." : "✗ As senhas não coincidem."}
                        </p>
                      )}
                    </Field>
                  </div>
                )}

                {/* Navigation */}
                <div className={`mt-6 flex gap-3 ${step > 1 ? "justify-between" : "justify-end"}`}>
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={() => { setError(null); setStep((s) => s - 1); }}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <ArrowLeft className="h-4 w-4" /> Anterior
                    </button>
                  )}
                  {step < STEPS.length ? (
                    <button
                      type="button"
                      onClick={avancar}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-blue/20 transition hover:bg-brand-blue/90"
                    >
                      Próximo <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-green/20 transition hover:bg-brand-green/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> A enviar...</>
                      ) : (
                        <><ArrowRight className="h-4 w-4" /> Enviar pedido</>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Login link */}
            <p className="mt-5 text-center text-sm text-slate-500">
              Já possui conta?{" "}
              <Link href="/login" className="font-semibold text-brand-blue hover:underline">
                Iniciar sessão
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
