-- Adicionar imagem de capa e anexo (PDF/doc) aos projetos da vitrine
ALTER TABLE "projeto_vitrine"
  ADD COLUMN "url_imagem" VARCHAR(255),
  ADD COLUMN "url_anexo" VARCHAR(255);