const express = require('express');
const cors = require('cors');
const mensagemController = require('./controllers/mensagemController');

const app = express();

app.use(cors());

app.get('/', mensagemController.obterMensagem);

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});