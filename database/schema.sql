CREATE DATABASE IF NOT EXISTS condominio;

USE condominio;

CREATE TABLE IF NOT EXISTS mensagens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    texto VARCHAR(255) NOT NULL
);

INSERT INTO mensagens (texto)
VALUES ('Olá Mundo!');