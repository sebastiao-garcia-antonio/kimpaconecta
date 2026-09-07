"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { lancarDiarioEPresencasServer } from "@/features/attendance/actions";

type Disciplina = { idDisciplina: number; idCurso: number; nomeDisciplina: string; semestre: number; nomeCurso: string };
type Estudante = { id: number; nome: string; email: string; numEstudanteLogin?: string | null };
type Turma = { id: number; idCurso: number; nomeTurma: string; anoCurricular: number; periodo: string; estudantes: Estudante[] };

export function PresencasDocenteClient({ disciplinas, turmas }: { disciplinas: Disciplina[]; turmas: Turma[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [idDisciplina, setIdDisciplina] = useState(String(disciplinas[0]?.idDisciplina || ""));
  const disciplinaAtual = useMemo(() => disciplinas.find((disciplina) => disciplina.idDisciplina === Number(idDisciplina)), [disciplinas, idDisciplina]);
  const turmasDisponiveis = useMemo(() => turmas.filter((turma) => turma.idCurso === disciplinaAtual?.idCurso), [turmas, disciplinaAtual?.idCurso]);
  const [idTurma, setIdTurma] = useState("");
  const turmaAtual = useMemo(() => turmas.find((turma) => turma.id === Number(idTurma)), [turmas, idTurma]);
  const [dataAula, setDataAula] = useState(new Date().toISOString().split("T")[0]);
  const [temaAula, setTemaAula] = useState("");
  const [observacao, setObservacao] = useState("");
  const [presencas, setPresencas] = useState<Record<number, boolean>>({});
  const [mensagem, setMensagem] = useState<string | null>(null);

  useEffect(() => { setIdTurma(String(turmasDisponiveis[0]?.id || "")); }, [disciplinaAtual?.idDisciplina]);
  useEffect(() => { setPresencas(Object.fromEntries((turmaAtual?.estudantes || []).map((estudante) => [estudante.id, true]))); }, [turmaAtual?.id]);

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (!turmaAtual || !disciplinaAtual) return;
    startTransition(async () => {
      const resultado = await lancarDiarioEPresencasServer({ idDisciplina: disciplinaAtual.idDisciplina, idTurma: turmaAtual.id, dataAula, temaAula, observacao, presencas: turmaAtual.estudantes.map((estudante) => ({ idUsuario: estudante.id, presente: Boolean(presencas[estudante.id]) })) });
      setMensagem(resultado.success ? "Diário de aula e presenças guardados com sucesso." : resultado.error || "Não foi possível guardar o lançamento.");
      if (resultado.success) router.refresh();
    });
  };

  return <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5"><h3 className="text-lg font-bold text-slate-800">Diário de aula e presenças</h3><p className="text-sm text-slate-500">Registe o tema da aula e a chamada da turma. Um novo lançamento na mesma data atualiza o registo.</p></div>{mensagem && <p role="status" className="mb-4 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">{mensagem}</p>}<form onSubmit={enviar} className="space-y-5"><div className="grid grid-cols-1 gap-4 md:grid-cols-3"><label className="space-y-2 text-sm font-semibold text-slate-700"><span>Disciplina</span><select value={idDisciplina} onChange={(evento) => setIdDisciplina(evento.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">{disciplinas.map((disciplina) => <option key={disciplina.idDisciplina} value={disciplina.idDisciplina}>{disciplina.nomeDisciplina} · {disciplina.nomeCurso}</option>)}</select></label><label className="space-y-2 text-sm font-semibold text-slate-700"><span>Turma</span><select value={idTurma} onChange={(evento) => setIdTurma(evento.target.value)} required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">Selecionar</option>{turmasDisponiveis.map((turma) => <option key={turma.id} value={turma.id}>{turma.nomeTurma} · {turma.anoCurricular}º ano · {turma.periodo}</option>)}</select></label><label className="space-y-2 text-sm font-semibold text-slate-700"><span>Data da aula</span><input type="date" value={dataAula} onChange={(evento) => setDataAula(evento.target.value)} required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label></div><label className="block space-y-2 text-sm font-semibold text-slate-700"><span>Tema da aula</span><input value={temaAula} onChange={(evento) => setTemaAula(evento.target.value)} maxLength={1000} required placeholder="Ex.: Introdução às estruturas de dados" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label><label className="block space-y-2 text-sm font-semibold text-slate-700"><span>Observação</span><textarea value={observacao} onChange={(evento) => setObservacao(evento.target.value)} maxLength={500} rows={3} placeholder="Notas da aula, reposição ou atividades práticas" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>{!turmaAtual ? <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">Selecione uma turma para lançar a chamada.</p> : <div className="space-y-3"><div className="flex items-center justify-between"><h4 className="font-semibold text-slate-800">Chamada da turma</h4><span className="text-xs font-semibold text-slate-400">{turmaAtual.estudantes.length} estudante(s)</span></div><div className="grid grid-cols-1 gap-3 md:grid-cols-2">{turmaAtual.estudantes.map((estudante) => <div key={estudante.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4"><div><p className="font-semibold text-slate-800">{estudante.nome}</p><p className="text-xs text-slate-500">{estudante.numEstudanteLogin || "Sem número de estudante"}</p></div><button type="button" onClick={() => setPresencas((estado) => ({ ...estado, [estudante.id]: !estado[estudante.id] }))} className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold shadow-xs transition-all ${presencas[estudante.id] ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-amber-100 text-amber-800 border border-amber-200"}`}><CheckCircle2 className="h-4 w-4" />{presencas[estudante.id] ? "Presente" : "Ausente"}</button></div>)}</div></div>}<div className="flex justify-end"><button type="submit" disabled={isPending || !turmaAtual || turmaAtual.estudantes.length === 0} className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{isPending && <Loader2 className="h-4 w-4 animate-spin" />}{isPending ? "A guardar..." : "Guardar diário e presenças"}</button></div></form></div>;
}