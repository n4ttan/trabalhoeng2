USE condominio;

CREATE TABLE IF NOT EXISTS notificacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    mensagem TEXT NOT NULL,
    tipo ENUM('AVISO', 'MANUTENCAO', 'URGENTE') NOT NULL DEFAULT 'AVISO',
    escopo ENUM('PLATAFORMA', 'CONDOMINIO') NOT NULL,
    condominio_id INT NULL,
    criado_por INT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notificacao_condominio
    FOREIGN KEY (condominio_id)
    REFERENCES condominios(id)
    ON DELETE CASCADE,

    CONSTRAINT fk_notificacao_autor
    FOREIGN KEY (criado_por)
    REFERENCES usuarios(id)
    ON DELETE SET NULL,

    INDEX idx_notificacao_condominio (condominio_id),
    INDEX idx_notificacao_criado_em (criado_em)
);

CREATE TABLE IF NOT EXISTS notificacao_destinatarios (
    notificacao_id INT NOT NULL,
    usuario_id INT NOT NULL,
    lida_em TIMESTAMP NULL DEFAULT NULL,

    PRIMARY KEY (notificacao_id, usuario_id),

    CONSTRAINT fk_notificacao_destinatario_notificacao
        FOREIGN KEY (notificacao_id)
        REFERENCES notificacoes(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_notificacao_destinatario_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    INDEX idx_notificacao_destinatario_usuario (usuario_id)
);
