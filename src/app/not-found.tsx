import Link from "next/link";
import { Home, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,143,217,0.12),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(58,138,80,0.10),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef6ff_100%)] px-4 py-10 text-slate-900">
      <div className="mx-auto flex min-h-[80vh] max-w-3xl items-center">
        <div className="w-full rounded-[2rem] border border-white/60 bg-white p-8 text-center shadow-2xl shadow-slate-200/60">
          <div className="mx-auto inline-flex rounded-2xl bg-brand-blue/10 p-3 text-brand-blue">
            <SearchX className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950">Página não encontrada</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            O endereço solicitado não existe ou foi movido. Usa a navegação para continuar.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
              <Home className="h-4 w-4" />
              Voltar ao início
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
