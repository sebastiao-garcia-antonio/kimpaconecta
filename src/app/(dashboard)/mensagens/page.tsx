import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PaginaSecao } from "@/components/pagina-seccao";
import { ChatDiretoClient } from "@/features/messaging/components/chat-direto-client";
import { MessagingRepository } from "@/features/messaging/repositories/messaging.repository";

export default async function PaginaMensagens({ searchParams }: { searchParams: Promise<{ conversa?: string }> }) {
  const sessao = await auth();
  const idUsuario = Number(sessao?.user?.id);
  if (!sessao?.user || !Number.isInteger(idUsuario) || idUsuario <= 0) redirect("/login");

  const papeis = (sessao.user as { roles?: string[] }).roles || [];
  const papel: "admin" | "professor" | "coordenador" | "estudante" = papeis.includes("admin") ? "admin" : papeis.includes("coordenador") ? "coordenador" : papeis.includes("professor") ? "professor" : "estudante";
  const consulta = await searchParams;
  const idConversa = Number(consulta.conversa);
  const [contactos, conversas, conversaBruta] = await Promise.all([
    MessagingRepository.listarContactosDisponiveis(idUsuario),
    MessagingRepository.listarConversasDiretas(idUsuario),
    Number.isInteger(idConversa) && idConversa > 0 ? MessagingRepository.obterConversaDireta(idConversa, idUsuario) : Promise.resolve(null),
  ]);

  const conversaAtiva = conversaBruta ? {
    id: conversaBruta.id,
    interlocutor: conversaBruta.membros.find((membro) => membro.idUsuario !== idUsuario)?.usuario,
    mensagens: conversaBruta.mensagens,
  } : null;
  const conversasSerializadas = conversas.map((conversa) => ({
    id: conversa.id,
    interlocutor: conversa.membros[0]?.usuario,
    ultimaMensagem: conversa.mensagens[0],
  }));

  const conversasComAtividade = conversas.filter((conversa) => conversa.mensagens[0]?.conteudo).length;

  return <div className="space-y-8"><PaginaSecao papel={papel} titulo="Mensagens" descricao="Converse em privado com membros ativos da comunidade académica." indicadores={[{ titulo: "Conversas", valor: String(conversas.length), observacao: "Canais privados" }, { titulo: "Contactos", valor: String(contactos.length), observacao: "Utilizadores disponíveis" }, { titulo: "Canais ativos", valor: String(conversasComAtividade), observacao: "Com mensagens trocadas" }]} resumos={[{ titulo: "Comunicação segura", descricao: "Apenas participantes da conversa podem consultar e enviar mensagens.", estado: "Ativa" }]} /><div className="px-6 pb-8 lg:px-8"><ChatDiretoClient idUsuario={idUsuario} contactos={JSON.parse(JSON.stringify(contactos))} conversas={JSON.parse(JSON.stringify(conversasSerializadas))} conversaAtiva={conversaAtiva ? JSON.parse(JSON.stringify(conversaAtiva)) : null} /></div></div>;
}