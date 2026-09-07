CREATE TABLE IF NOT EXISTS "publicacao" (
    "id_publicacao" SERIAL NOT NULL,
    "id_autor" INTEGER NOT NULL,
    "conteudo" TEXT NOT NULL,
    "url_imagem" VARCHAR(255),
    "estado" VARCHAR(20) NOT NULL DEFAULT 'publicado',
    "data_publicacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "publicacao_pkey" PRIMARY KEY ("id_publicacao")
);

CREATE TABLE IF NOT EXISTS "comentario_publicacao" (
    "id_comentario" SERIAL NOT NULL,
    "id_publicacao" INTEGER NOT NULL,
    "id_autor" INTEGER NOT NULL,
    "conteudo" TEXT NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'publicado',
    "data_publicacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comentario_publicacao_pkey" PRIMARY KEY ("id_comentario")
);

CREATE TABLE IF NOT EXISTS "gosto_publicacao" (
    "id_publicacao" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "data_gosto" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gosto_publicacao_pkey" PRIMARY KEY ("id_publicacao", "id_usuario")
);

CREATE INDEX IF NOT EXISTS "publicacao_estado_data_publicacao_idx"
ON "publicacao"("estado", "data_publicacao");

CREATE INDEX IF NOT EXISTS "comentario_publicacao_id_publicacao_estado_data_publicacao_idx"
ON "comentario_publicacao"("id_publicacao", "estado", "data_publicacao");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'publicacao_id_autor_fkey') THEN
        ALTER TABLE "publicacao"
        ADD CONSTRAINT "publicacao_id_autor_fkey"
        FOREIGN KEY ("id_autor") REFERENCES "usuario"("id_usuario")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'comentario_publicacao_id_publicacao_fkey') THEN
        ALTER TABLE "comentario_publicacao"
        ADD CONSTRAINT "comentario_publicacao_id_publicacao_fkey"
        FOREIGN KEY ("id_publicacao") REFERENCES "publicacao"("id_publicacao")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'comentario_publicacao_id_autor_fkey') THEN
        ALTER TABLE "comentario_publicacao"
        ADD CONSTRAINT "comentario_publicacao_id_autor_fkey"
        FOREIGN KEY ("id_autor") REFERENCES "usuario"("id_usuario")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gosto_publicacao_id_publicacao_fkey') THEN
        ALTER TABLE "gosto_publicacao"
        ADD CONSTRAINT "gosto_publicacao_id_publicacao_fkey"
        FOREIGN KEY ("id_publicacao") REFERENCES "publicacao"("id_publicacao")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gosto_publicacao_id_usuario_fkey') THEN
        ALTER TABLE "gosto_publicacao"
        ADD CONSTRAINT "gosto_publicacao_id_usuario_fkey"
        FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;