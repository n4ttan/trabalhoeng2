// Carrega as variáveis de ambiente para não expor dados sensíveis no código.
require('dotenv').config();

const mysql = require('mysql2');

// Cria a conexão com o banco MySQL usando as credenciais do .env.
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

module.exports = connection;

// Verifica se a aplicação conseguiu conectar ao banco e registra o status.
connection.connect((error) => {
    if (error) {
        console.error('Erro ao conectar ao MySQL:', error);
        return;
    }

    console.log('Conectado ao MySQL com sucesso!');
});