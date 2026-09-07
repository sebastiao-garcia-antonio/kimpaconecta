CREATE TABLE IF NOT EXISTS "diario_aula" (
    "id_diario" SERIAL NOT NULL,
    "id_docente" INTEGER NOT NULL,
    "id_disciplina" INTEGER NOT NULL,
    "id_turma" INTEGER NOT NULL,
    "data_aula" DATE NOT NULL,
    "tema_aula" TEXT NOT NULL,
    "observacao" TEXT,
    "data_registo" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "diario_aula_pkey" PRIMARY KEY ("id_diario")
);

CREATE UNIQUE INDEX IF NOT EXISTS "diario_aula_id_disciplina_id_turma_data_aula_key"
ON "diario_aula"("id_disciplina", "id_turma", "data_aula");

CREATE INDEX IF NOT EXISTS "diario_aula_id_docente_data_aula_idx"
ON "diario_aula"("id_docente", "data_aula");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'diario_aula_id_docente_fkey') THEN
        ALTER TABLE "diario_aula" ADD CONSTRAINT "diario_aula_id_docente_fkey" FOREIGN KEY ("id_docente") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'diario_aula_id_disciplina_fkey') THEN
        ALTER TABLE "diario_aula" ADD CONSTRAINT "diario_aula_id_disciplina_fkey" FOREIGN KEY ("id_disciplina") REFERENCES "disciplina"("id_disciplina") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'diario_aula_id_turma_fkey') THEN
        ALTER TABLE "diario_aula" ADD CONSTRAINT "diario_aula_id_turma_fkey" FOREIGN KEY ("id_turma") REFERENCES "turma"("id_turma") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;