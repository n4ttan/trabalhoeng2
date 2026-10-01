const express = require('express');
require('dotenv').config();
const cors = require('cors');
const mensagemController = require('./controllers/mensagemController');
const pedidoSindicoController = require('./controllers/pedidoSindicoController');
const usuarioController = require('./controllers/usuarioController');
const authController = require('./controllers/authController');
const { verificarToken, verificarSindico } = require('./middleware/auth');

// Inicializa a API Express.
const app = express();

// Permite que o frontend consuma a API e decodifica requisições em JSON.
app.use(cors());
app.use(express.json());

app.post(
    '/login', 
    authController.login);


// Rota raiz usada para testar se a API está respondendo.
app.get(
    '/', 
    mensagemController.obterMensagem);

// Cria um pedido para o usuário se candidatar ao cargo de síndico.
app.post(
    verificarToken,
    '/pedidos-sindico', 
    pedidoSindicoController.criarPedidoSindico);

// Cria um novo usuário no sistema.
app.post(
    '/usuarios', 
    usuarioController.criarUsuario);

// Cadastra um morador (perfil fixo, com unidade) e envia o código de validação por e-mail.
app.post(
    '/usuarios/moradores', 
    usuarioController.criarMorador);

// Confirma o código de validação enviado ao e-mail do morador.
app.post(
    '/usuarios/validar-email',
    usuarioController.validarEmail);

// Gera e envia um novo código para cadastros que ainda aguardam validação do e-mail.
app.post(
    '/usuarios/reenviar-codigo',
    usuarioController.reenviarCodigo);

// Inicia o servidor na porta 3000.
app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});

// Remove um usuário e também todos os pedidos de síndico vinculados a ele.
app.delete(
    verificarToken,
    verificarSindico,
    '/usuarios/:usuarioId',
    usuarioController.excluirUsuarioEPedido);

// Aprova um pedido pendente e atualiza o perfil do usuário para síndico.
app.patch(
    verificarToken,
    verificarSindico,
    '/pedidos-sindico/:pedidoId/aprovar',
    pedidoSindicoController.aprovarPedidoSindico
);

app.get(
    verificarToken,
    verificarSindico,
    '/usuarios/pendentes', 
    usuarioController.listarPendentes);

app.patch(
    verificarToken,
    verificarSindico,
    '/usuarios/:usuarioId/aprovar', 
    usuarioController.aprovarMorador);

app.patch(
    verificarToken,
    verificarSindico,
    '/usuarios/:usuarioId/rejeitar', 
    usuarioController.rejeitarMorador);


