import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaginaSecao } from "@/components/pagina-seccao";
import { BibliotecaDigitalClient, MaterialItem } from "@/features/academic/components/biblioteca-digital-client";

export const revalidate = 0;

export default async function EstudanteBibliotecaPage() {
  const sessao = await auth();
  const idUsuario = Number(sessao?.user?.id);
  const papeis = (sessao?.user as { roles?: string[] } | undefined)?.roles || [];

  if (!sessao || !Number.isInteger(idUsuario) || idUsuario <= 0) {
    redirect("/login");
  }

  // Buscar todos os materiais didáticos no PostgreSQL
  const materiaisBrutos = await prisma.materialDidatico.findMany({
    include: {
      professor: { select: { nome: true } },
      disciplina: { select: { id: true, nomeDisciplina: true } },
    },
    orderBy: { dataPublicacao: "desc" },
    take: 50,
  });

  // Buscar disciplinas disponíveis
  const disciplinasBrutas = await prisma.disciplina.findMany({
    select: { id: true, nomeDisciplina: true },
    orderBy: { nomeDisciplina: "asc" },
  });

  const materiaisFormatados: MaterialItem[] = materiaisBrutos.map((m) => ({
    id: Number(m.idMaterial),
    idDisciplina: m.idDisciplina,
    titulo: m.titulo,
    descricao: m.descricao,
    tipoMaterial: m.tipoMaterial,
    urlArquivo: m.urlArquivo,
    tamanhoArquivo: m.tamanhoArquivo,
    dataPublicacao: m.dataPublicacao.toISOString(),
    professorNome: m.professor.nome,
    disciplinaNome: m.disciplina.nomeDisciplina,
  }));

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="estudante"
        titulo="Biblioteca Digital & Repositório de PDF"
        descricao="Consulte livros digitais, sebentas das cadeiras e resumos das matérias com leitor de PDF integrado."
        indicadores={[
          { titulo: "Materiais", valor: `${materiaisFormatados.length}`, observacao: "Disponíveis em PDF" },
          { titulo: "Leitor de PDF", valor: "Integrado", observacao: "Visualização sem download" },
          { titulo: "Acesso", valor: "Livre", observacao: "Estudantes UKV" },
        ]}
        resumos={[
          {
            titulo: "Repositório Académico Central",
            descricao: "Manuais e Guias de Exercícios verificados e disponibilizados pelos docentes do curso.",
            estado: "Ativo",
          },
        ]}
      />

      <div className="px-6 pb-8 lg:px-8">
        <BibliotecaDigitalClient
          materiais={materiaisFormatados}
          disciplinas={disciplinasBrutas}
          usuarioAtual={{
            id: idUsuario,
            nome: sessao.user?.name || "Estudante",
            papeis,
          }}
        />
      </div>
    </div>
  );
}
