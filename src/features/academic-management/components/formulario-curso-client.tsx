"use client";

import { FormEvent, useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { guardarCursoServer } from "@/features/academic-management/actions";

type Unidade = { id: number; nomeUo: string; sigla: string };
type Coordenador = { id: number; nome: string };
type Curso = { id: number; idUo: number; nomeCurso: string; idCoordenador?: number | null };

export function FormularioCursoClient({ unidades, coordenadores, cursos }: { unidades: Unidade[]; coordenadores: Coordenador[]; cursos: Curso[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [idCurso, setIdCurso] = useState("");
  const [idUo, setIdUo] = useState(String(unidades[0]?.id || ""));
  const [nomeCurso, setNomeCurso] = useState("");
  const [idCoordenador, setIdCoordenador] = useState("");
  const [mensagem, setMensagem] = useState<string | null>(null);

  const selecionarCurso = (valor: string) => {
    setIdCurso(valor);
    const curso = cursos.find((item) => item.id === Number(valor));
    setIdUo(curso ? String(curso.idUo) : String(unidades[0]?.id || ""));
    setNomeCurso(curso?.nomeCurso || "");
    setIdCoordenador(curso?.idCoordenador ? String(curso.idCoordenador) : "");
  };

  const guardar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    startTransition(async () => {
      const resultado = await guardarCursoServer(idCurso || null, { idUo, nomeCurso, idCoordenador: idCoordenador || null });
      setMensagem(resultado.success ? "Curso guardado com sucesso." : resultado.error || "Não foi possível guardar o curso.");
      if (resultado.success) { selecionarCurso(""); router.refresh(); }
    });
  };

  return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5"><h3 className="text-lg font-bold text-slate-800">Gerir cursos</h3><p className="text-sm text-slate-500">Crie um curso ou selecione um existente para editar e atribuir o coordenador.</p></div>{mensagem && <p role="status" className="mb-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{mensagem}</p>}<form onSubmit={guardar} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"><label className="space-y-2 text-sm font-semibold text-slate-700"><span>Curso a editar</span><select value={idCurso} onChange={(evento) => selecionarCurso(evento.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">Novo curso</option>{cursos.map((item) => <option key={item.id} value={item.id}>{item.nomeCurso}</option>)}</select></label><label className="space-y-2 text-sm font-semibold text-slate-700"><span>Unidade orgânica</span><select value={idUo} onChange={(evento) => setIdUo(evento.target.value)} required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">Selecionar</option>{unidades.map((item) => <option key={item.id} value={item.id}>{item.nomeUo} ({item.sigla})</option>)}</select></label><label className="space-y-2 text-sm font-semibold text-slate-700"><span>Nome do curso</span><input value={nomeCurso} onChange={(evento) => setNomeCurso(evento.target.value)} maxLength={150} required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label><label className="space-y-2 text-sm font-semibold text-slate-700"><span>Coordenador</span><select value={idCoordenador} onChange={(evento) => setIdCoordenador(evento.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">Sem atribuição</option>{coordenadores.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label><div className="md:col-span-2 xl:col-span-4 flex justify-end"><button type="submit" disabled={isPending || unidades.length === 0} className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{isPending ? "A guardar..." : "Guardar curso"}</button></div></form></section>;
}