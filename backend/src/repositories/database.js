require('dotenv').config();

const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

module.exports = connection;

connection.connect((error) => {
    if (error) {
        console.error('Erro ao conectar ao MySQL:', error);
        return;
    }

    console.log('Conectado ao MySQL com sucesso!');
});