-- CreateTable
CREATE TABLE "gosto_comentario_publicacao" (
    "id_comentario" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "data_gosto" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gosto_comentario_publicacao_pkey" PRIMARY KEY ("id_comentario","id_usuario")
);

-- AddForeignKey
ALTER TABLE "gosto_comentario_publicacao" ADD CONSTRAINT "gosto_comentario_publicacao_id_comentario_fkey" FOREIGN KEY ("id_comentario") REFERENCES "comentario_publicacao"("id_comentario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gosto_comentario_publicacao" ADD CONSTRAINT "gosto_comentario_publicacao_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
