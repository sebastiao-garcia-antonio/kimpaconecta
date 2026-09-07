import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { EstadoVazio } from "@/components/estado-vazio";
import { PaginaSecao } from "@/components/pagina-seccao";

export default async function PaginaProjetosCoordenador() {
  const sessao = await auth();

  if (!sessao?.user) {
    redirect("/login");
  }

  const papeis = (sessao.user as any).roles || [];
  if (!papeis.includes("coordenador") && !papeis.includes("admin")) {
    redirect("/login");
  }

  const idCoordenador = Number(sessao.user.id);
  const administrador = papeis.includes("admin");
  const projetos = await prisma.projetoVitrine.findMany({
    where: administrador ? {} : { disciplina: { curso: { idCoordenador } } },
    include: {
      disciplina: {
        include: {
          curso: {
            include: {
              unidade: true,
            },
          },
        },
      },
      autores: {
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      },
      professor: {
        select: {
          nome: true,
        },
      },
    },
    orderBy: { dataPublicacao: "desc" },
  });

  const autorizados = projetos.filter((projeto) => projeto.idProfessorAutorizador).length;
  const autores = new Set(projetos.flatMap((projeto) => projeto.autores.map((autor) => autor.idUsuario))).size;
  const comDemonstracao = projetos.filter((projeto) => projeto.urlDemonstracao || projeto.urlRepositorio).length;

  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="coordenador"
        titulo="Projetos"
        descricao="Acompanha a vitrine de projetos do curso, os autores envolvidos e as publicações autorizadas."
        indicadores={[
          { titulo: "Projetos", valor: String(projetos.length), observacao: "Na vitrine" },
          { titulo: "Autorizados", valor: String(autorizados), observacao: "Com validação" },
          { titulo: "Autores", valor: String(autores), observacao: "Estudantes envolvidos" },
          { titulo: "Com ligações", valor: String(comDemonstracao), observacao: "Repositório ou demonstração" },
        ]}
        resumos={projetos.slice(0, 3).map((projeto) => ({
          titulo: projeto.tituloProjeto,
          descricao: projeto.disciplina?.curso.nomeCurso || "Projeto interdisciplinar",
          estado: projeto.idProfessorAutorizador ? "Autorizado" : "Em análise",
        }))}
      />

      <div className="px-6 pb-8 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h3 className="text-lg font-bold text-slate-800">Projetos publicados</h3>
            <p className="text-sm text-slate-500">Vitrine actualizada com os projetos associados aos cursos sob a tua coordenação.</p>
          </div>

          {projetos.length === 0 ? (
            <EstadoVazio
              titulo="Sem projetos na vitrine"
              descricao="Os projetos submetidos e associados aos teus cursos aparecerão aqui quando estiverem disponíveis."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {projetos.map((projeto) => {
                const estado = projeto.idProfessorAutorizador ? "Autorizado" : "Em análise";
                const nomesAutores = projeto.autores.map((autor) => autor.usuario.nome).join(", ") || "Autor não identificado";

                return (
                  <article key={projeto.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:bg-white hover:shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-slate-800">{projeto.tituloProjeto}</h4>
                        <p className="mt-1 text-sm text-slate-500">{projeto.disciplina?.nomeDisciplina || "Projeto interdisciplinar"}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estado === "Autorizado" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {estado}
                      </span>
                    </div>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{projeto.descricao}</p>
                    <div className="mt-4 space-y-1 text-xs text-slate-500">
                      <p>Autores: {nomesAutores}</p>
                      {projeto.disciplina?.curso && <p>Curso: {projeto.disciplina.curso.nomeCurso}</p>}
                      {projeto.professor?.nome && <p>Autorizado por: {projeto.professor.nome}</p>}
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
