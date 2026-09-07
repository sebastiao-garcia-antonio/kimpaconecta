"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { criarNovaAvaliacaoServer } from "@/features/academic/actions";

type Disciplina = {
  idDisciplina: number;
  nomeDisciplina: string;
  nomeCurso: string;
};

interface FormularioAvaliacaoDocenteClientProps {
  docenteId: number;
  disciplinas: Disciplina[];
}

export function FormularioAvaliacaoDocenteClient({
  docenteId,
  disciplinas,
}: FormularioAvaliacaoDocenteClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mensagem, setMensagem] = useState<string | null>(null);

  const [titulo, setTitulo] = useState("");
  const [idDisciplina, setIdDisciplina] = useState(String(disciplinas[0]?.idDisciplina ?? ""));
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [duracaoMinutos, setDuracaoMinutos] = useState(60);
  const [notaMaxima, setNotaMaxima] = useState(20);
  const [enunciado, setEnunciado] = useState("");
  const [tipoQuestao, setTipoQuestao] = useState("multipla_escolha");
  const [alternativas, setAlternativas] = useState([
    { textoAlternativa: "", isCorreta: true },
    { textoAlternativa: "", isCorreta: false },
  ]);

  const disciplinaAtual = useMemo(
    () => disciplinas.find((disciplina) => String(disciplina.idDisciplina) === idDisciplina),
    [disciplinas, idDisciplina]
  );

  const atualizarAlternativa = (indice: number, campo: "textoAlternativa" | "isCorreta", valor: string | boolean) => {
    setAlternativas((estado) =>
      estado.map((alternativa, index) =>
        index === indice ? { ...alternativa, [campo]: valor } : alternativa
      )
    );
  };

  const adicionarAlternativa = () => {
    setAlternativas((estado) => [...estado, { textoAlternativa: "", isCorreta: false }]);
  };

  const removerAlternativa = (indice: number) => {
    setAlternativas((estado) => estado.filter((_, index) => index !== indice));
  };

  const submeterFormulario = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();

    startTransition(async () => {
      const resultado = await criarNovaAvaliacaoServer({
        idDisciplina: Number(idDisciplina),
        idProfessor: docenteId,
        titulo,
        dataInicio,
        dataFim,
        duracaoMinutos,
        notaMaxima,
        questoes: [
          {
            enunciado,
            tipoQuestao,
            alternativas: tipoQuestao === "desenvolvimento" ? undefined : alternativas,
          },
        ],
      });

      if (resultado.success) {
        setMensagem("Avaliação criada com sucesso.");
        setTitulo("");
        setEnunciado("");
        router.refresh();
      } else {
        setMensagem(resultado.error || "Não foi possível criar a avaliação.");
      }
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="font-bold text-lg text-slate-800">Criar avaliação</h3>
          <p className="text-sm text-slate-500">Formulário em português com uma questão inicial para publicação rápida.</p>
        </div>
        {disciplinaAtual && (
          <div className="text-sm text-slate-600">
            <span className="font-semibold">Disciplina atual:</span> {disciplinaAtual.nomeDisciplina}
          </div>
        )}
      </div>

      <form onSubmit={submeterFormulario} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Título da avaliação</span>
            <input
              value={titulo}
              onChange={(evento) => setTitulo(evento.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              placeholder="Ex.: Exame Final de Programação Web"
            />
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Disciplina</span>
            <select
              value={idDisciplina}
              onChange={(evento) => setIdDisciplina(evento.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            >
              {disciplinas.map((disciplina) => (
                <option key={disciplina.idDisciplina} value={disciplina.idDisciplina}>
                  {disciplina.nomeDisciplina} · {disciplina.nomeCurso}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Data de início</span>
            <input
              type="datetime-local"
              value={dataInicio}
              onChange={(evento) => setDataInicio(evento.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Data de fim</span>
            <input
              type="datetime-local"
              value={dataFim}
              onChange={(evento) => setDataFim(evento.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Duração em minutos</span>
            <input
              type="number"
              value={duracaoMinutos}
              onChange={(evento) => setDuracaoMinutos(Number(evento.target.value))}
              min={1}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Nota máxima</span>
            <input
              type="number"
              value={notaMaxima}
              onChange={(evento) => setNotaMaxima(Number(evento.target.value))}
              min={1}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          </label>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-slate-800">Questão inicial</h4>

          <label className="space-y-2 text-sm font-semibold text-slate-700 block">
            <span>Enunciado</span>
            <textarea
              value={enunciado}
              onChange={(evento) => setEnunciado(evento.target.value)}
              required
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              placeholder="Escreva a pergunta em português"
            />
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-700 block">
            <span>Tipo de questão</span>
            <select
              value={tipoQuestao}
              onChange={(evento) => setTipoQuestao(evento.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            >
              <option value="multipla_escolha">Múltipla escolha</option>
              <option value="verdadeiro_falso">Verdadeiro ou falso</option>
              <option value="desenvolvimento">Desenvolvimento</option>
            </select>
          </label>

          {tipoQuestao !== "desenvolvimento" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-semibold text-slate-700">Alternativas</h5>
                <button
                  type="button"
                  onClick={adicionarAlternativa}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar
                </button>
              </div>

              <div className="space-y-3">
                {alternativas.map((alternativa, indice) => (
                  <div key={indice} className="grid grid-cols-1 md:grid-cols-[1fr_160px_auto] gap-3 items-center rounded-2xl border border-slate-200 p-4">
                    <input
                      value={alternativa.textoAlternativa}
                      onChange={(evento) => atualizarAlternativa(indice, "textoAlternativa", evento.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                      placeholder={`Alternativa ${indice + 1}`}
                    />
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <input
                        type="radio"
                        checked={alternativa.isCorreta}
                        onChange={() => {
                          setAlternativas((estado) =>
                            estado.map((item, index) => ({
                              ...item,
                              isCorreta: index === indice,
                            }))
                          );
                        }}
                      />
                      Correta
                    </label>
                    <button
                      type="button"
                      onClick={() => removerAlternativa(indice)}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          {mensagem && <p className="text-sm font-semibold text-slate-600">{mensagem}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-blue-dark disabled:opacity-60"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "A criar..." : "Criar avaliação"}
          </button>
        </div>
      </form>
    </div>
  );
}
