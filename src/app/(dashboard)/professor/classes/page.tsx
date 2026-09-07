import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AcademicRepository } from "@/features/academic/repositories/academic.repository";
import { PaginaSecao } from "@/components/pagina-seccao";
import { PresencasDocenteClient } from "@/features/academic/components/presencas-docente-client";
import { EstadoVazio } from "@/components/estado-vazio";

export default async function PaginaDisciplinasDocente() {
  const sessao = await auth();

  if (!sessao?.user) {
    redirect("/login");
  }

  const papeis = (sessao.user as any).roles || [];
  if (!papeis.includes("professor")) {
    redirect("/login");
  }

  const idDocente = Number(sessao.user.id);
  const vinculos = await AcademicRepository.obterCursosEDisciplinasDoDocente(idDocente);
  const disciplinas = await AcademicRepository.obterDisciplinasDoDocente(idDocente);

  const estudantesMap = new Map<number, {
    id: number;
    nome: string;
    email: string;
    numEstudanteLogin?: string | null;
    turmaNome?: string;
    cursoNome?: string;
  }>();

  const cursos = Array.isArray(vinculos)
    ? vinculos.map((vinculo: any) => vinculo.curso).filter(Boolean)
    : [];

  for (const curso of cursos) {
    for (const turma of curso.turmas || []) {
      for (const matricula of turma.matriculas || []) {
        const estudante = matricula.usuario;
        if (!estudante) continue;

        estudantesMap.set(estudante.id, {
          id: estudante.id,
          nome: estudante.nome,
          email: estudante.email,
          numEstudanteLogin: estudante.numEstudanteLogin,
          turmaNome: turma.nomeTurma,
          cursoNome: curso.nomeCurso,
        });
      }
    }
  }

  const estudantes = Array.from(estudantesMap.values());
  const turmas = cursos.flatMap((curso: any) => (curso.turmas || []).map((turma: any) => ({
    id: turma.id,
    idCurso: curso.id,
    nomeTurma: turma.nomeTurma,
    anoCurricular: turma.anoCurricular,
    periodo: turma.periodo,
    estudantes: (turma.matriculas || []).map((matricula: any) => matricula.usuario).filter(Boolean),
  })));
  const totalDisciplinas = disciplinas.length;
  const totalTurmas = cursos.reduce((total, curso) => total + (curso.turmas?.length || 0), 0);
  const totalEstudantes = estudantes.length;
  const semestres = new Set(disciplinas.map((disciplina: any) => disciplina.semestre)).size;

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="professor"
        titulo="Disciplinas e presenças"
        descricao="Gestão das disciplinas lecionadas, controlo de presenças e acompanhamento por turma."
        indicadores={[
          { titulo: "Disciplinas", valor: String(totalDisciplinas), observacao: `${semestres} semestre(s)` },
          { titulo: "Turmas", valor: String(totalTurmas), observacao: "Cobertura total" },
          { titulo: "Estudantes", valor: String(totalEstudantes), observacao: "Registos vinculados" },
          { titulo: "Cursos", valor: String(cursos.length), observacao: "Cursos associados" },
        ]}
        resumos={disciplinas.slice(0, 3).map((disciplina: any) => ({
          titulo: disciplina.nomeDisciplina,
          descricao: `${disciplina.nomeCurso} · Semestre ${disciplina.semestre} · ${disciplina.totalEstudantes} estudante(s)`,
          estado: "Ativa",
        }))}
      />

      <div className="px-6 lg:px-8 pb-8">
        {disciplinas.length === 0 ? (
          <EstadoVazio
            titulo="Sem disciplinas atribuídas"
            descricao="Quando houver disciplinas associadas ao teu perfil, a gestão de presenças aparecerá aqui."
          />
        ) : (
          <PresencasDocenteClient
            disciplinas={disciplinas as any}
            turmas={turmas as any}
          />
        )}
      </div>
    </div>
  );
}
