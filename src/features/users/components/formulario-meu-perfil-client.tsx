"use client";

import { FormEvent, useState, useTransition, ChangeEvent } from "react";
import { Loader2, Save, UserRound, Upload, Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { atualizarMeuPerfilServer } from "@/features/users/actions";
import { formatarMascaraBIAngola } from "@/lib/validacao-texto";

type Perfil = {
  nome: string;
  email: string;
  telefone?: string | null;
  numBi?: string | null;
  fotoPerfil?: string | null;
  bio?: string | null;
};

interface FormularioMeuPerfilClientProps {
  perfil: Perfil;
}

export function FormularioMeuPerfilClient({ perfil }: FormularioMeuPerfilClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState(false);

  const [fotoUrl, setFotoUrl] = useState(perfil.fotoPerfil || "");
  const [numBi, setNumBi] = useState(perfil.numBi || "");

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMensagem(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErro(true);
        setMensagem(data.error || "Erro ao carregar a imagem.");
      } else {
        setFotoUrl(data.url);
        setErro(false);
        setMensagem("Foto carregada com sucesso! Clique em 'Guardar perfil' para confirmar.");
      }
    } catch {
      setErro(true);
      setMensagem("Falha na ligação ao carregar o ficheiro.");
    } finally {
      setUploading(false);
    }
  };

  const submeterPerfil = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const formData = new FormData(evento.currentTarget);

    startTransition(async () => {
      const resultado = await atualizarMeuPerfilServer({
        nome: String(formData.get("nome") || ""),
        bio: String(formData.get("bio") || ""),
        telefone: String(formData.get("telefone") || ""),
        numBi,
        fotoPerfil: fotoUrl,
      });

      setErro(!resultado.success);
      setMensagem(resultado.success ? "Perfil atualizado com sucesso." : resultado.error || "Não foi possível atualizar o perfil.");
      if (resultado.success) router.refresh();
    });
  };

  const inicialNome = perfil.nome ? perfil.nome.substring(0, 2).toUpperCase() : "UK";

  return (
    <form onSubmit={submeterPerfil} className="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 lg:p-8 shadow-sm">
      <div className="flex items-start gap-3 border-b border-slate-100 pb-5">
        <div className="rounded-2xl bg-brand-blue/10 p-3 text-brand-blue">
          <UserRound className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Dados pessoais</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            Mantenha os seus dados profissionais e de contacto atualizados.
          </p>
        </div>
      </div>

      {mensagem && (
        <p role="status" aria-live="polite" className={`rounded-2xl px-4 py-3.5 text-sm font-semibold border ${erro ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
          {mensagem}
        </p>
      )}

      {/* Secção de Carregamento de Foto de Perfil */}
      <div className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-5">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
          Foto de perfil
        </label>
        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Avatar Preview */}
          <div className="relative group">
            {fotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fotoUrl}
                alt="Foto de perfil"
                className="h-20 w-20 rounded-2xl object-cover border-2 border-brand-blue shadow-sm"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-brand-green text-xl font-black text-white shadow-sm">
                {inicialNome}
              </div>
            )}
            <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white pointer-events-none">
              <Camera className="h-6 w-6" />
            </div>
          </div>

          {/* Upload Action Buttons */}
          <div className="flex-1 space-y-2 text-center sm:text-left">
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-brand-blue-dark disabled:opacity-50">
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    A carregar foto...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Carregar nova foto do dispositivo
                  </>
                )}
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/jpg"
                  onChange={handleFileUpload}
                  disabled={uploading || isPending}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-[11px] text-slate-500">
              Formatos aceites: PNG, JPG, WEBP (Máx. 5MB).
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <label htmlFor="nome" className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
          <span>Nome completo</span>
          <input
            id="nome"
            name="nome"
            defaultValue={perfil.nome}
            autoComplete="name"
            maxLength={120}
            required
            placeholder="Ex: Administrador Geral"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
          />
        </label>

        <label htmlFor="numBi" className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
          <span>Número de BI (14 caracteres)</span>
          <input
            id="numBi"
            name="numBi"
            value={numBi}
            maxLength={14}
            placeholder="000000000UE000"
            pattern="\d{9}[a-zA-Z]{2}\d{3}"
            title="Formato de BI de Angola: 9 números + 2 letras + 3 números (Ex: 000000000UE000)"
            onChange={(e) => setNumBi(formatarMascaraBIAngola(e.target.value))}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-mono tracking-wider text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
          />
        </label>

        <label htmlFor="telefone" className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
          <span>Telefone</span>
          <input
            id="telefone"
            name="telefone"
            type="tel"
            defaultValue={perfil.telefone || ""}
            autoComplete="tel"
            maxLength={40}
            placeholder="+244 9XX XXX XXX"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
          />
        </label>

        <label htmlFor="email" className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
          <span>E-mail institucional</span>
          <input
            id="email"
            type="email"
            value={perfil.email}
            readOnly
            aria-readonly="true"
            className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100/80 px-4 py-3 text-sm font-semibold text-slate-600 outline-none"
          />
        </label>
      </div>

      <label htmlFor="bio" className="block space-y-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
        <span>Biografia</span>
        <textarea
          id="bio"
          name="bio"
          defaultValue={perfil.bio || ""}
          rows={4}
          maxLength={500}
          placeholder="Apresente o seu percurso, interesses e objetivos."
          className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
        />
      </label>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending || uploading}
          className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-6 py-3 text-sm font-extrabold text-white shadow-md shadow-brand-blue/20 transition hover:bg-brand-blue-dark disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isPending ? "A guardar..." : "Guardar perfil"}
        </button>
      </div>
    </form>
  );
}