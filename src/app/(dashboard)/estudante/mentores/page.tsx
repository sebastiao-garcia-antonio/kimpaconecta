import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PaginaSecao } from "@/components/pagina-seccao";
import { EscolhaMentorCard } from "@/features/academic/components/mentores-estudante-client";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function serializar<T>(valor: T): T {
  return JSON.parse(JSON.stringify(valor, (_chave, item) => (typeof item === "bigint" ? Number(item) : item)));
}

export default async function PaginaMentores({ searchParams }: PageProps) {
  const sessao = await auth();

  if (!sessao?.user) {
    redirect("/login");
  }

  const papeis = (sessao.user as any).roles || [];
  if (!papeis.includes("estudante")) {
    redirect("/login");
  }

  const idEstudante = Number(sessao.user.id);

  const matriculasEstudante = await prisma.matricula.findMany({
    where: { idUsuario: idEstudante },
    select: { idTurma: true, turma: { select: { idCurso: true } } },
  });

  const idsCursos = Array.from(new Set(matriculasEstudante.map((matricula) => matricula.turma.idCurso)));

  const [mentoresDisponiveis, gruposMentoria] = await Promise.all([
    prisma.usuario.findMany({
      where: {
        NOT: { id: idEstudante },
        status: "ativo",
        perfis: { some: { perfil: { nomePerfil: "estudante" } } },
        ...(idsCursos.length > 0
          ? { matriculas: { some: { isMentor: true, turma: { idCurso: { in: idsCursos } } } } }
          : { matriculas: { some: { isMentor: true } } }),
      },
      select: {
        id: true,
        nome: true,
        email: true,
        numEstudanteLogin: true,
        numBi: true,
        telefone: true,
        matriculas: {
          where: {
            isMentor: true,
            ...(idsCursos.length > 0 ? { turma: { idCurso: { in: idsCursos } } } : {}),
          },
          select: {
            id: true,
            numProcesso: true,
            turma: { select: { nomeTurma: true, anoCurricular: true, curso: { select: { nomeCurso: true } } } },
          },
        },
        _count: {
          select: {
            presencas: true,
            historicoAcademico: true,
          },
        },
      },
      orderBy: { nome: "asc" },
    }),
    prisma.grupo.findMany({
      where: { tipoGrupo: "mentoria", idCriador: idEstudante },
      select: {
        id: true,
        nomeGrupo: true,
        membros: {
          where: { funcaoNoGrupo: "mentor" },
          select: {
            idUsuario: true,
            usuario: { select: { id: true, nome: true, email: true, numEstudanteLogin: true } },
          },
        },
      },
      orderBy: { id: "desc" },
    }),
  ]);

  const mentorAtual =
    gruposMentoria.length > 0
      ? {
          idGrupo: gruposMentoria[0].id,
          nomeGrupo: gruposMentoria[0].nomeGrupo,
          mentor: gruposMentoria[0].membros[0]?.usuario || null,
        }
      : null;

  const totalMentores = mentoresDisponiveis.length;
  const tenhoMentor = Boolean(mentorAtual);

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="estudante"
        titulo="Escolher um Mentor"
        descricao="Veja os mentores selecionados pela coordenação da sua faculdade e escolha quem deseja acompanhar o seu percurso académico."
        indicadores={[
          { titulo: "Mentores", valor: String(totalMentores), observacao: "Disponíveis na sua faculdade" },
          { titulo: "Matrículas", valor: String(matriculasEstudante.length), observacao: "Em cursos elegíveis" },
          {
            titulo: "Mentor atual",
            valor: tenhoMentor ? "Sim" : "Nenhum",
            observacao: tenhoMentor ? "Já tem acompanhamento" : "Escolha abaixo",
          },
        ]}
        resumos={
          [
            ...(mentorAtual
              ? [
                  {
                    titulo: `Mentor escolhido: ${mentorAtual.mentor?.nome || "—"}`,
                    descricao: mentorAtual.nomeGrupo,
                    estado: "Ativo",
                  },
                ]
              : []),
            ...mentoresDisponiveis.slice(0, 3).map((mentor) => ({
              titulo: mentor.nome,
              descricao: mentor.email,
              estado: "Disponível",
            })),
          ]
        }
      />

      <div className="px-6 pb-8 lg:px-8">
        {mentoresDisponiveis.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <h3 className="text-base font-bold text-slate-700">Sem mentores disponíveis</h3>
            <p className="mt-1 text-sm text-slate-500">
              A coordenação ainda não selecionou mentores para a sua faculdade. Volte mais tarde.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {mentorAtual && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm text-emerald-800">
                Está atualmente sob a mentoria de <strong>{mentorAtual.mentor?.nome || "—"}</strong>. Se pretender,
                pode escolher outro mentor abaixo.
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {mentoresDisponiveis.map((mentor) => {
                const matriculas = (mentor as any).matriculas as {
                  id: number;
                  numProcesso: string;
                  turma: {
                    nomeTurma: string;
                    anoCurricular: number;
                    curso: { nomeCurso: string };
                  };
                }[];

                return (
                  <EscolhaMentorCard
                    key={mentor.id}
                    mentor={serializar({
                      id: mentor.id,
                      nome: mentor.nome,
                      email: mentor.email,
                      numEstudanteLogin: mentor.numEstudanteLogin,
                      telefone: mentor.telefone,
                      cursos: Array.from(new Set(matriculas.map((matricula) => matricula.turma.curso.nomeCurso))),
                      turmas: Array.from(new Set(matriculas.map((matricula) => matricula.turma.nomeTurma))),
                      anoCurricular: matriculas[0]?.turma.anoCurricular || null,
                      presencas: (mentor as any)._count.presencas || 0,
                      historico: (mentor as any)._count.historicoAcademico || 0,
                    })}
                    ehMentorAtual={mentorAtual?.mentor?.id === mentor.id}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}