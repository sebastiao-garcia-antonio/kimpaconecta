import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PaginaSecao } from "@/components/pagina-seccao";
import { obterEstruturaAcademica, obterCoordenadoresDisponiveis } from "@/features/admin/admin.actions";
import { FormularioCursoClient } from "@/features/academic-management/components/formulario-curso-client";

export default async function AcademicoAdminPage() {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");

  const papeis = (sessao.user as any).roles || [];
  if (!papeis.includes("admin")) redirect("/login");

  const estrutura = await obterEstruturaAcademica();
  const coordenadores = await obterCoordenadoresDisponiveis();

  const totalCursos = estrutura.reduce((total, unidade) => total + unidade.cursos.length, 0);
  const totalDisciplinas = estrutura.reduce((total, unidade) => total + unidade.cursos.reduce((subtotal: number, curso: any) => subtotal + curso.disciplinas.length, 0), 0);
  const totalTurmas = estrutura.reduce((total, unidade) => total + unidade.cursos.reduce((subtotal: number, curso: any) => subtotal + curso.turmas.length, 0), 0);

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="admin"
        titulo="Estrutura académica"
        descricao="Visão geral da organização por unidade orgânica, curso, disciplina e turma."
        indicadores={[
          { titulo: "Unidades", valor: String(estrutura.length), observacao: "Faculdades / institutos" },
          { titulo: "Cursos", valor: String(totalCursos), observacao: "Distribuídos" },
          { titulo: "Disciplinas", valor: String(totalDisciplinas), observacao: "Currículo" },
          { titulo: "Turmas", valor: String(totalTurmas), observacao: "Em funcionamento" },
        ]}
        resumos={estrutura.slice(0, 4).flatMap((unidade: any) => unidade.cursos.slice(0, 1).map((curso: any) => ({
          titulo: `${curso.nomeCurso} · ${unidade.nomeUo}`,
          descricao: `${curso.disciplinas.length} disciplina(s) · ${curso.turmas.length} turma(s)`,
          estado: curso.coordenador?.nome || "Sem coordenador",
        })))}
      />

      <div className="px-6 lg:px-8 space-y-6">
        <FormularioCursoClient unidades={estrutura.map((unidade: any) => ({ id: unidade.id, nomeUo: unidade.nomeUo, sigla: unidade.sigla }))} coordenadores={coordenadores.map((coordenador: any) => ({ id: coordenador.id, nome: coordenador.nome }))} cursos={estrutura.flatMap((unidade: any) => unidade.cursos.map((curso: any) => ({ id: curso.id, idUo: unidade.id, nomeCurso: curso.nomeCurso, idCoordenador: curso.idCoordenador })))} />
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-900">Organização por unidade</h3>
              <p className="mt-1 text-sm text-slate-500">Blocos académicos com cursos, turmas e coordenadores associados.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{coordenadores.length} coordenador(es)</span>
          </div>

          <div className="mt-5 space-y-4">
            {estrutura.map((unidade: any) => (
              <div key={unidade.id} className="rounded-2xl border border-slate-200 p-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h4 className="text-base font-bold text-slate-800">{unidade.nomeUo}</h4>
                    <p className="text-sm text-slate-500">{unidade.sigla} · {unidade.cursos.length} curso(s)</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {unidade.cursos.map((curso: any) => (
                    <div key={curso.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <h5 className="font-bold text-slate-800">{curso.nomeCurso}</h5>
                      <p className="mt-1 text-xs text-slate-500">{curso.disciplinas.length} disciplina(s) · {curso.turmas.length} turma(s)</p>
                      <p className="mt-2 text-xs text-slate-600">Coordenador: {curso.coordenador?.nome || "Não atribuído"}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

