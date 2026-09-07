import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { obterPainelProctoringGlobal } from "@/features/admin/admin.actions";
import ProctoringGlobalClient from "@/features/admin/components/proctoring-global-client";

export default async function ProctoringAdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const roles = (session.user as any).roles || [];
  if (!roles.includes("admin")) {
    redirect("/login");
  }

  const adminNome = session.user.name || "Administrador";
  const painel = await obterPainelProctoringGlobal();

  return (
    <ProctoringGlobalClient
      initialData={painel as any}
      adminNome={adminNome}
    />
  );
}
