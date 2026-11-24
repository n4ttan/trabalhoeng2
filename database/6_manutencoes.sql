USE condominio;

CREATE TABLE IF NOT EXISTS manutencoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_condominio INT NOT NULL,
    id_usuario INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT NOT NULL,
    local VARCHAR(150) NOT NULL,
    prioridade ENUM('BAIXA', 'MEDIA', 'ALTA') NOT NULL DEFAULT 'MEDIA',
    status ENUM('ABERTO', 'EM_ANDAMENTO', 'CONCLUIDO') NOT NULL DEFAULT 'ABERTO',
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_manutencao_condominio
    FOREIGN KEY (id_condominio) REFERENCES condominios(id) ON DELETE CASCADE,

    CONSTRAINT fk_manutencao_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,

    INDEX idx_manutencao_condominio (id_condominio),
    INDEX idx_manutencao_usuario (id_usuario)
);
