import { auth } from "@/lib/auth";
import { getDashboardData } from "@/features/academic/actions";
import ProctoringRoomClient from "@/features/academic/components/proctoring-room-client";
import { redirect } from "next/navigation";

export default async function ProfessorProctoringPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const roles = (session.user as any).roles || [];
  if (!roles.includes("professor")) {
    redirect("/login");
  }

  const professorId = Number(session.user.id);
  const professorNome = session.user.name || "Professor";
  const resposta = await getDashboardData(professorId);

  if (!resposta.success || !resposta.data) {
    throw new Error("Não foi possível carregar a sala de monitorização.");
  }

  return (
    <ProctoringRoomClient
      initialData={resposta.data}
      professorId={professorId}
      professorNome={professorNome}
    />
  );
}
