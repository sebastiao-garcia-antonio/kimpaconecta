-- Adicionar suporte a respostas (thread) nos comentários do feed
ALTER TABLE "comentario_publicacao" ADD COLUMN IF NOT EXISTS "id_comentario_pai" INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'comentario_publicacao_id_comentario_pai_fkey') THEN
        ALTER TABLE "comentario_publicacao"
        ADD CONSTRAINT "comentario_publicacao_id_comentario_pai_fkey"
        FOREIGN KEY ("id_comentario_pai") REFERENCES "comentario_publicacao"("id_comentario")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "comentario_publicacao_id_comentario_pai_idx"
ON "comentario_publicacao"("id_comentario_pai");