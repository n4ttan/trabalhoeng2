const express = require('express');
require('dotenv').config();
const cors = require('cors');
const mensagemController = require('./controllers/mensagemController');
const pedidoSindicoController = require('./controllers/pedidoSindicoController');
const usuarioController = require('./controllers/usuarioController');
const authController = require('./controllers/authController');
const { verificarToken, verificarSindico, verificarAdmin, verificarMorador, verificarCondominioMorador } = require('./middleware/auth');

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
app.post(   //alterar para pedir o id do novo condominio
    '/pedidos-sindico', 
    verificarToken,
    pedidoSindicoController.criarPedidoSindico);

// Cria um novo usuário no sistema.
app.post(
    '/usuarios', 
    usuarioController.criarUsuario);

// Cadastra um morador (perfil fixo, com unidade) e envia o código de validação por e-mail.
app.post( //adicionar o id do condominio especifico
    '/usuarios/moradores', 
    usuarioController.criarMorador);

// Confirma o código de validação enviado ao e-mail do morador.
app.post(
    '/usuarios/validar-email',
    usuarioController.validarEmail);
/*
app.post(
    '/usuarios/:idCondominio/acessarCondominio',
    verificarToken,
    verificarCondominioMorador,
    //chamar o controller de acessar página
)

app.post(
    '/condominios/:idCondominio/adicionarMorador'
    //fazer um condominio controller
)

app.post(
    '/condominios/adicionarCondominio'
    // registra um novo condominio
)

app.post(
    '/condominios/retirarCondominio'
    // retira um condominio
)

app.get(
    'condominios/:idCondominio/moradores'
    //puxa todos os moradores desse condominio
)

app.get(
    'condominios/'
    // puxa todos os condominios
)

//tem que atualizar as outras funções, de pedido sindico e atribuir moradores. resumindo tem que mudar tudo
*/
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
    '/usuarios/:usuarioId',
    verificarToken,
    verificarSindico,
    usuarioController.excluirUsuarioEPedido);

// Aprova um pedido pendente e atualiza o perfil do usuário para síndico.
app.patch(
    '/admin/pedidos-sindico/:pedidoId/apro  var',
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
    usuarioController.listarPendentes);

app.patch(
    '/usuarios/:usuarioId/aprovar', 
    verificarToken,
    verificarSindico,
    usuarioController.aprovarMorador);

app.patch(
    '/usuarios/:usuarioId/rejeitar', 
    verificarToken,
    verificarSindico,
    usuarioController.rejeitarMorador);


