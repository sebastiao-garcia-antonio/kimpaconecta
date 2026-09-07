"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Video, Calendar, Clock, Play, Plus, Users, ExternalLink, ShieldCheck, Sparkles, Loader2 } from "lucide-react";
import { agendarAulaVirtualServer, iniciarAulaVirtualServer } from "../virtual-classes.actions";

export type AulaVirtualItem = {
  id: number;
  titulo: string;
  descricao?: string | null;
  criadorNome: string;
  grupoNome?: string | null;
  linkReuniao: string;
  plataforma: string;
  dataInicio: string;
  status: string;
};

interface AulasVirtuaisClientProps {
  aulas: AulaVirtualItem[];
  usuarioAtual: {
    id: number;
    nome: string;
    papeis: string[];
  };
}

export function AulasVirtuaisClient({ aulas, usuarioAtual }: AulasVirtuaisClientProps) {
  const router = useRouter();
  const [modalAgendar, setModalAgendar] = useState(false);
  const [salaAoVivoUrl, setSalaAoVivoUrl] = useState<string | null>(null);
  const [tituloAula, setTituloAula] = useState("");
  const [descricao, setDescricao] = useState("");
  const [plataforma, setPlataforma] = useState("WebRTC / Kimpa Room");
  const [dataInicio, setDataInicio] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [pendente, iniciarTransicao] = useTransition();

  const ehDocenteOuStaff = usuarioAtual.papeis.some((p) => ["admin", "coordenador", "professor"].includes(p));

  const agendarAula = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setSucesso(null);

    if (!tituloAula.trim() || !dataInicio) {
      setErro("Preencha o título e a data de início da aula.");
      return;
    }

    iniciarTransicao(async () => {
      const res = await agendarAulaVirtualServer({
        titulo: tituloAula,
        descricao,
        plataforma,
        dataInicio,
      });

      if (res.error) {
        setErro(res.error);
        return;
      }

      setSucesso("Aula virtual agendada com sucesso!");
      setTituloAula("");
      setDescricao("");
      setModalAgendar(false);
      router.refresh();
    });
  };

  const entrarNaAula = (aula: AulaVirtualItem) => {
    setSalaAoVivoUrl(aula.linkReuniao);
    if (ehDocenteOuStaff && aula.status === "agendada") {
      iniciarTransicao(async () => {
        await iniciarAulaVirtualServer(aula.id);
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Alertas */}
      {sucesso && <p className="rounded-2xl bg-emerald-50 p-4 text-xs font-bold text-emerald-800 border border-emerald-200">{sucesso}</p>}
      {erro && <p className="rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-800 border border-rose-200">{erro}</p>}

      {/* Barra de Ações Superior */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Video className="h-5 w-5 text-brand-blue" /> Aulas Virtuais & Videochamadas
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Participe em aulas ao vivo, conferências de tutoria e reuniões com encriptação e qualidade WebRTC.
          </p>
        </div>
        {ehDocenteOuStaff && (
          <button
            type="button"
            onClick={() => setModalAgendar(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-brand-blue-dark transition"
          >
            <Plus className="h-4 w-4" /> Agendar Aula Virtual
          </button>
        )}
      </div>

      {/* Lista de Aulas Virtuais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {aulas.length > 0 ? (
          aulas.map((aula) => {
            const eAoVivo = aula.status === "em_andamento";

            return (
              <div key={aula.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-brand-blue/30 transition">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                        eAoVivo ? "bg-red-600 text-white animate-pulse" : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {eAoVivo ? "🔴 AO VIVO" : "AGENDADA"}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">{aula.plataforma}</span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 line-clamp-1">{aula.titulo}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">Docente: <strong className="text-slate-700">{aula.criadorNome}</strong></p>
                  </div>

                  {aula.descricao && <p className="text-xs text-slate-600 line-clamp-2">{aula.descricao}</p>}

                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Clock className="h-3.5 w-3.5 text-brand-blue" />
                    <span>{new Date(aula.dataInicio).toLocaleString("pt-AO")}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => entrarNaAula(aula)}
                    className={`w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold text-white shadow-xs transition ${
                      eAoVivo ? "bg-red-600 hover:bg-red-700" : "bg-brand-blue hover:bg-brand-blue-dark"
                    }`}
                  >
                    <Play className="h-4 w-4 fill-current" /> Entrar na Aula Ao Vivo
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <Video className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-3 text-sm font-bold text-slate-800">Nenhuma aula virtual agendada</h3>
            <p className="mt-1 text-xs text-slate-500">As próximas videochamadas e transmissões ao vivo agendadas pelos docentes surgirão aqui.</p>
          </div>
        )}
      </div>

      {/* Modal de Transmissão ao Vivo (Iframe WebRTC) */}
      {salaAoVivoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-5xl h-[80vh] rounded-3xl bg-slate-900 p-4 shadow-2xl border border-slate-800 flex flex-col space-y-3">
            <div className="flex items-center justify-between px-2 text-white">
              <span className="flex items-center gap-2 text-sm font-black text-red-500">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" /> SALA DE AULA VIRTUAL AO VIVO
              </span>
              <button
                type="button"
                onClick={() => setSalaAoVivoUrl(null)}
                className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300 hover:bg-slate-700"
              >
                Sair da Aula ✕
              </button>
            </div>
            <div className="flex-1 overflow-hidden rounded-2xl bg-black">
              <iframe
                src={salaAoVivoUrl}
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                className="w-full h-full border-none"
                title="Sala de Aula Virtual"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Agendamento */}
      {modalAgendar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Agendar Aula Virtual</h3>
              <button type="button" onClick={() => setModalAgendar(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={agendarAula} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Título da Aula *</label>
                <input
                  type="text"
                  placeholder="Ex: Aula de Dúvidas de Algoritmos & Programação"
                  value={tituloAula}
                  onChange={(e) => setTituloAula(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Descrição / Tópicos</label>
                <textarea
                  rows={2}
                  placeholder="Tópicos que serão abordados na aula..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Data e Hora de Início *</label>
                <input
                  type="datetime-local"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Plataforma</label>
                <select
                  value={plataforma}
                  onChange={(e) => setPlataforma(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="WebRTC / Kimpa Room">WebRTC / Sala Integrada Kimpa</option>
                  <option value="Google Meet">Google Meet</option>
                  <option value="Microsoft Teams">Microsoft Teams</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setModalAgendar(false)} className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
                <button type="submit" disabled={pendente} className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-blue-dark disabled:opacity-60">
                  {pendente ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Confirmar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
