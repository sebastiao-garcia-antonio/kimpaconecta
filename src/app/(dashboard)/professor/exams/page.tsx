import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AcademicRepository } from "@/features/academic/repositories/academic.repository";
import { PaginaSecao } from "@/components/pagina-seccao";
import { FormularioAvaliacaoDocenteClient } from "@/features/academic/components/formulario-avaliacao-docente-client";
import { EstadoVazio } from "@/components/estado-vazio";

export default async function PaginaAvaliacoesDocente() {
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
  const avaliacoes = await AcademicRepository.obterAvaliacoesDoDocente(idDocente);

  const cursos = Array.isArray(vinculos)
    ? vinculos.map((vinculo: any) => vinculo.curso).filter(Boolean)
    : [];

  const totalAvaliacoes = avaliacoes.length;
  const tentativas = avaliacoes.reduce((total: number, avaliacao: any) => total + (avaliacao.tentativas?.length || 0), 0);
  const questoes = avaliacoes.reduce((total: number, avaliacao: any) => total + (avaliacao.questoes?.length || 0), 0);
  const mediaTentativas = avaliacoes.length
    ? Math.round(
        avaliacoes.reduce((total: number, avaliacao: any) => total + (avaliacao.tentativas?.length || 0), 0) / avaliacoes.length
      )
    : 0;

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="professor"
        titulo="Avaliações e análise"
        descricao="Criação de avaliações e acompanhamento de submissões, questões e tentativas."
        indicadores={[
          { titulo: "Avaliações", valor: String(totalAvaliacoes), observacao: "Registadas" },
          { titulo: "Questões", valor: String(questoes), observacao: "Estruturadas" },
          { titulo: "Tentativas", valor: String(tentativas), observacao: "Total de acessos" },
          { titulo: "Média", valor: String(mediaTentativas), observacao: "Tentativas por avaliação" },
        ]}
        resumos={avaliacoes.slice(0, 3).map((avaliacao: any) => ({
          titulo: avaliacao.titulo,
          descricao: `${avaliacao.disciplina?.nomeDisciplina || "Disciplina"} · ${avaliacao.duracaoMinutos} min · nota máxima ${avaliacao.notaMaxima}`,
          estado: avaliacao.tentativas?.length ? `${avaliacao.tentativas.length} tentativas` : "Sem tentativas",
        }))}
      />

      <div className="px-6 lg:px-8 space-y-6 pb-8">
        <FormularioAvaliacaoDocenteClient docenteId={idDocente} disciplinas={disciplinas as any} />

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h3 className="font-bold text-lg text-slate-800">Avaliações criadas</h3>
              <p className="text-sm text-slate-500">Lista das avaliações já publicadas para os cursos associados.</p>
            </div>
            <span className="text-xs font-semibold text-slate-400">{cursos.length} curso(s) associado(s)</span>
          </div>

          <div className="space-y-3">
            {avaliacoes.map((avaliacao: any) => (
              <div key={avaliacao.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-slate-200 p-4">
                <div>
                  <h4 className="font-semibold text-slate-800">{avaliacao.titulo}</h4>
                  <p className="text-sm text-slate-500">
                    {avaliacao.disciplina?.nomeDisciplina || "Disciplina"} · {avaliacao.duracaoMinutos} minutos · nota máxima {avaliacao.notaMaxima}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1">{avaliacao.tentativas?.length || 0} tentativas</span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">
                    {avaliacao.questoes?.length || 0} questões
                  </span>
                </div>
              </div>
            ))}
            {avaliacoes.length === 0 && (
              <EstadoVazio
                titulo="Sem avaliações criadas"
                descricao="Usa o formulário acima para criar a primeira avaliação desta área docente."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
