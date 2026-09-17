import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PaginaSecao } from "@/components/pagina-seccao";
import { GerenciadorEstudantesCoordenador, type EstudanteCoordenadorData } from "@/features/academic-management/components/gerenciador-estudantes-coordenador";

function serializar<T>(valor: T): T {
  return JSON.parse(JSON.stringify(valor, (_chave, item) => (typeof item === "bigint" ? Number(item) : item)));
}

export default async function PaginaEstudantesCoordenador() {
  const sessao = await auth();

  if (!sessao?.user) {
    redirect("/login");
  }

  const papeis = (sessao.user as any).roles || [];
  if (!papeis.includes("coordenador") && !papeis.includes("admin")) {
    redirect("/login");
  }

  const idCoordenador = Number(sessao.user.id);
  const administrador = papeis.includes("admin");

  // Cursos sob a coordenação do utilizador (ou todos se admin)
  const cursos = await prisma.curso.findMany({
    where: administrador
      ? {}
      : {
          OR: [
            { idCoordenador },
            { usuarios: { some: { idUsuario: idCoordenador } } },
          ],
        },
    select: {
      id: true,
      nomeCurso: true,
      idUo: true,
    },
    orderBy: { nomeCurso: "asc" },
  });

  const idsCursos = cursos.map((curso) => curso.id);

  // Estudantes vinculados aos cursos do coordenador (por UsuarioCurso ou Matrícula)
  const estudantes = await prisma.usuario.findMany({
    where: {
      perfis: { some: { perfil: { nomePerfil: "estudante" } } },
      ...(administrador
        ? {}
        : {
            OR: [
              { cursos: { some: { idCurso: { in: idsCursos } } } },
              { matriculas: { some: { turma: { idCurso: { in: idsCursos } } } } },
            ],
          }),
    },
    include: {
      cursos: {
        select: {
          idCurso: true,
          curso: { select: { id: true, nomeCurso: true } },
        },
      },
      matriculas: {
        select: {
          id: true,
          numProcesso: true,
          anoLectivo: true,
          isMentor: true,
          turma: {
            select: {
              id: true,
              nomeTurma: true,
              anoCurricular: true,
              periodo: true,
              curso: { select: { id: true, nomeCurso: true } },
            },
          },
        },
      },
      _count: {
        select: {
          presencas: true,
          historicoAcademico: true,
          projetosAutor: true,
          publicacoesCriadas: true,
          tentativasProvas: true,
        },
      },
    },
    orderBy: { nome: "asc" },
  });

  const totalMatriculas = estudantes.reduce(
    (total, estudante) => total + estudante.matriculas.length,
    0
  );
  const bloqueados = estudantes.filter((estudante) => estudante.status === "suspenso").length;

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="coordenador"
        titulo="Gestão de Estudantes"
        descricao="Acompanhe os estudantes da sua faculdade: bloqueie acessos, consulte dados em detalhe, envie notificações e remova registos conforme necessário."
        indicadores={[
          { titulo: "Estudantes", valor: String(estudantes.length), observacao: "Na sua coordenação" },
          { titulo: "Cursos", valor: String(cursos.length), observacao: "Sob coordenação" },
          { titulo: "Matrículas", valor: String(totalMatriculas), observacao: "Registadas" },
          { titulo: "Bloqueados", valor: String(bloqueados), observacao: "Acesso suspenso" },
        ]}
        resumos={estudantes.slice(0, 3).map((estudante) => ({
          titulo: estudante.nome,
          descricao: `${estudante.email} · ${estudante.numEstudanteLogin || "sem nº de estudante"}`,
          estado: estudante.status === "suspenso" ? "Bloqueado" : "Activo",
        }))}
      />

      <div className="px-6 pb-8 lg:px-8">
        <GerenciadorEstudantesCoordenador
          cursos={cursos}
          estudantes={serializar(estudantes) as unknown as EstudanteCoordenadorData[]}
        />
      </div>
    </div>
  );
}