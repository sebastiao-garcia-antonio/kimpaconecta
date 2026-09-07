import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "./dashboard-shell";
import { AcademicRepository } from "@/features/academic/repositories/academic.repository";
import { NotificationsRepository } from "@/features/notifications/repositories/notifications.repository";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id?: string; name?: string | null; roles?: string[] };
  const roles = user.roles || [];
  const userName = user.name || "Utilizador";
  const idUsuario = Number(user.id);

  let primaryRole: "admin" | "professor" | "coordenador" | "estudante" = "estudante";
  if (roles.includes("admin")) primaryRole = "admin";
  else if (roles.includes("coordenador")) primaryRole = "coordenador";
  else if (roles.includes("professor")) primaryRole = "professor";

  const [contextoAcademico, notificacoesNaoLidas] = await Promise.all([
    primaryRole === "estudante" ? AcademicRepository.obterContextoAcademicoDoEstudante(idUsuario) : Promise.resolve(null),
    NotificationsRepository.contarNaoLidas(idUsuario),
  ]);

  return (
    <DashboardShell
      role={primaryRole}
      userName={userName}
      contextoAcademico={contextoAcademico as any}
      notificacoesNaoLidas={notificacoesNaoLidas}
    >
      {children}
    </DashboardShell>
  );
}