import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const revalidate = 0;

export default async function RedirecionarParaPerfil() {
  const sessao = await auth();

  if (!sessao?.user?.id) redirect("/login");

  redirect(`/perfil/${sessao.user.id}`);
}