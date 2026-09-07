ALTER TABLE "grupo"
ADD COLUMN IF NOT EXISTS "chave_conversa" VARCHAR(80);

CREATE UNIQUE INDEX IF NOT EXISTS "grupo_chave_conversa_key"
ON "grupo"("chave_conversa");