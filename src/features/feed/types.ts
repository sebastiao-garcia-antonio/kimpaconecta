export type AutorFeed = {
  id: number;
  nome: string;
  fotoPerfil: string | null;
  estaAAcompanhar?: boolean;
};

export type GostoFeed = {
  idUsuario: number;
  usuario: {
    id: number;
    nome: string;
    fotoPerfil: string | null;
  };
};

export type ComentarioFeed = {
  id: number;
  conteudo: string;
  dataPublicacao: string;
  autor: AutorFeed;
  estado?: string;
  gostou?: boolean;
  _count?: {
    gostos: number;
  };
  respostas?: ComentarioFeed[];
};

export type PublicacaoFeed = {
  id: number;
  conteudo: string;
  urlImagem: string | null;
  dataPublicacao: string;
  estado: string;
  autor: AutorFeed;
  comentarios: ComentarioFeed[];
  gostou?: boolean;
  _count: {
    gostos: number;
    comentarios: number;
  };
};

export type UsuarioAtualFeed = {
  id: number;
  nome: string;
  fotoPerfil: string | null;
  papeis: string[];
};

export type PaginaFeed = {
  publicacoes: PublicacaoFeed[];
  proximoCursor: number | null;
};
