USE condominio;

CREATE TABLE IF NOT EXISTS boletos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_condominio INT NOT NULL,
    id_usuario INT NOT NULL,
    mes_referencia VARCHAR(20) NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    data_vencimento DATE NOT NULL,
    status ENUM('PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO') NOT NULL DEFAULT 'PENDENTE',
    codigo_barras VARCHAR(100) NOT NULL,
    linha_digitavel VARCHAR(100) NOT NULL,
    data_pagamento DATETIME NULL,
    valor_pago DECIMAL(10, 2) NULL,
    forma_pagamento VARCHAR(50) NULL,
    codigo_autenticacao VARCHAR(100) NULL,
    segunda_via_emitida_em DATETIME NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_boleto_condominio
        FOREIGN KEY (id_condominio)
        REFERENCES condominios(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_boleto_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    INDEX idx_boleto_condominio (id_condominio),
    INDEX idx_boleto_usuario (id_usuario),
    INDEX idx_boleto_status (status)
);
