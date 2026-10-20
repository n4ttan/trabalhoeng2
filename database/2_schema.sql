DROP DATABASE IF EXISTS condominio;
CREATE DATABASE IF NOT EXISTS condominio;

USE condominio;

CREATE TABLE IF NOT EXISTS mensagens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    texto VARCHAR(255) NOT NULL
);


CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    perfil ENUM('ADMIN_PLATAFORMA', 'USUARIO', 'CANDIDATO', 'SINDICO', 'MORADOR', 'ADMIN') NOT NULL,
    id_condominio INT NOT NULL,
    status_cadastro ENUM('AGUARDANDO_EMAIL', 'PENDENTE_APROVACAO', 'APROVADO', 'REJEITADO') DEFAULT 'AGUARDANDO_EMAIL',
    token_validacao VARCHAR(255),
    token_expira_em DATETIME,
    tentativas_validacao INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pedidos_sindico (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    condominio_id INT NOT NULL,
    deferido BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_pedido_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS condominios(
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    numero_moradores INT NOT NULL,
    sindico_responsavel INT NOT NULL

)

INSERT INTO usuarios (nome, email, senha, perfil, id_condominio, status_cadastro) 
VALUES (
    'Administrador Geral', 
    'admin@condominio.com', 
    '$2b$10$Nx.nvEbDklACp6msJ4t1XOqnZ9C3bhiKuPvHL4fGC2KSmzvkh6MJi', 
    'ADMIN', 
    0,
    'APROVADO' 
);