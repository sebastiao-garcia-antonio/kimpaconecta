"use client";

import { FormEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Loader2, MessageCircle, Send, Users, User, Circle } from "lucide-react";
import { useRouter } from "next/navigation";
import { abrirConversaDiretaServer, enviarMensagemDiretaServer } from "@/features/messaging/actions";
import { connectSocketUser } from "@/lib/socket";

type Contacto = { id: number; nome: string; email: string; fotoPerfil?: string | null };
type Conversa = { id: number; interlocutor?: Contacto; ultimaMensagem?: { conteudo?: string | null; dataEnvio: string } };
type Mensagem = { id: number; idEmissor?: number | null; conteudo?: string | null; dataEnvio: string; emissor?: { nome: string; fotoPerfil?: string | null } | null };

interface ChatDiretoClientProps {
  idUsuario: number;
  contactos: Contacto[];
  conversas: Conversa[];
  conversaAtiva?: { id: number; interlocutor?: Contacto; mensagens: Mensagem[] } | null;
}

function hora(valor: string) {
  return new Intl.DateTimeFormat("pt-PT", { hour: "2-digit", minute: "2-digit" }).format(new Date(valor));
}

function inicial(nome: string) {
  return nome ? nome.substring(0, 2).toUpperCase() : "UK";
}

export function ChatDiretoClient({ idUsuario, contactos, conversas, conversaAtiva }: ChatDiretoClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mensagem, setMensagem] = useState("");
  const [estado, setEstado] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const contactosSemConversa = useMemo(() => {
    const idsEmConversa = new Set(conversas.map((conversa) => conversa.interlocutor?.id).filter(Boolean));
    return contactos.filter((contacto) => !idsEmConversa.has(contacto.id));
  }, [contactos, conversas]);

  // Ligar a Socket.IO para atualizações instantâneas sem recarregar
  useEffect(() => {
    if (!idUsuario) return;
    const socket = connectSocketUser(idUsuario);

    const handleAtualizacao = () => {
      router.refresh();
    };

    socket.on("notification", handleAtualizacao);
    socket.on("nova_mensagem", handleAtualizacao);

    return () => {
      socket.off("notification", handleAtualizacao);
      socket.off("nova_mensagem", handleAtualizacao);
    };
  }, [idUsuario, router]);

  // Scroll automático para a mensagem mais recente
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversaAtiva?.mensagens]);

  const abrirConversa = (idDestinatario: number) => {
    startTransition(async () => {
      const resultado = await abrirConversaDiretaServer(idDestinatario);
      if (!resultado.success) {
        setEstado(resultado.error || "Não foi possível abrir a conversa.");
        return;
      }
      router.push(`/mensagens?conversa=${resultado.data.idGrupo}`);
      router.refresh();
    });
  };

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (!conversaAtiva || !mensagem.trim()) return;

    startTransition(async () => {
      const resultado = await enviarMensagemDiretaServer(conversaAtiva.id, mensagem);
      if (!resultado.success) {
        setEstado(resultado.error || "Não foi possível enviar a mensagem.");
        return;
      }
      setMensagem("");
      setEstado(null);
      router.refresh();
    });
  };

  return (
    <div className="grid min-h-[620px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[340px_minmax(0,1fr)]">
      {/* Coluna Esquerda — Lista de Conversas e Contactos */}
      <aside className="flex flex-col border-b border-slate-200 bg-slate-50/70 p-4 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-2 px-2 pb-4 border-b border-slate-200/80">
          <MessageCircle className="h-5 w-5 text-brand-blue" />
          <h2 className="font-extrabold text-slate-800">Mensagens Privadas</h2>
        </div>

        {/* Conversas Ativas */}
        <div className="mt-4 flex-1 space-y-2 overflow-y-auto">
          {conversas.map((conversa) => {
            const selecionada = conversaAtiva?.id === conversa.id;
            return (
              <button
                key={conversa.id}
                type="button"
                onClick={() => router.push(`/mensagens?conversa=${conversa.id}`)}
                className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${
                  selecionada ? "bg-brand-blue text-white shadow-md shadow-brand-blue/20" : "bg-white hover:bg-slate-100 text-slate-700"
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                  selecionada ? "bg-white/20 text-white" : "bg-brand-blue/10 text-brand-blue"
                }`}>
                  {inicial(conversa.interlocutor?.nome || "UK")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-extrabold">{conversa.interlocutor?.nome || "Conversa privada"}</p>
                  <p className={`mt-0.5 truncate text-[11px] ${selecionada ? "text-blue-100" : "text-slate-500"}`}>
                    {conversa.ultimaMensagem?.conteudo || "Sem mensagens"}
                  </p>
                </div>
              </button>
            );
          })}

          {conversas.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-white/50 p-4 text-center text-xs text-slate-500">
              Nenhuma conversa iniciada. Selecione um contacto abaixo para começar!
            </p>
          )}
        </div>

        {/* Contactos Disponíveis */}
        {contactosSemConversa.length > 0 && (
          <div className="mt-4 border-t border-slate-200/80 pt-4">
            <div className="mb-2 flex items-center gap-2 px-2">
              <Users className="h-4 w-4 text-slate-400" />
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Novo Contacto</h3>
            </div>
            <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
              {contactosSemConversa.map((contacto) => (
                <button
                  key={contacto.id}
                  type="button"
                  onClick={() => abrirConversa(contacto.id)}
                  disabled={isPending}
                  className="flex w-full items-center gap-2.5 rounded-xl bg-white px-3 py-2 text-left text-xs font-bold text-slate-700 transition hover:bg-brand-blue/10 hover:text-brand-blue disabled:opacity-60 border border-slate-100"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-extrabold text-slate-600">
                    {inicial(contacto.nome)}
                  </div>
                  <span className="truncate">{contacto.nome}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Coluna Direita — Janela de Chat Ativa */}
      <section className="flex min-h-[520px] flex-col bg-white">
        {conversaAtiva ? (
          <>
            {/* Header da conversa ativa */}
            <header className="flex items-center justify-between border-b border-slate-200 px-6 py-3.5 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-green text-xs font-black text-white shadow-xs">
                  {inicial(conversaAtiva.interlocutor?.nome || "UK")}
                </div>
                <div>
                  <h2 className="font-extrabold text-sm text-slate-900">{conversaAtiva.interlocutor?.nome || "Conversa privada"}</h2>
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-semibold mt-0.5">
                    <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" />
                    <span>Ligado em tempo real via Socket.IO</span>
                  </div>
                </div>
              </div>
            </header>

            {/* Balões de Mensagem */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50/50 p-6">
              {conversaAtiva.mensagens.length === 0 && (
                <div className="py-16 text-center text-xs text-slate-400">
                  <MessageCircle className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                  Envie a primeira mensagem para iniciar a conversa!
                </div>
              )}
              {conversaAtiva.mensagens.map((item) => {
                const minha = item.idEmissor === idUsuario;
                return (
                  <div key={item.id} className={`flex ${minha ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs shadow-xs ${
                        minha
                          ? "bg-brand-blue text-white rounded-br-none"
                          : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-none"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words leading-relaxed">{item.conteudo}</p>
                      <p className={`mt-1.5 text-[9px] font-semibold text-right ${minha ? "text-blue-100" : "text-slate-400"}`}>
                        {hora(item.dataEnvio)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input de Mensagem */}
            <form onSubmit={enviar} className="border-t border-slate-200 p-4 bg-white">
              {estado && <p role="status" className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{estado}</p>}
              <div className="flex items-center gap-3">
                <textarea
                  value={mensagem}
                  onChange={(evento) => setMensagem(evento.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      enviar(e as any);
                    }
                  }}
                  maxLength={1000}
                  required
                  rows={1}
                  placeholder="Escreva uma mensagem... (Pressione Enter para enviar)"
                  className="min-h-11 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
                />
                <button
                  type="submit"
                  disabled={isPending || !mensagem.trim()}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl bg-brand-blue px-5 text-xs font-extrabold text-white shadow-md shadow-brand-blue/20 transition hover:bg-brand-blue-dark disabled:opacity-60"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span>Enviar</span>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
            <div className="mb-4 rounded-3xl bg-brand-blue/10 p-5 text-brand-blue">
              <MessageCircle className="h-10 w-10" />
            </div>
            <h2 className="text-base font-extrabold text-slate-800">Selecione uma conversa</h2>
            <p className="mt-1.5 max-w-sm text-xs text-slate-500 leading-relaxed">
              Escolha uma conversa existente no menu lateral ou clique num contacto disponível para iniciar um chat privado em tempo real.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}