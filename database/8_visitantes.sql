USE condominio;

CREATE TABLE IF NOT EXISTS visitantes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_condominio INT NOT NULL,
    id_usuario INT NOT NULL,
    nome_visitante VARCHAR(150) NOT NULL,
    documento VARCHAR(30) NOT NULL,
    data_prevista DATETIME NOT NULL,
    validade_ate DATETIME NOT NULL,
    status ENUM('AUTORIZADO', 'ENTROU', 'SAIU', 'CANCELADO') NOT NULL DEFAULT 'AUTORIZADO',
    entrada_em DATETIME NULL,
    saida_em DATETIME NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_visitante_condominio
        FOREIGN KEY (id_condominio) REFERENCES condominios(id) ON DELETE CASCADE,
    CONSTRAINT fk_visitante_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,

    INDEX idx_visitante_condominio (id_condominio),
    INDEX idx_visitante_usuario (id_usuario)
);
