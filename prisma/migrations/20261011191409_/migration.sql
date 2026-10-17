-- CreateTable
CREATE TABLE "usuario" (
    "id_usuario" SERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "num_estudante_login" VARCHAR(50),
    "num_bi" VARCHAR(50),
    "senha" VARCHAR(255) NOT NULL,
    "telefone" VARCHAR(20),
    "foto_perfil" VARCHAR(255),
    "bio" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ativo',
    "data_criacao" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "perfil" (
    "id_perfil" SERIAL NOT NULL,
    "nome_perfil" VARCHAR(50) NOT NULL,

    CONSTRAINT "perfil_pkey" PRIMARY KEY ("id_perfil")
);

-- CreateTable
CREATE TABLE "usuarioperfil" (
    "id_usuario" INTEGER NOT NULL,
    "id_perfil" INTEGER NOT NULL,

    CONSTRAINT "usuarioperfil_pkey" PRIMARY KEY ("id_usuario","id_perfil")
);

-- CreateTable
CREATE TABLE "unidadeorganica" (
    "id_uo" SERIAL NOT NULL,
    "nome_uo" VARCHAR(150) NOT NULL,
    "sigla" VARCHAR(20) NOT NULL,
    "localizacao" VARCHAR(100),

    CONSTRAINT "unidadeorganica_pkey" PRIMARY KEY ("id_uo")
);

-- CreateTable
CREATE TABLE "ccurso" (
    "id_curso" SERIAL NOT NULL,
    "id_uo" INTEGER NOT NULL,
    "nome_curso" VARCHAR(150) NOT NULL,
    "id_coordenador" INTEGER,

    CONSTRAINT "ccurso_pkey" PRIMARY KEY ("id_curso")
);

-- CreateTable
CREATE TABLE "usuarioCurso" (
    "id_usuario" INTEGER NOT NULL,
    "id_curso" INTEGER NOT NULL,
    "data_vinculo" DATE NOT NULL,

    CONSTRAINT "usuarioCurso_pkey" PRIMARY KEY ("id_usuario","id_curso")
);

-- CreateTable
CREATE TABLE "disciplina" (
    "id_disciplina" SERIAL NOT NULL,
    "id_curso" INTEGER NOT NULL,
    "nome_disciplina" VARCHAR(150) NOT NULL,
    "semestre" INTEGER NOT NULL,

    CONSTRAINT "disciplina_pkey" PRIMARY KEY ("id_disciplina")
);

-- CreateTable
CREATE TABLE "turma" (
    "id_turma" SERIAL NOT NULL,
    "id_curso" INTEGER NOT NULL,
    "nome_turma" VARCHAR(50) NOT NULL,
    "ano_curricular" INTEGER NOT NULL,
    "periodo" VARCHAR(20) NOT NULL,

    CONSTRAINT "turma_pkey" PRIMARY KEY ("id_turma")
);

-- CreateTable
CREATE TABLE "matriccula" (
    "id_matricula" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_turma" INTEGER NOT NULL,
    "num_processo" VARCHAR(50) NOT NULL,
    "ano_lectivo" INTEGER NOT NULL,
    "is_mentor" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "matriccula_pkey" PRIMARY KEY ("id_matricula")
);

-- CreateTable
CREATE TABLE "solicitacao_acesso" (
    "id_solicitacao" SERIAL NOT NULL,
    "nome_completo" VARCHAR(150) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "num_estudante" VARCHAR(50) NOT NULL,
    "num_bi" VARCHAR(50),
    "telefone" VARCHAR(20),
    "senha_provisoria" VARCHAR(255) NOT NULL,
    "id_turma" INTEGER,
    "id_curso" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pendente',
    "id_coordenador_validador" INTEGER,
    "data_solicitacao" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solicitacao_acesso_pkey" PRIMARY KEY ("id_solicitacao")
);

-- CreateTable
CREATE TABLE "competencia" (
    "id_competencia" SERIAL NOT NULL,
    "nome_competencia" VARCHAR(100) NOT NULL,

    CONSTRAINT "competencia_pkey" PRIMARY KEY ("id_competencia")
);

-- CreateTable
CREATE TABLE "habilidade" (
    "id_habilidade" SERIAL NOT NULL,
    "id_competencia" INTEGER NOT NULL,
    "nome_habilidade" VARCHAR(100) NOT NULL,

    CONSTRAINT "habilidade_pkey" PRIMARY KEY ("id_habilidade")
);

-- CreateTable
CREATE TABLE "estudante_habilidade" (
    "id_usuario" INTEGER NOT NULL,
    "id_habilidade" INTEGER NOT NULL,
    "nivel_proficiencia" INTEGER NOT NULL,

    CONSTRAINT "estudante_habilidade_pkey" PRIMARY KEY ("id_usuario","id_habilidade")
);

-- CreateTable
CREATE TABLE "grupo" (
    "id_grupo" SERIAL NOT NULL,
    "nome_grupo" VARCHAR(100) NOT NULL,
    "tipo_grupo" VARCHAR(20) NOT NULL,
    "id_turma" INTEGER,
    "id_disciplina" INTEGER,
    "id_criador" INTEGER,
    "chave_conversa" VARCHAR(80),

    CONSTRAINT "grupo_pkey" PRIMARY KEY ("id_grupo")
);

-- CreateTable
CREATE TABLE "grupo_membro" (
    "id_grupo" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "funcao_no_grupo" VARCHAR(20) DEFAULT 'membro',
    "data_entrada" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grupo_membro_pkey" PRIMARY KEY ("id_grupo","id_usuario")
);

-- CreateTable
CREATE TABLE "mensagem" (
    "id_mensagem" SERIAL NOT NULL,
    "id_grupo" INTEGER NOT NULL,
    "id_emissor" INTEGER,
    "conteudo" TEXT,
    "tipo_conteudo" VARCHAR(20) NOT NULL DEFAULT 'texto',
    "url_ficheiro" VARCHAR(255),
    "duracao_audio" INTEGER,
    "is_fixada" BOOLEAN NOT NULL DEFAULT false,
    "data_envio" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensagem_pkey" PRIMARY KEY ("id_mensagem")
);

-- CreateTable
CREATE TABLE "mensagem_fixada_log" (
    "id_fixacao" SERIAL NOT NULL,
    "id_mensagem" INTEGER NOT NULL,
    "id_usuario_quem_fixou" INTEGER,
    "data_fixacao" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensagem_fixada_log_pkey" PRIMARY KEY ("id_fixacao")
);

-- CreateTable
CREATE TABLE "sessao_mentoria" (
    "id_sessao" SERIAL NOT NULL,
    "id_grupo_mentoria" INTEGER,
    "id_mentor" INTEGER NOT NULL,
    "id_estudante_ajudado" INTEGER NOT NULL,
    "inicio_em" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fim_em" TIMESTAMP,
    "duracao_segundos" INTEGER,

    CONSTRAINT "sessao_mentoria_pkey" PRIMARY KEY ("id_sessao")
);

-- CreateTable
CREATE TABLE "feedback_mentoria" (
    "id_sessao" INTEGER NOT NULL,
    "classificacao" INTEGER NOT NULL,
    "comentario" TEXT,
    "data_text" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_mentoria_pkey" PRIMARY KEY ("id_sessao")
);

-- CreateTable
CREATE TABLE "avaliacao" (
    "id_avaliacao" SERIAL NOT NULL,
    "id_disciplina" INTEGER NOT NULL,
    "id_professor" INTEGER NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "data_inicio" TIMESTAMP NOT NULL,
    "data_fim" TIMESTAMP NOT NULL,
    "duracao_minutos" INTEGER NOT NULL,
    "nota_maxima" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "avaliacao_pkey" PRIMARY KEY ("id_avaliacao")
);

-- CreateTable
CREATE TABLE "questao" (
    "id_questao" SERIAL NOT NULL,
    "id_avaliacao" INTEGER NOT NULL,
    "enunciado" TEXT NOT NULL,
    "tipo_questao" VARCHAR(30) NOT NULL,

    CONSTRAINT "questao_pkey" PRIMARY KEY ("id_questao")
);

-- CreateTable
CREATE TABLE "alternativa" (
    "id_alternativa" SERIAL NOT NULL,
    "id_questao" INTEGER NOT NULL,
    "texto_alternativa" TEXT NOT NULL,
    "is_correta" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "alternativa_pkey" PRIMARY KEY ("id_alternativa")
);

-- CreateTable
CREATE TABLE "tentativa_avaliacao" (
    "id_tentativa" SERIAL NOT NULL,
    "id_avaliacao" INTEGER NOT NULL,
    "id_estudante" INTEGER NOT NULL,
    "inicio_em" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submetido_em" TIMESTAMP,
    "nota_obtida" DECIMAL(5,2),
    "status_tentativa" VARCHAR(20) NOT NULL DEFAULT 'em_curso',

    CONSTRAINT "tentativa_avaliacao_pkey" PRIMARY KEY ("id_tentativa")
);

-- CreateTable
CREATE TABLE "resposta_estudante" (
    "id_tentativa" INTEGER NOT NULL,
    "id_questao" INTEGER NOT NULL,
    "id_alternativa_escolhida" INTEGER,
    "texto_resposta" TEXT,

    CONSTRAINT "resposta_estudante_pkey" PRIMARY KEY ("id_tentativa","id_questao")
);

-- CreateTable
CREATE TABLE "logs_seguranca" (
    "id_log" BIGSERIAL NOT NULL,
    "id_tentativa" INTEGER NOT NULL,
    "tipo_evento" VARCHAR(50) NOT NULL,
    "descricao" VARCHAR(255) NOT NULL,
    "data_registo" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_seguranca_pkey" PRIMARY KEY ("id_log")
);

-- CreateTable
CREATE TABLE "projeto_vitrine" (
    "id_projeto" SERIAL NOT NULL,
    "id_disciplina" INTEGER,
    "id_professor_autorizador" INTEGER,
    "titulo_projeto" VARCHAR(150) NOT NULL,
    "descricao" TEXT NOT NULL,
    "url_repositorio" VARCHAR(255),
    "url_demonstracao" VARCHAR(255),
    "url_imagem" VARCHAR(255),
    "url_anexo" VARCHAR(255),
    "data_publicacao" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projeto_vitrine_pkey" PRIMARY KEY ("id_projeto")
);

-- CreateTable
CREATE TABLE "projeto_autor" (
    "id_projeto" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,

    CONSTRAINT "projeto_autor_pkey" PRIMARY KEY ("id_projeto","id_usuario")
);

-- CreateTable
CREATE TABLE "projeto_curtidor" (
    "id_projeto" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "data_interacao" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projeto_curtidor_pkey" PRIMARY KEY ("id_projeto","id_usuario")
);

-- CreateTable
CREATE TABLE "publicacao" (
    "id_publicacao" SERIAL NOT NULL,
    "id_autor" INTEGER NOT NULL,
    "conteudo" TEXT NOT NULL,
    "url_imagem" VARCHAR(255),
    "estado" VARCHAR(20) NOT NULL DEFAULT 'publicado',
    "data_publicacao" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "publicacao_pkey" PRIMARY KEY ("id_publicacao")
);

-- CreateTable
CREATE TABLE "comentario_publicacao" (
    "id_comentario" SERIAL NOT NULL,
    "id_publicacao" INTEGER NOT NULL,
    "id_autor" INTEGER NOT NULL,
    "id_comentario_pai" INTEGER,
    "conteudo" TEXT NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'publicado',
    "data_publicacao" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comentario_publicacao_pkey" PRIMARY KEY ("id_comentario")
);

-- CreateTable
CREATE TABLE "gosto_publicacao" (
    "id_publicacao" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "data_gosto" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gosto_publicacao_pkey" PRIMARY KEY ("id_publicacao","id_usuario")
);

-- CreateTable
CREATE TABLE "notificacao" (
    "id_notificacao" BIGSERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "mensagem" TEXT NOT NULL,
    "tipo" VARCHAR(30) NOT NULL DEFAULT 'informacao',
    "prioridade" VARCHAR(20) NOT NULL DEFAULT 'normal',
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "data_envio" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacao_pkey" PRIMARY KEY ("id_notificacao")
);

-- CreateTable
CREATE TABLE "login_sessao" (
    "id_sessao" BIGSERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "ip" VARCHAR(100) NOT NULL,
    "dispositivo" VARCHAR(255),
    "navegador" VARCHAR(150),
    "sistema_operativo" VARCHAR(150),
    "ultimo_acesso" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expira_em" TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "login_sessao_pkey" PRIMARY KEY ("id_sessao")
);

-- CreateTable
CREATE TABLE "auditoria_sistema" (
    "id_auditoria" BIGSERIAL NOT NULL,
    "id_usuario" INTEGER,
    "acao" VARCHAR(100) NOT NULL,
    "tabela_afetada" VARCHAR(100) NOT NULL,
    "id_registro_afetado" BIGINT,
    "descricao" TEXT,
    "ip" VARCHAR(100),
    "data_registo" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_sistema_pkey" PRIMARY KEY ("id_auditoria")
);

-- CreateTable
CREATE TABLE "historico_academico" (
    "id_historico" BIGSERIAL NOT NULL,
    "id_estudante" INTEGER NOT NULL,
    "id_disciplina" INTEGER NOT NULL,
    "ano_lectivo" INTEGER NOT NULL,
    "nota_final" DECIMAL(5,2) NOT NULL,
    "resultado" VARCHAR(20) NOT NULL,
    "observacao" TEXT,
    "data_registo" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_academico_pkey" PRIMARY KEY ("id_historico")
);

-- CreateTable
CREATE TABLE "material_didatico" (
    "id_material" BIGSERIAL NOT NULL,
    "id_disciplina" INTEGER NOT NULL,
    "id_professor" INTEGER NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "descricao" TEXT,
    "tipo_material" VARCHAR(30) NOT NULL,
    "url_arquivo" VARCHAR(255) NOT NULL,
    "tamanho_arquivo" VARCHAR(50),
    "data_publicacao" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_didatico_pkey" PRIMARY KEY ("id_material")
);

-- CreateTable
CREATE TABLE "calendario_academico" (
    "id_evento" BIGSERIAL NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "descricao" TEXT,
    "tipo_evento" VARCHAR(50) NOT NULL,
    "data_inicio" TIMESTAMP NOT NULL,
    "data_fim" TIMESTAMP,
    "id_curso" INTEGER,
    "id_turma" INTEGER,
    "criado_por" INTEGER,

    CONSTRAINT "calendario_academico_pkey" PRIMARY KEY ("id_evento")
);

-- CreateTable
CREATE TABLE "reuniao_virtual" (
    "id_reuniao" BIGSERIAL NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "descricao" TEXT,
    "id_criador" INTEGER NOT NULL,
    "id_grupo" INTEGER,
    "link_reuniao" VARCHAR(255),
    "plataforma" VARCHAR(50),
    "data_inicio" TIMESTAMP NOT NULL,
    "data_fim" TIMESTAMP,
    "status" VARCHAR(20) NOT NULL DEFAULT 'agendada',

    CONSTRAINT "reuniao_virtual_pkey" PRIMARY KEY ("id_reuniao")
);

-- CreateTable
CREATE TABLE "reuniao_participante" (
    "id_reuniao" BIGINT NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "entrou_em" TIMESTAMP,
    "saiu_em" TIMESTAMP,

    CONSTRAINT "reuniao_participante_pkey" PRIMARY KEY ("id_reuniao","id_usuario")
);

-- CreateTable
CREATE TABLE "monitoramento_prova" (
    "id_monitoramento" BIGSERIAL NOT NULL,
    "id_tentativa" INTEGER NOT NULL,
    "perda_foco" INTEGER NOT NULL DEFAULT 0,
    "tentativas_copia" INTEGER NOT NULL DEFAULT 0,
    "mudancas_ip" INTEGER NOT NULL DEFAULT 0,
    "tempo_inatividade" INTEGER NOT NULL DEFAULT 0,
    "webcam_ativa" BOOLEAN NOT NULL DEFAULT false,
    "deteccao_multiplos_rostos" BOOLEAN NOT NULL DEFAULT false,
    "nivel_suspeita" VARCHAR(20) NOT NULL DEFAULT 'baixo',
    "bloqueado" BOOLEAN NOT NULL DEFAULT false,
    "observacao" TEXT,

    CONSTRAINT "monitoramento_prova_pkey" PRIMARY KEY ("id_monitoramento")
);

-- CreateTable
CREATE TABLE "recuperacao_senha" (
    "id_recuperacao" BIGSERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expira_em" TIMESTAMP NOT NULL,
    "utilizado" BOOLEAN NOT NULL DEFAULT false,
    "data_pedido" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recuperacao_senha_pkey" PRIMARY KEY ("id_recuperacao")
);

-- CreateTable
CREATE TABLE "diario_aula" (
    "id_diario" SERIAL NOT NULL,
    "id_docente" INTEGER NOT NULL,
    "id_disciplina" INTEGER NOT NULL,
    "id_turma" INTEGER NOT NULL,
    "data_aula" DATE NOT NULL,
    "tema_aula" TEXT NOT NULL,
    "observacao" TEXT,
    "data_registo" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diario_aula_pkey" PRIMARY KEY ("id_diario")
);

-- CreateTable
CREATE TABLE "presenca_aula" (
    "id_presenca" BIGSERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_disciplina" INTEGER NOT NULL,
    "data_aula" DATE NOT NULL,
    "presente" BOOLEAN NOT NULL DEFAULT true,
    "observacao" TEXT,

    CONSTRAINT "presenca_aula_pkey" PRIMARY KEY ("id_presenca")
);

-- CreateTable
CREATE TABLE "atividade_usuario" (
    "id_atividade" BIGSERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "tipo_atividade" VARCHAR(100) NOT NULL,
    "descricao" TEXT,
    "data_atividade" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "atividade_usuario_pkey" PRIMARY KEY ("id_atividade")
);

-- CreateTable
CREATE TABLE "reputacao_academica" (
    "id_reputacao" BIGSERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "pontos" INTEGER NOT NULL DEFAULT 0,
    "nivel" VARCHAR(50) NOT NULL DEFAULT 'iniciante',
    "mentorias_realizadas" INTEGER NOT NULL DEFAULT 0,
    "projetos_publicados" INTEGER NOT NULL DEFAULT 0,
    "feedback_positivo" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "reputacao_academica_pkey" PRIMARY KEY ("id_reputacao")
);

-- CreateTable
CREATE TABLE "oportunidade_academica" (
    "id_oportunidade" BIGSERIAL NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "empresa" VARCHAR(150),
    "requisitos" TEXT,
    "data_limite" DATE,
    "criado_por" INTEGER,
    "data_publicacao" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oportunidade_academica_pkey" PRIMARY KEY ("id_oportunidade")
);

-- CreateTable
CREATE TABLE "candidatura_oportunidade" (
    "id_candidatura" BIGSERIAL NOT NULL,
    "id_oportunidade" BIGINT NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "estado" VARCHAR(30) NOT NULL DEFAULT 'pendente',
    "data_candidatura" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidatura_oportunidade_pkey" PRIMARY KEY ("id_candidatura")
);

-- CreateTable
CREATE TABLE "seguidor_usuario" (
    "id_seguidor" INTEGER NOT NULL,
    "id_seguido" INTEGER NOT NULL,
    "data_registo" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seguidor_usuario_pkey" PRIMARY KEY ("id_seguidor","id_seguido")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_num_estudante_login_key" ON "usuario"("num_estudante_login");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_num_bi_key" ON "usuario"("num_bi");

-- CreateIndex
CREATE UNIQUE INDEX "perfil_nome_perfil_key" ON "perfil"("nome_perfil");

-- CreateIndex
CREATE UNIQUE INDEX "matriccula_num_processo_key" ON "matriccula"("num_processo");

-- CreateIndex
CREATE UNIQUE INDEX "solicitacao_acesso_email_key" ON "solicitacao_acesso"("email");

-- CreateIndex
CREATE UNIQUE INDEX "grupo_chave_conversa_key" ON "grupo"("chave_conversa");

-- CreateIndex
CREATE INDEX "publicacao_estado_data_publicacao_idx" ON "publicacao"("estado", "data_publicacao");

-- CreateIndex
CREATE INDEX "comentario_publicacao_id_publicacao_estado_data_publicacao_idx" ON "comentario_publicacao"("id_publicacao", "estado", "data_publicacao");

-- CreateIndex
CREATE INDEX "diario_aula_id_docente_data_aula_idx" ON "diario_aula"("id_docente", "data_aula");

-- CreateIndex
CREATE UNIQUE INDEX "diario_aula_id_disciplina_id_turma_data_aula_key" ON "diario_aula"("id_disciplina", "id_turma", "data_aula");

-- AddForeignKey
ALTER TABLE "usuarioperfil" ADD CONSTRAINT "usuarioperfil_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarioperfil" ADD CONSTRAINT "usuarioperfil_id_perfil_fkey" FOREIGN KEY ("id_perfil") REFERENCES "perfil"("id_perfil") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ccurso" ADD CONSTRAINT "ccurso_id_uo_fkey" FOREIGN KEY ("id_uo") REFERENCES "unidadeorganica"("id_uo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ccurso" ADD CONSTRAINT "ccurso_id_coordenador_fkey" FOREIGN KEY ("id_coordenador") REFERENCES "usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarioCurso" ADD CONSTRAINT "usuarioCurso_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarioCurso" ADD CONSTRAINT "usuarioCurso_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "ccurso"("id_curso") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disciplina" ADD CONSTRAINT "disciplina_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "ccurso"("id_curso") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma" ADD CONSTRAINT "turma_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "ccurso"("id_curso") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matriccula" ADD CONSTRAINT "matriccula_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matriccula" ADD CONSTRAINT "matriccula_id_turma_fkey" FOREIGN KEY ("id_turma") REFERENCES "turma"("id_turma") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacao_acesso" ADD CONSTRAINT "solicitacao_acesso_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "ccurso"("id_curso") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacao_acesso" ADD CONSTRAINT "solicitacao_acesso_id_turma_fkey" FOREIGN KEY ("id_turma") REFERENCES "turma"("id_turma") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacao_acesso" ADD CONSTRAINT "solicitacao_acesso_id_coordenador_validador_fkey" FOREIGN KEY ("id_coordenador_validador") REFERENCES "usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habilidade" ADD CONSTRAINT "habilidade_id_competencia_fkey" FOREIGN KEY ("id_competencia") REFERENCES "competencia"("id_competencia") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estudante_habilidade" ADD CONSTRAINT "estudante_habilidade_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estudante_habilidade" ADD CONSTRAINT "estudante_habilidade_id_habilidade_fkey" FOREIGN KEY ("id_habilidade") REFERENCES "habilidade"("id_habilidade") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo" ADD CONSTRAINT "grupo_id_turma_fkey" FOREIGN KEY ("id_turma") REFERENCES "turma"("id_turma") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo" ADD CONSTRAINT "grupo_id_disciplina_fkey" FOREIGN KEY ("id_disciplina") REFERENCES "disciplina"("id_disciplina") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo" ADD CONSTRAINT "grupo_id_criador_fkey" FOREIGN KEY ("id_criador") REFERENCES "usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo_membro" ADD CONSTRAINT "grupo_membro_id_grupo_fkey" FOREIGN KEY ("id_grupo") REFERENCES "grupo"("id_grupo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo_membro" ADD CONSTRAINT "grupo_membro_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagem" ADD CONSTRAINT "mensagem_id_grupo_fkey" FOREIGN KEY ("id_grupo") REFERENCES "grupo"("id_grupo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagem" ADD CONSTRAINT "mensagem_id_emissor_fkey" FOREIGN KEY ("id_emissor") REFERENCES "usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagem_fixada_log" ADD CONSTRAINT "mensagem_fixada_log_id_mensagem_fkey" FOREIGN KEY ("id_mensagem") REFERENCES "mensagem"("id_mensagem") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagem_fixada_log" ADD CONSTRAINT "mensagem_fixada_log_id_usuario_quem_fixou_fkey" FOREIGN KEY ("id_usuario_quem_fixou") REFERENCES "usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessao_mentoria" ADD CONSTRAINT "sessao_mentoria_id_grupo_mentoria_fkey" FOREIGN KEY ("id_grupo_mentoria") REFERENCES "grupo"("id_grupo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessao_mentoria" ADD CONSTRAINT "sessao_mentoria_id_mentor_fkey" FOREIGN KEY ("id_mentor") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessao_mentoria" ADD CONSTRAINT "sessao_mentoria_id_estudante_ajudado_fkey" FOREIGN KEY ("id_estudante_ajudado") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_mentoria" ADD CONSTRAINT "feedback_mentoria_id_sessao_fkey" FOREIGN KEY ("id_sessao") REFERENCES "sessao_mentoria"("id_sessao") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacao" ADD CONSTRAINT "avaliacao_id_disciplina_fkey" FOREIGN KEY ("id_disciplina") REFERENCES "disciplina"("id_disciplina") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacao" ADD CONSTRAINT "avaliacao_id_professor_fkey" FOREIGN KEY ("id_professor") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questao" ADD CONSTRAINT "questao_id_avaliacao_fkey" FOREIGN KEY ("id_avaliacao") REFERENCES "avaliacao"("id_avaliacao") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alternativa" ADD CONSTRAINT "alternativa_id_questao_fkey" FOREIGN KEY ("id_questao") REFERENCES "questao"("id_questao") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tentativa_avaliacao" ADD CONSTRAINT "tentativa_avaliacao_id_avaliacao_fkey" FOREIGN KEY ("id_avaliacao") REFERENCES "avaliacao"("id_avaliacao") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tentativa_avaliacao" ADD CONSTRAINT "tentativa_avaliacao_id_estudante_fkey" FOREIGN KEY ("id_estudante") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resposta_estudante" ADD CONSTRAINT "resposta_estudante_id_tentativa_fkey" FOREIGN KEY ("id_tentativa") REFERENCES "tentativa_avaliacao"("id_tentativa") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resposta_estudante" ADD CONSTRAINT "resposta_estudante_id_questao_fkey" FOREIGN KEY ("id_questao") REFERENCES "questao"("id_questao") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resposta_estudante" ADD CONSTRAINT "resposta_estudante_id_alternativa_escolhida_fkey" FOREIGN KEY ("id_alternativa_escolhida") REFERENCES "alternativa"("id_alternativa") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_seguranca" ADD CONSTRAINT "logs_seguranca_id_tentativa_fkey" FOREIGN KEY ("id_tentativa") REFERENCES "tentativa_avaliacao"("id_tentativa") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_vitrine" ADD CONSTRAINT "projeto_vitrine_id_disciplina_fkey" FOREIGN KEY ("id_disciplina") REFERENCES "disciplina"("id_disciplina") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_vitrine" ADD CONSTRAINT "projeto_vitrine_id_professor_autorizador_fkey" FOREIGN KEY ("id_professor_autorizador") REFERENCES "usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_autor" ADD CONSTRAINT "projeto_autor_id_projeto_fkey" FOREIGN KEY ("id_projeto") REFERENCES "projeto_vitrine"("id_projeto") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_autor" ADD CONSTRAINT "projeto_autor_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_curtidor" ADD CONSTRAINT "projeto_curtidor_id_projeto_fkey" FOREIGN KEY ("id_projeto") REFERENCES "projeto_vitrine"("id_projeto") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_curtidor" ADD CONSTRAINT "projeto_curtidor_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publicacao" ADD CONSTRAINT "publicacao_id_autor_fkey" FOREIGN KEY ("id_autor") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentario_publicacao" ADD CONSTRAINT "comentario_publicacao_id_publicacao_fkey" FOREIGN KEY ("id_publicacao") REFERENCES "publicacao"("id_publicacao") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentario_publicacao" ADD CONSTRAINT "comentario_publicacao_id_autor_fkey" FOREIGN KEY ("id_autor") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentario_publicacao" ADD CONSTRAINT "comentario_publicacao_id_comentario_pai_fkey" FOREIGN KEY ("id_comentario_pai") REFERENCES "comentario_publicacao"("id_comentario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gosto_publicacao" ADD CONSTRAINT "gosto_publicacao_id_publicacao_fkey" FOREIGN KEY ("id_publicacao") REFERENCES "publicacao"("id_publicacao") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gosto_publicacao" ADD CONSTRAINT "gosto_publicacao_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacao" ADD CONSTRAINT "notificacao_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_sessao" ADD CONSTRAINT "login_sessao_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_sistema" ADD CONSTRAINT "auditoria_sistema_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_academico" ADD CONSTRAINT "historico_academico_id_estudante_fkey" FOREIGN KEY ("id_estudante") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_academico" ADD CONSTRAINT "historico_academico_id_disciplina_fkey" FOREIGN KEY ("id_disciplina") REFERENCES "disciplina"("id_disciplina") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_didatico" ADD CONSTRAINT "material_didatico_id_disciplina_fkey" FOREIGN KEY ("id_disciplina") REFERENCES "disciplina"("id_disciplina") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_didatico" ADD CONSTRAINT "material_didatico_id_professor_fkey" FOREIGN KEY ("id_professor") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendario_academico" ADD CONSTRAINT "calendario_academico_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "ccurso"("id_curso") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendario_academico" ADD CONSTRAINT "calendario_academico_id_turma_fkey" FOREIGN KEY ("id_turma") REFERENCES "turma"("id_turma") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendario_academico" ADD CONSTRAINT "calendario_academico_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reuniao_virtual" ADD CONSTRAINT "reuniao_virtual_id_criador_fkey" FOREIGN KEY ("id_criador") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reuniao_virtual" ADD CONSTRAINT "reuniao_virtual_id_grupo_fkey" FOREIGN KEY ("id_grupo") REFERENCES "grupo"("id_grupo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reuniao_participante" ADD CONSTRAINT "reuniao_participante_id_reuniao_fkey" FOREIGN KEY ("id_reuniao") REFERENCES "reuniao_virtual"("id_reuniao") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reuniao_participante" ADD CONSTRAINT "reuniao_participante_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoramento_prova" ADD CONSTRAINT "monitoramento_prova_id_tentativa_fkey" FOREIGN KEY ("id_tentativa") REFERENCES "tentativa_avaliacao"("id_tentativa") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recuperacao_senha" ADD CONSTRAINT "recuperacao_senha_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diario_aula" ADD CONSTRAINT "diario_aula_id_docente_fkey" FOREIGN KEY ("id_docente") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diario_aula" ADD CONSTRAINT "diario_aula_id_disciplina_fkey" FOREIGN KEY ("id_disciplina") REFERENCES "disciplina"("id_disciplina") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diario_aula" ADD CONSTRAINT "diario_aula_id_turma_fkey" FOREIGN KEY ("id_turma") REFERENCES "turma"("id_turma") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presenca_aula" ADD CONSTRAINT "presenca_aula_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presenca_aula" ADD CONSTRAINT "presenca_aula_id_disciplina_fkey" FOREIGN KEY ("id_disciplina") REFERENCES "disciplina"("id_disciplina") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividade_usuario" ADD CONSTRAINT "atividade_usuario_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reputacao_academica" ADD CONSTRAINT "reputacao_academica_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oportunidade_academica" ADD CONSTRAINT "oportunidade_academica_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidatura_oportunidade" ADD CONSTRAINT "candidatura_oportunidade_id_oportunidade_fkey" FOREIGN KEY ("id_oportunidade") REFERENCES "oportunidade_academica"("id_oportunidade") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidatura_oportunidade" ADD CONSTRAINT "candidatura_oportunidade_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguidor_usuario" ADD CONSTRAINT "seguidor_usuario_id_seguidor_fkey" FOREIGN KEY ("id_seguidor") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguidor_usuario" ADD CONSTRAINT "seguidor_usuario_id_seguido_fkey" FOREIGN KEY ("id_seguido") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
