const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cors = require('cors');
const mensagemController = require('./controllers/mensagemController');
const { setIO } = require('./socket');
const pedidoSindicoController = require('./controllers/pedidoSindicoController');
const usuarioController = require('./controllers/usuarioController');
const condominioController = require('./controllers/condominioController');
const authController = require('./controllers/authController');
const notificacaoController = require('./controllers/notificacaoController');
const {
    verificarToken,
    verificarSindico,
    verificarAdmin,
    verificarMorador,
    verificarCondominioMorador,
    verificarCondominioSindico
} = require('./middleware/auth');

// Inicializa a API Express.
const app = express();

// Cria um servidor HTTP para a API e os WebSockets.
const httpServer = http.createServer(app);

// Inicializa o Socket.IO associado ao servidor HTTP.
const io = new Server(httpServer, {
    cors: {
        origin: 'http://localhost:5173'
    }
});
setIO(io);

io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
        return next(new Error('Token não fornecido'));
    }

    try {
        const usuario = jwt.verify(token, process.env.JWT_SECRET);
        socket.data.usuario = usuario;
        next();
    } catch (error) {
        next(new Error('Token inválido ou expirado'));
    }
});

io.on('connection', (socket) => {
    const usuario = socket.data.usuario;

    socket.join(`usuario:${usuario.id}`);

    console.log(
        `Usuário ${usuario.id} conectado via WebSocket:`,
        socket.id
    );

    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});

// Permite que o frontend consuma a API e decodifica requisições em JSON.
app.use(cors());
app.use(express.json());

// Autenticação
app.post(
    '/login', 
    authController.login
);

// Rota raiz usada para testar se a API está respondendo.
app.get(
    '/', 
    mensagemController.obterMensagem
);

// Cria um pedido para o usuário se candidatar ao cargo de síndico para determinado condomínio.
app.post(
    '/pedidos-sindico', 
    verificarToken,
    pedidoSindicoController.criarPedidoSindico
);

// Cria um novo usuário no sistema.
app.post(
    '/usuarios', 
    usuarioController.criarUsuario
);

// Cadastra um morador (perfil fixo, com unidade, opcionalmente condomínio e bloco) e envia o código de validação por e-mail.
app.post(
    '/usuarios/moradores', 
    usuarioController.criarMorador
);

// Confirma o código de validação enviado ao e-mail do morador.
app.post(
    '/usuarios/validar-email',
    usuarioController.validarEmail
);

// Gera e envia um novo código para cadastros que ainda aguardam validação do e-mail.
app.post(
    '/usuarios/reenviar-codigo',
    usuarioController.reenviarCodigo
);

// ======================== ROTAS DE CONDOMÍNIOS ========================

// Acessar painel do condomínio pelo morador ou admin
app.post(
    '/usuarios/:idCondominio/acessarCondominio',
    verificarToken,
    verificarCondominioMorador,
    condominioController.acessarCondominio
);

// Adicionar morador a um condomínio
app.post(
    '/condominios/:idCondominio/adicionarMorador',
    verificarToken,
    verificarSindico,
    condominioController.adicionarMorador
);

// Definir / atualizar bloco e unidade do morador (admin ou síndico)
app.patch(
    '/condominios/:idCondominio/moradores/:usuarioId/bloco',
    verificarToken,
    verificarSindico,
    condominioController.definirMoradorBloco
);

app.post(
    '/condominios/:idCondominio/definirMoradorBloco',
    verificarToken,
    verificarSindico,
    condominioController.definirMoradorBloco
);

// Cadastra um novo condomínio
app.post(
    '/condominios/adicionarCondominio',
    verificarToken,
    verificarAdmin,
    condominioController.adicionarCondominio
);

app.post(
    '/condominios',
    verificarToken,
    verificarAdmin,
    condominioController.adicionarCondominio
);

// Remove um condomínio
app.post(
    '/condominios/retirarCondominio',
    verificarToken,
    verificarAdmin,
    condominioController.retirarCondominio
);

app.delete(
    '/condominios/:idCondominio',
    verificarToken,
    verificarAdmin,
    condominioController.retirarCondominio
);

// Puxa todos os moradores de um condomínio (com filtro opcional de bloco via ?blocoId=)
app.get(
    '/condominios/:idCondominio/moradores',
    verificarToken,
    verificarSindico,
    condominioController.listarMoradores
);

// Puxa todos os condomínios
app.get(
    '/condominios',
    verificarToken,
    condominioController.listarCondominios
);

// Puxa detalhes de um condomínio
app.get(
    '/condominios/:idCondominio',
    verificarToken,
    condominioController.obterCondominio
);

// Criar e listar blocos de um condomínio
app.post(
    '/condominios/:idCondominio/blocos',
    verificarToken,
    verificarSindico,
    condominioController.criarBloco
);

app.get(
    '/condominios/:idCondominio/blocos',
    verificarToken,
    condominioController.listarBlocos
);

// Atribuir múltiplos condomínios e blocos para gerenciamento (Admin)
app.post(
    '/admin/gerenciamento',
    verificarToken,
    verificarAdmin,
    condominioController.atribuirGerenciamento
);

app.post(
    '/usuarios/:usuarioId/atribuir-gerenciamento',
    verificarToken,
    verificarAdmin,
    condominioController.atribuirGerenciamento
);

app.get(
    '/usuarios/:usuarioId/gerenciamentos',
    verificarToken,
    condominioController.listarGerenciamentos
);

// ======================== ADMIN E GERÊNCIA DE USUÁRIOS ========================

// Remove um usuário e também todos os pedidos de síndico vinculados a ele.
app.delete(
    '/usuarios/:usuarioId',
    verificarToken,
    verificarSindico,
    usuarioController.excluirUsuarioEPedido
);

// Aprova um pedido pendente e atualiza o perfil do usuário para síndico.
app.patch(
    '/admin/pedidos-sindico/:pedidoId/aprovar',
    verificarToken,
    verificarAdmin,
    pedidoSindicoController.aprovarPedidoSindico
);

app.patch(
    '/admin/pedidos-sindico/:pedidoId/reprovar',
    verificarToken,
    verificarAdmin,
    pedidoSindicoController.reprovarPedidoSindico
);

app.patch(
    '/admin/usuarios/:usuarioId/rebaixar',
    verificarToken,
    verificarAdmin, 
    usuarioController.rebaixarUsuario
);

app.get(
    '/usuarios/pendentes', 
    verificarToken,
    verificarSindico,
    usuarioController.listarPendentes
);

app.patch(
    '/usuarios/:usuarioId/aprovar', 
    verificarToken,
    verificarSindico,
    usuarioController.aprovarMorador
);

app.patch(
    '/usuarios/:usuarioId/rejeitar', 
    verificarToken,
    verificarSindico,
    usuarioController.rejeitarMorador
);

// ======================== NOTIFICAÇÕES ========================

// Listar notificações do usuário autenticado
app.get(
    '/notificacoes',
    verificarToken,
    notificacaoController.listar
);
// Marca uma notificação como lida para o usuário autenticado
app.patch(
    '/notificacoes/:id/lida',
    verificarToken,
    notificacaoController.marcarComoLida
);
// Publica uma nova notificação (Admin ou Síndico)
app.post(
    '/notificacoes',
    verificarToken,
    notificacaoController.publicar
);

// Inicia o servidor na porta 3000 se executado diretamente.
if (require.main === module) {
    httpServer.listen(3000, () => {
        console.log('Servidor rodando na porta 3000');
    });
}

module.exports = app;
