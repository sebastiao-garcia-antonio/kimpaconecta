import { prisma } from "@/lib/prisma";
import { FormularioRegistroSolicitacaoClient } from "@/features/auth/components/formulario-registro-solicitacao-client";

export const dynamic = "force-dynamic";

export default async function RegistroPage() {
  const unidades = await prisma.unidadeOrganica.findMany({
    include: {
      cursos: {
        include: {
          turmas: {
            orderBy: [
              { anoCurricular: "asc" },
              { nomeTurma: "asc" }
            ]
          }
        },
        orderBy: { nomeCurso: "asc" }
      }
    },
    orderBy: { nomeUo: "asc" }
  });

  return <FormularioRegistroSolicitacaoClient unidades={unidades as any} />;
}
