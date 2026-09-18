import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AcademicRepository } from "@/features/academic/repositories/academic.repository";
import ProfessorDashboardClient from "@/features/academic/components/professor-dashboard-client";
import { PaginaSecao } from "@/components/pagina-seccao";

export default async function DashboardPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const roles = (session.user as any).roles || [];
  if (!roles.includes("professor")) {
    redirect("/login");
  }

  const professorId = Number(session.user.id);
  const professorNome = session.user.name || "Professor";

  const courses = await AcademicRepository.getTeacherCoursesAndDisciplines(professorId);
  const evaluations = await AcademicRepository.getTeacherEvaluations(professorId);
  const meetings = await AcademicRepository.getTeacherMeetings(professorId);
  const reputation = await AcademicRepository.getTeacherReputacao(professorId);
  const projects = await AcademicRepository.getShowcaseProjects(professorId);
  const opportunities = await AcademicRepository.getTeacherOpportunities(professorId);
  const notifications = await AcademicRepository.getTeacherNotifications(professorId);

  const disciplinesMap: Record<number, any> = {};
  const studentsMap: Record<number, any> = {};

  for (const uc of (courses as any[])) {
    const curso = uc.curso;
    if (!curso) continue;

    for (const disc of curso.disciplinas) {
      disciplinesMap[disc.id] = {
        ...disc,
        cursoNome: curso.nomeCurso,
        alunosCount: 0
      };
    }

    for (const turma of curso.turmas) {
      for (const mat of turma.matriculas) {
        const student = mat.usuario;
        if (!student) continue;

        studentsMap[student.id] = {
          ...student,
          turmaNome: turma.nomeTurma,
          numProcesso: mat.numProcesso,
          isMentor: mat.isMentor
        };
      }
    }
  }

  const disciplines = Object.values(disciplinesMap);
  const students = Object.values(studentsMap);

  const cursoAlunosMap: Record<number, number> = {};
  for (const uc of (courses as any[])) {
    const curso = uc.curso;
    if (!curso) continue;
    let total = 0;
    for (const turma of curso.turmas) {
      total += turma.matriculas.length;
    }
    cursoAlunosMap[curso.id] = total;
  }

  for (const disc of disciplines) {
    disc.alunosCount = cursoAlunosMap[disc.idCurso] || 0;
  }

  const initialData = {
    disciplines,
    students,
    evaluations,
    meetings,
    reputation,
    projects,
    opportunities,
    notifications
  };

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="professor"
        mostrarVoltar={false}
        titulo="Painel do docente"
        descricao="Acompanhamento das aulas, avaliações, grupos e oportunidades ligadas ao teu percurso académico."
        indicadores={[
          { titulo: "Disciplinas", valor: String(disciplines.length), observacao: "Associadas ao docente" },
          { titulo: "Avaliações", valor: String(evaluations.length), observacao: "Lançadas" },
          { titulo: "Projectos", valor: String(projects.length), observacao: "Em acompanhamento" },
          { titulo: "Notificações", valor: String(notifications.length), observacao: "Últimas actualizações" },
        ]}
        resumos={[
          { titulo: "Reputação docente", descricao: "Mantém o acompanhamento das actividades e da interação com os estudantes.", estado: String((reputation as any)?.pontos || 0) },
          { titulo: "Reuniões e aulas", descricao: "Os horários e encontros aparecem organizados para gestão rápida.", estado: String(meetings.length) },
          { titulo: "Oportunidades activas", descricao: "Vagas e propostas de colaboração ligadas ao teu contexto académico.", estado: String(opportunities.length) },
        ]}
      />

      <div className="px-6 lg:px-8 pb-8">
        <ProfessorDashboardClient
          initialData={initialData}
          professorId={professorId}
          professorNome={professorNome}
        />
      </div>
    </div>
  );
}

