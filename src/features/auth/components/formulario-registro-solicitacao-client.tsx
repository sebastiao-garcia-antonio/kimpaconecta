"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GraduationCap, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { criarSolicitacaoAcesso } from "@/features/auth/actions";
import { formatarMascaraBIAngola } from "@/lib/validacao-texto";

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

export function FormularioRegistroSolicitacaoClient({ unidades }: FormularioRegistroSolicitacaoClientProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [numBi, setNumBi] = useState("");

  const [idUoSelecionado, setIdUoSelecionado] = useState(String(unidades[0]?.id ?? ""));
  const [idCursoSelecionado, setIdCursoSelecionado] = useState(String(unidades[0]?.cursos[0]?.id ?? ""));
  const [idTurmaSelecionado, setIdTurmaSelecionado] = useState(String(unidades[0]?.cursos[0]?.turmas[0]?.id ?? ""));

  const unidadeAtual = useMemo(
    () => unidades.find((unidade) => String(unidade.id) === idUoSelecionado),
    [unidades, idUoSelecionado]
  );

  const cursosDisponiveis = unidadeAtual?.cursos || [];

  const cursoAtual = useMemo(
    () => cursosDisponiveis.find((curso) => String(curso.id) === idCursoSelecionado),
    [cursosDisponiveis, idCursoSelecionado]
  );

  const turmasDisponiveis = cursoAtual?.turmas || [];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(event.currentTarget);
    const data = {
      nomeCompleto: formData.get("nomeCompleto") as string,
      email: formData.get("email") as string,
      numEstudante: formData.get("numEstudante") as string,
      numBi: formData.get("numBi") as string,
      telefone: formData.get("telefone") as string,
      senhaProvisoria: formData.get("senhaProvisoria") as string,
      idUo: Number(formData.get("idUo")),
      idCurso: Number(formData.get("idCurso")),
      idTurma: Number(formData.get("idTurma")),
    };

    const res = await criarSolicitacaoAcesso(data);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else if (res?.success) {
      setSuccess(res.message || "Pedido enviado com sucesso.");
      event.currentTarget.reset();
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
      <div className="w-full max-w-3xl p-8 bg-card border border-border rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl">
        <div className="flex flex-col items-center mb-6">
          <GraduationCap className="h-12 w-12 text-brand-blue mb-2 animate-bounce" />
          <h2 className="text-2xl font-bold tracking-tight text-foreground text-center">
            Pedido de Acesso ao Kimpa Connect
          </h2>
          <p className="text-muted-foreground text-sm text-center mt-1">
            Preencha os seus dados e selecione a instituição, o curso e a turma.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 mb-4 text-sm text-red-800 border border-red-200 rounded-lg bg-red-50">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-4 mb-4 text-sm text-emerald-800 border border-emerald-200 rounded-lg bg-emerald-50">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="nome-completo" className="text-sm font-medium text-foreground">Nome Completo</label>
              <input
                id="nome-completo"
                type="text"
                name="nomeCompleto"
                required
                autoComplete="name"
                placeholder="Ex: João Manuel"
                className="w-full p-3 border border-border rounded-lg mt-1 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label htmlFor="email" className="text-sm font-medium text-foreground">E-mail</label>
              <input
                id="email"
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="nome@exemplo.com"
                className="w-full p-3 border border-border rounded-lg mt-1 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="numero-estudante" className="text-sm font-medium text-foreground">Número de Estudante</label>
              <input
                id="numero-estudante"
                type="text"
                name="numEstudante"
                required
                placeholder="Ex: 242091"
                className="w-full p-3 border border-border rounded-lg mt-1 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label htmlFor="numero-bi" className="text-sm font-medium text-foreground">Número de BI (14 caracteres)</label>
              <input
                id="numero-bi"
                type="text"
                name="numBi"
                value={numBi}
                maxLength={14}
                placeholder="Ex: 000000000UE000"
                pattern="\d{9}[a-zA-Z]{2}\d{3}"
                title="Formato de BI de Angola: 9 números + 2 letras + 3 números (Ex: 000000000UE000)"
                onChange={(e) => setNumBi(formatarMascaraBIAngola(e.target.value))}
                className="w-full p-3 border border-border rounded-lg mt-1 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue font-mono tracking-wider"
              />
            </div>
            <div>
              <label htmlFor="telefone" className="text-sm font-medium text-foreground">Telefone</label>
              <input
                id="telefone"
                type="text"
                name="telefone"
                autoComplete="tel"
                placeholder="Ex: 923 000 000"
                className="w-full p-3 border border-border rounded-lg mt-1 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="instituicao" className="text-sm font-medium text-foreground">Instituição</label>
              <select
                id="instituicao"
                name="idUo"
                required
                value={idUoSelecionado}
                onChange={(evento) => {
                  const novoIdUo = evento.target.value;
                  setIdUoSelecionado(novoIdUo);
                  const unidade = unidades.find((item) => String(item.id) === novoIdUo);
                  const primeiroCurso = unidade?.cursos[0];
                  setIdCursoSelecionado(String(primeiroCurso?.id ?? ""));
                  setIdTurmaSelecionado(String(primeiroCurso?.turmas[0]?.id ?? ""));
                }}
                className="w-full p-3 border border-border rounded-lg mt-1 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                {unidades.map((unidade) => (
                  <option key={unidade.id} value={unidade.id}>
                    {unidade.nomeUo} ({unidade.sigla})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="curso" className="text-sm font-medium text-foreground">Curso</label>
              <select
                id="curso"
                name="idCurso"
                required
                value={idCursoSelecionado}
                onChange={(evento) => {
                  const novoIdCurso = evento.target.value;
                  setIdCursoSelecionado(novoIdCurso);
                  const curso = cursosDisponiveis.find((item) => String(item.id) === novoIdCurso);
                  setIdTurmaSelecionado(String(curso?.turmas[0]?.id ?? ""));
                }}
                className="w-full p-3 border border-border rounded-lg mt-1 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                {cursosDisponiveis.map((curso) => (
                  <option key={curso.id} value={curso.id}>
                    {curso.nomeCurso}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="turma" className="text-sm font-medium text-foreground">Turma</label>
              <select
                id="turma"
                name="idTurma"
                required
                value={idTurmaSelecionado}
                onChange={(evento) => setIdTurmaSelecionado(evento.target.value)}
                className="w-full p-3 border border-border rounded-lg mt-1 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                {turmasDisponiveis.map((turma) => (
                  <option key={turma.id} value={turma.id}>
                    {turma.nomeTurma} · {turma.anoCurricular}º ano · {turma.periodo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="senha-provisoria" className="text-sm font-medium text-foreground">Senha de Acesso</label>
            <input
              id="senha-provisoria"
              type="password"
              name="senhaProvisoria"
              required
              autoComplete="new-password"
              placeholder="••••••••"
              className="w-full p-3 border border-border rounded-lg mt-1 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-blue text-white p-3 rounded-lg hover:bg-brand-blue/90 transition font-medium mt-2 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                A enviar pedido...
              </>
            ) : (
              "Enviar Pedido de Acesso"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Já possui conta?{" "}
          <Link href="/login" className="text-brand-blue hover:underline font-semibold">
            Acesse aqui
          </Link>
        </p>
      </div>
    </div>
  );
}
