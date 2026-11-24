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
const reuniaoController = require('./controllers/reuniaoController');
const reservaController = require('./controllers/reservaController'); // Importado para KAN-14
const reservaSalaoController = require('./controllers/reservaSalaoController');
const boletoController = require('./controllers/boletoController');
const multaController = require('./controllers/multaController');
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

// Buscar perfil do usuário autenticado
app.get(
    '/usuarios/me',
    verificarToken,
    usuarioController.buscarPerfil
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

// Remover uma atribuição de gerenciamento (Admin)
app.delete(
    '/usuarios/:usuarioId/gerenciamentos/:gerenciamentoId',
    verificarToken,
    verificarAdmin,
    condominioController.removerGerenciamento
);

app.get(
    '/usuarios/:usuarioId/gerenciamentos',
    verificarToken,
    condominioController.listarGerenciamentos
);

// ======================== REUNIÕES MARCADAS ========================

// Listar reuniões marcadas de um condomínio
app.get(
    '/condominios/:idCondominio/reunioes',
    verificarToken,
    reuniaoController.listarReunioes
);

// Agendar nova reunião (Apenas Síndico ou Admin)
app.post(
    '/condominios/:idCondominio/reunioes',
    verificarToken,
    verificarSindico,
    reuniaoController.criarReuniao
);

// Cancelar / Excluir reunião (Apenas Síndico ou Admin)
app.delete(
    '/condominios/:idCondominio/reunioes/:reuniaoId',
    verificarToken,
    verificarSindico,
    reuniaoController.deletarReuniao
);

// ======================== RESERVAS DE CHURRASQUEIRA (KAN-14) ========================

// Listar reservas de um condomínio
app.get(
    '/condominios/:idCondominio/reservas-churrasqueira',
    verificarToken,
    reservaController.listar
);

// Criar nova reserva (Morador ou Síndico)
app.post(
    '/condominios/:idCondominio/reservas-churrasqueira',
    verificarToken,
    reservaController.criar
);

// ======================== RESERVAS DE SALÃO DE FESTAS ========================

// Listar reservas do salão de festas de um condomínio
app.get(
    '/condominios/:idCondominio/reservas-salao',
    verificarToken,
    reservaSalaoController.listar
);

// Criar nova reserva do salão de festas (Morador ou Síndico)
app.post(
    '/condominios/:idCondominio/reservas-salao',
    verificarToken,
    reservaSalaoController.criar
);

// Cancelar reserva do salão de festas
app.patch(
    '/condominios/:idCondominio/reservas-salao/:id/cancelar',
    verificarToken,
    reservaSalaoController.cancelar
);

// Obter detalhes de reserva do salão de festas
app.get(
    '/condominios/:idCondominio/reservas-salao/:id',
    verificarToken,
    reservaSalaoController.obterPorId
);

// ======================== BOLETOS, SEGUNDA VIA E PAGAMENTO TEMPLATE ========================

// Criar boleto individual (Admin ou Síndico)
app.post(
    '/condominios/:idCondominio/boletos',
    verificarToken,
    verificarSindico,
    boletoController.criar
);

// Gerar boletos em lote para os moradores do condomínio (Admin ou Síndico)
app.post(
    '/condominios/:idCondominio/boletos/gerar-lote',
    verificarToken,
    verificarSindico,
    boletoController.gerarEmLote
);

// Listar boletos do morador autenticado no condomínio
app.get(
    '/condominios/:idCondominio/boletos/meus-boletos',
    verificarToken,
    boletoController.listarMeusBoletos
);

// Listar todos os boletos do condomínio (Síndico ou Admin)
app.get(
    '/condominios/:idCondominio/boletos',
    verificarToken,
    verificarSindico,
    boletoController.listar
);

// Geração da 2ª via do boleto (Morador ou Síndico)
app.get(
    '/condominios/:idCondominio/boletos/:id/segunda-via',
    verificarToken,
    boletoController.obterSegundaVia
);

// Realizar pagamento do boleto (template / simulação para cada morador no condomínio)
app.post(
    '/condominios/:idCondominio/boletos/:id/pagar',
    verificarToken,
    boletoController.pagar
);

// ======================== GESTÃO FINANCEIRA E NOTIFICAÇÕES (SÍNDICO) ========================

// Verificar o estado de pagamentos do respectivo condomínio (total de contas pagas, pendentes, etc.)
app.get(
    '/condominios/:idCondominio/pagamentos/status',
    verificarToken,
    verificarCondominioSindico,
    boletoController.obterEstadoPagamentos
);

// Sistema de notificação para usuários que ainda não pagaram a conta
app.post(
    '/condominios/:idCondominio/pagamentos/notificar-inadimplentes',
    verificarToken,
    verificarCondominioSindico,
    boletoController.notificarInadimplentes
);

// ======================== MULTAS DE MORADORES (KAN-12) ========================

// Registrar multa (Síndico do condomínio ou Admin)
app.post(
    '/condominios/:idCondominio/multas',
    verificarToken,
    verificarCondominioSindico,
    multaController.criar
);

// Listar multas do condomínio (Síndico do condomínio ou Admin)
app.get(
    '/condominios/:idCondominio/multas',
    verificarToken,
    verificarCondominioSindico,
    multaController.listar
);

// Multas do morador autenticado
app.get(
    '/condominios/:idCondominio/multas/minhas',
    verificarToken,
    verificarCondominioMorador,
    multaController.listarMinhas
);

// Marcar multa como paga ou cancelada (Síndico do condomínio ou Admin)
app.patch(
    '/condominios/:idCondominio/multas/:id/status',
    verificarToken,
    verificarCondominioSindico,
    multaController.atualizarStatus
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