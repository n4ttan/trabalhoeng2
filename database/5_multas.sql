USE condominio;

CREATE TABLE IF NOT EXISTS multas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_condominio INT NOT NULL,
    id_usuario INT NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    motivo VARCHAR(500) NOT NULL,
    data_multa DATE NOT NULL,
    status ENUM('PENDENTE', 'PAGA', 'CANCELADA') NOT NULL DEFAULT 'PENDENTE',
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_multa_condominio
        FOREIGN KEY (id_condominio)
        REFERENCES condominios(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_multa_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    INDEX idx_multa_condominio (id_condominio),
    INDEX idx_multa_usuario (id_usuario)
);
