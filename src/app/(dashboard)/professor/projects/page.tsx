import { PaginaSecao } from "@/components/pagina-seccao";

export default function ProfessorProjectsPage() {
  return (
    <div className="space-y-8">
      <PaginaSecao
        papel="professor"
        titulo="Vitrine de projetos"
        descricao="Aprova??o, publica??o e destaque de projectos acad?micos com impacto p?blico."
        indicadores={[
          { titulo: "Projectos", valor: "18", observacao: "7 em revis?o" },
          { titulo: "Autorizados", valor: "11", observacao: "Publicados" },
          { titulo: "Autores", valor: "42", observacao: "Equipas multidisciplinares" },
          { titulo: "Gostos", valor: "312", observacao: "Intera??o comunit?ria" },
        ]}
        resumos={[
          { titulo: "Smart Campus App", descricao: "Projecto aprovado com demonstra??o online.", estado: "Aprovado" },
          { titulo: "Plataforma E-Learning", descricao: "Base para evolu??o do produto acad?mico.", estado: "Destaque" },
          { titulo: "App de Sa?de Mental", descricao: "Em revis?o t?cnica e pedag?gica.", estado: "Pendente" },
        ]}
      />
    </div>
  );
}
