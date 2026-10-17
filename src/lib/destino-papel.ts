export function obterDestinoPorPapel(roles: string[] | undefined | null): string {
  const papeis = roles || [];
  if (papeis.includes("admin")) return "/admin";
  if (papeis.includes("coordenador")) return "/coordenador";
  if (papeis.includes("professor")) return "/professor";
  return "/estudante";
}
