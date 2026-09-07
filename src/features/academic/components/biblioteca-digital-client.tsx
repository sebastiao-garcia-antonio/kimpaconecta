"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, FileText, Download, Eye, Plus, Search, Sparkles, Filter, X, Loader2 } from "lucide-react";
import { publicarMaterialDidaticoServer } from "../materials.actions";

export type MaterialItem = {
  id: number;
  titulo: string;
  descricao?: string | null;
  tipoMaterial: string;
  urlArquivo: string;
  tamanhoArquivo?: string | null;
  dataPublicacao: string;
  professorNome: string;
  disciplinaNome: string;
};

interface BibliotecaDigitalClientProps {
  materiais: MaterialItem[];
  disciplinas: Array<{ id: number; nomeDisciplina: string }>;
  usuarioAtual: {
    id: number;
    nome: string;
    papeis: string[];
  };
}

export function BibliotecaDigitalClient({ materiais, disciplinas, usuarioAtual }: BibliotecaDigitalClientProps) {
  const router = useRouter();
  const [filtro, setFiltro] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("TODOS");
  const [filtroDisciplina, setFiltroDisciplina] = useState<number | "TODAS">("TODAS");
  const [pdfVisualizarUrl, setPdfVisualizarUrl] = useState<{ url: string; titulo: string } | null>(null);
  const [modalPublicar, setModalPublicar] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipoMaterial, setTipoMaterial] = useState("PDF");
  const [urlArquivo, setUrlArquivo] = useState("");
  const [idDisciplina, setIdDisciplina] = useState<number | "">("");

  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [pendente, iniciarTransicao] = useTransition();

  const ehDocenteOuStaff = usuarioAtual.papeis.some((p) => ["admin", "coordenador", "professor"].includes(p));

  const publicarMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setSucesso(null);

    if (!titulo.trim() || !urlArquivo.trim() || !idDisciplina) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }

    iniciarTransicao(async () => {
      const res = await publicarMaterialDidaticoServer({
        idDisciplina: Number(idDisciplina),
        titulo,
        descricao,
        tipoMaterial,
        urlArquivo,
      });

      if (res.error) {
        setErro(res.error);
        return;
      }

      setSucesso("Material didático publicado na Biblioteca Digital!");
      setTitulo("");
      setDescricao("");
      setUrlArquivo("");
      setModalPublicar(false);
      router.refresh();
    });
  };

  const materiaisFiltrados = materiais.filter((m) => {
    const combinaTexto =
      m.titulo.toLowerCase().includes(filtro.toLowerCase()) ||
      (m.descricao && m.descricao.toLowerCase().includes(filtro.toLowerCase())) ||
      m.disciplinaNome.toLowerCase().includes(filtro.toLowerCase());

    const combinaTipo = filtroTipo === "TODOS" || m.tipoMaterial === filtroTipo;
    const combinaDisc = filtroDisciplina === "TODAS" || m.id === filtroDisciplina;

    return combinaTexto && combinaTipo && combinaDisc;
  });

  return (
    <div className="space-y-6">
      {/* Alertas */}
      {sucesso && <p className="rounded-2xl bg-emerald-50 p-4 text-xs font-bold text-emerald-800 border border-emerald-200">{sucesso}</p>}
      {erro && <p className="rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-800 border border-rose-200">{erro}</p>}

      {/* Barra de Ações Superior */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-brand-blue" /> Biblioteca Digital & Repositório de Materiais
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Aceda a sebentas, livros em PDF, resumos e guias de exercícios publicados pelos docentes da universidade.
          </p>
        </div>
        {ehDocenteOuStaff && (
          <button
            type="button"
            onClick={() => setModalPublicar(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-brand-blue-dark transition"
          >
            <Plus className="h-4 w-4" /> Publicar Material / PDF
          </button>
        )}
      </div>

      {/* Barra de Pesquisa e Filtros */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por título, disciplina ou tema..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 outline-none"
          >
            <option value="TODOS">Todos os Formatos</option>
            <option value="PDF">Documentos PDF</option>
            <option value="Sebenta">Sebentas Oficiais</option>
            <option value="Livro">Livros & Manuais</option>
            <option value="Exercicios">Listas de Exercícios</option>
          </select>
        </div>
      </div>

      {/* Grelha de Materiais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materiaisFiltrados.length > 0 ? (
          materiaisFiltrados.map((m) => (
            <div key={m.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-brand-blue/30 transition">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-black text-brand-blue border border-blue-200">
                    {m.tipoMaterial}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">{m.tamanhoArquivo || "PDF"}</span>
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900 line-clamp-1">{m.titulo}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">Disciplina: <strong className="text-slate-700">{m.disciplinaNome}</strong></p>
                  <p className="text-[11px] text-slate-400">Publicado por: {m.professorNome}</p>
                </div>

                {m.descricao && <p className="text-xs text-slate-600 line-clamp-2">{m.descricao}</p>}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPdfVisualizarUrl({ url: m.urlArquivo, titulo: m.titulo })}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-brand-blue px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-blue-dark transition"
                >
                  <Eye className="h-4 w-4" /> Ler PDF
                </button>
                <a
                  href={m.urlArquivo}
                  download
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-100 p-2 text-slate-700 hover:bg-slate-200 transition"
                  title="Descarregar Ficheiro"
                >
                  <Download className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-3 text-sm font-bold text-slate-800">Nenhum material encontrado</h3>
            <p className="mt-1 text-xs text-slate-500">Ajuste os filtros de pesquisa para encontrar sebentas e livros em PDF.</p>
          </div>
        )}
      </div>

      {/* Modal Leitor de PDF Integrado */}
      {pdfVisualizarUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-5xl h-[85vh] rounded-3xl bg-white p-4 shadow-2xl border border-slate-200 flex flex-col space-y-3">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-black text-slate-900 truncate max-w-xl">
                📖 Leitor de PDF: {pdfVisualizarUrl.titulo}
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={pdfVisualizarUrl.url}
                  download
                  className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  <Download className="h-3.5 w-3.5" /> Baixar
                </a>
                <button
                  type="button"
                  onClick={() => setPdfVisualizarUrl(null)}
                  className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
                >
                  Fechar ✕
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden rounded-2xl bg-slate-100 border border-slate-200">
              <iframe
                src={`${pdfVisualizarUrl.url}#toolbar=1`}
                className="w-full h-full border-none"
                title="Leitor de PDF"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Publicação */}
      {modalPublicar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Publicar Material Didático / PDF</h3>
              <button type="button" onClick={() => setModalPublicar(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={publicarMaterial} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Disciplina *</label>
                <select
                  value={idDisciplina}
                  onChange={(e) => setIdDisciplina(Number(e.target.value))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 outline-none"
                  required
                >
                  <option value="">Selecione a Disciplina...</option>
                  {disciplinas.map((d) => (
                    <option key={d.id} value={d.id}>{d.nomeDisciplina}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Título do Material *</label>
                <input
                  type="text"
                  placeholder="Ex: Sebenta Oficial de Algoritmos - Módulo 1"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Formato / Tipo</label>
                <select
                  value={tipoMaterial}
                  onChange={(e) => setTipoMaterial(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="PDF">Documento PDF</option>
                  <option value="Sebenta">Sebenta da Cadeira</option>
                  <option value="Livro">Livro Recomendado</option>
                  <option value="Exercicios">Guia de Exercícios</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">URL ou Ficheiro (PDF) *</label>
                <input
                  type="text"
                  placeholder="Ex: /uploads/materiais/algoritmos.pdf ou URL"
                  value={urlArquivo}
                  onChange={(e) => setUrlArquivo(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Descrição Breve</label>
                <textarea
                  rows={2}
                  placeholder="Resumo do conteúdo do ficheiro..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setModalPublicar(false)} className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
                <button type="submit" disabled={pendente} className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-blue-dark disabled:opacity-60">
                  {pendente ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Publicar na Biblioteca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
