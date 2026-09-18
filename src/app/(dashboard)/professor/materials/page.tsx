import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaginaSecao } from "@/components/pagina-seccao";
import { BibliotecaDigitalClient, MaterialItem } from "@/features/academic/components/biblioteca-digital-client";

export const revalidate = 0;

export default async function ProfessorMaterialsPage() {
  const sessao = await auth();
  const idUsuario = Number(sessao?.user?.id);
  const papeis = (sessao?.user as { roles?: string[] } | undefined)?.roles || [];

  if (!sessao || !Number.isInteger(idUsuario) || idUsuario <= 0) {
    redirect("/login");
  }

  // Disciplinas lecionadas pelo docente (via vínculo aos cursos)
  const vinculos = await prisma.usuarioCurso.findMany({
    where: { idUsuario: idUsuario },
    include: { curso: { select: { id: true } } },
  });
  const idsCursos = vinculos.map((vinculo) => vinculo.idCurso);

  const disciplinasBrutas = idsCursos.length
    ? await prisma.disciplina.findMany({
        where: { idCurso: { in: idsCursos } },
        select: { id: true, nomeDisciplina: true },
        orderBy: { nomeDisciplina: "asc" },
      })
    : [];

  // Materiais publicados pelo próprio docente
  const materiaisBrutos = await prisma.materialDidatico.findMany({
    where: { idProfessor: idUsuario },
    include: {
      professor: { select: { nome: true } },
      disciplina: { select: { id: true, nomeDisciplina: true } },
    },
    orderBy: { dataPublicacao: "desc" },
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

  const dataUltimaPublicacao = materiaisBrutos[0]?.dataPublicacao
    ? new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(materiaisBrutos[0].dataPublicacao))
    : null;

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="professor"
        titulo="Repositório de Materiais & Publicação PDF"
        descricao="Publicar sebentas, manuais, guiões de laboratório e listas de exercícios para os estudantes."
        indicadores={[
          { titulo: "Ficheiros Publicados", valor: `${materiaisFormatados.length}`, observacao: "PDFs & Sebentas" },
          { titulo: "Disciplinas", valor: `${disciplinasBrutas.length}`, observacao: "Vinculadas" },
          { titulo: "Última publicação", valor: dataUltimaPublicacao || "—", observacao: "Data do ficheiro mais recente" },
        ]}
        resumos={[
          {
            titulo: "Publicação de Conteúdo Pedagógico",
            descricao: "Disponibilize ficheiros PDF legíveis diretamente no navegador sem necessidade de descarregamento.",
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
            nome: sessao.user?.name || "Professor",
            papeis,
          }}
        />
      </div>
    </div>
  );
}
