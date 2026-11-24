USE condominio;

CREATE TABLE IF NOT EXISTS ocorrencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_condominio INT NOT NULL,
    id_usuario INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT NOT NULL,
    categoria ENUM('BARULHO', 'VAZAMENTO', 'SEGURANCA', 'LIMPEZA', 'OUTROS') NOT NULL,
    data_ocorrencia DATE NOT NULL,
    status ENUM('REGISTRADA', 'EM_ANALISE', 'RESOLVIDA') NOT NULL DEFAULT 'REGISTRADA',
    resposta TEXT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_ocorrencia_condominio
        FOREIGN KEY (id_condominio) REFERENCES condominios(id) ON DELETE CASCADE,
    CONSTRAINT fk_ocorrencia_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,

    INDEX idx_ocorrencia_condominio (id_condominio),
    INDEX idx_ocorrencia_usuario (id_usuario)
);
