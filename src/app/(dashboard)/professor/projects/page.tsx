import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { EstadoVazio } from "@/components/estado-vazio";
import { PaginaSecao } from "@/components/pagina-seccao";

export default async function ProfessorProjectsPage() {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");

  const papeis = (sessao.user as any).roles || [];
  if (!papeis.includes("professor")) redirect("/login");

  const idProfessor = Number(sessao.user.id);

  const vinculos = await prisma.usuarioCurso.findMany({
    where: { idUsuario: idProfessor },
    include: { curso: { select: { id: true } } },
  });
  const idsCursos = vinculos.map((vinculo) => vinculo.idCurso);

  const idsDisciplinas = idsCursos.length
    ? (await prisma.disciplina.findMany({ where: { idCurso: { in: idsCursos } }, select: { id: true } })).map((d) => d.id)
    : [];

  const projetos = await prisma.projetoVitrine.findMany({
    where: {
      OR: [
        { idProfessorAutorizador: idProfessor },
        ...(idsDisciplinas.length > 0 ? [{ idDisciplina: { in: idsDisciplinas } }] : []),
      ],
    },
    include: {
      disciplina: { select: { nomeDisciplina: true, idCurso: true } },
      professor: { select: { nome: true } },
      autores: { include: { usuario: { select: { nome: true } } } },
      _count: { select: { curtidores: true } },
    },
    orderBy: { dataPublicacao: "desc" },
  });

  const autorizados = projetos.filter((projeto) => Boolean(projeto.idProfessorAutorizador)).length;
  const pendentes = projetos.length - autorizados;
  const todosAutores = new Set(projetos.flatMap((projeto) => projeto.autores.map((a) => a.idUsuario))).size;
  const totalGostos = projetos.reduce((total, projeto) => total + projeto._count.curtidores, 0);

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="professor"
        titulo="Vitrine de projetos"
        descricao="Revisão, aprovação e publicação de projetos académicos associados às tuas disciplinas."
        indicadores={[
          { titulo: "Projetos", valor: String(projetos.length), observacao: pendentes > 0 ? `${pendentes} em análise` : "Todos revistos" },
          { titulo: "Autorizados", valor: String(autorizados), observacao: "Publicados" },
          { titulo: "Autores", valor: String(todosAutores), observacao: "Estudantes envolvidos" },
          { titulo: "Gostos", valor: String(totalGostos), observacao: "Interação comunitária" },
        ]}
        resumos={projetos.slice(0, 3).map((projeto) => ({
          titulo: projeto.tituloProjeto,
          descricao: projeto.disciplina?.nomeDisciplina || "Projeto interdisciplinar",
          estado: projeto.idProfessorAutorizador ? "Aprovado" : "Pendente",
        }))}
      />

      <div className="px-6 pb-8 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h3 className="text-lg font-bold text-slate-800">Projetos publicados</h3>
            <p className="text-sm text-slate-500">Vitrine actualizada com os projetos das tuas disciplinas.</p>
          </div>

          {projetos.length === 0 ? (
            <EstadoVazio
              titulo="Sem projetos na vitrine"
              descricao="Os projetos submetidos e associados às tuas disciplinas aparecerão aqui quando estiverem disponíveis."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {projetos.map((projeto) => {
                const estado = Boolean(projeto.idProfessorAutorizador);
                const nomesAutores = projeto.autores.map((autor) => autor.usuario.nome).join(", ") || "Autor não identificado";

                return (
                  <article key={projeto.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:bg-white hover:shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-slate-800">{projeto.tituloProjeto}</h4>
                        <p className="mt-1 text-sm text-slate-500">{projeto.disciplina?.nomeDisciplina || "Projeto interdisciplinar"}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estado ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {estado ? "Aprovado" : "Pendente"}
                      </span>
                    </div>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{projeto.descricao}</p>
                    <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                      <div className="space-y-1">
                        <p>Autores: {nomesAutores}</p>
                        {projeto.professor?.nome && <p>Autorizado por: {projeto.professor.nome}</p>}
                      </div>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {projeto._count.curtidores} gostos
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}