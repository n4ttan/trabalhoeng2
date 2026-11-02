jest.mock('express', () => {
    const app = {
        use: jest.fn(),
        post: jest.fn(),
        get: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn()
    };

    const express = jest.fn(() => app);
    express.json = jest.fn(() => 'json-middleware');

    return express;
});

jest.mock('http', () => ({
    createServer: jest.fn(() => ({
        listen: jest.fn()
    }))
}));

jest.mock('socket.io', () => ({
    Server: jest.fn(() => ({
        use: jest.fn(),
        on: jest.fn()
    }))
}));

jest.mock('jsonwebtoken', () => ({
    verify: jest.fn()
}));

jest.mock('cors', () => jest.fn(() => 'cors-middleware'));

jest.mock('../src/socket', () => ({
    setIO: jest.fn()
}));

jest.mock('../src/controllers/mensagemController', () => ({
    obterMensagem: jest.fn()
}));

jest.mock('../src/controllers/pedidoSindicoController', () => ({
    criarPedidoSindico: jest.fn(),
    aprovarPedidoSindico: jest.fn(),
    reprovarPedidoSindico: jest.fn()
}));

jest.mock('../src/controllers/usuarioController', () => ({
    criarUsuario: jest.fn(),
    criarMorador: jest.fn(),
    validarEmail: jest.fn(),
    reenviarCodigo: jest.fn(),
    excluirUsuarioEPedido: jest.fn(),
    rebaixarUsuario: jest.fn(),
    listarPendentes: jest.fn(),
    aprovarMorador: jest.fn(),
    rejeitarMorador: jest.fn()
}));

jest.mock('../src/controllers/condominioController', () => ({
    acessarCondominio: jest.fn(),
    adicionarMorador: jest.fn(),
    definirMoradorBloco: jest.fn(),
    adicionarCondominio: jest.fn(),
    retirarCondominio: jest.fn(),
    listarMoradores: jest.fn(),
    listarCondominios: jest.fn(),
    obterCondominio: jest.fn(),
    criarBloco: jest.fn(),
    listarBlocos: jest.fn(),
    atribuirGerenciamento: jest.fn(),
    removerGerenciamento: jest.fn(),
    listarGerenciamentos: jest.fn()
}));

jest.mock('../src/controllers/authController', () => ({
    login: jest.fn()
}));

jest.mock('../src/controllers/notificacaoController', () => ({
    listar: jest.fn(),
    marcarComoLida: jest.fn(),
    publicar: jest.fn()
}));

jest.mock('../src/middleware/auth', () => ({
    verificarToken: jest.fn(),
    verificarSindico: jest.fn(),
    verificarAdmin: jest.fn(),
    verificarMorador: jest.fn(),
    verificarCondominioMorador: jest.fn(),
    verificarCondominioSindico: jest.fn()
}));

describe('Inicialização do servidor', () => {
    let app;
    let express;
    let http;
    let Server;
    let setIO;

    beforeEach(() => {
        jest.resetModules();

        express = require('express');
        http = require('http');
        ({ Server } = require('socket.io'));
        ({ setIO } = require('../src/socket'));

        app = express();
    });

    it('deve criar a aplicação Express e o servidor HTTP', () => {
        require('../src/server');

        expect(express).toHaveBeenCalled();
        expect(http.createServer).toHaveBeenCalledWith(app);
    });

    it('deve configurar o Socket.IO e registrar sua instância', () => {
        require('../src/server');

        expect(Server).toHaveBeenCalledWith(
            expect.any(Object),
            {
                cors: {
                    origin: 'http://localhost:5173'
                }
            }
        );

        expect(setIO).toHaveBeenCalledWith(expect.any(Object));
    });

    it('deve configurar o middleware de CORS e o parser JSON', () => {
        require('../src/server');

        expect(app.use).toHaveBeenCalledWith('cors-middleware');
        expect(app.use).toHaveBeenCalledWith('json-middleware');
    });

    it('deve registrar as principais rotas da API', () => {
        require('../src/server');

        expect(app.post).toHaveBeenCalledWith(
            '/login',
            expect.any(Function)
        );

        expect(app.get).toHaveBeenCalledWith(
            '/',
            expect.any(Function)
        );

        expect(app.post).toHaveBeenCalledWith(
            '/pedidos-sindico',
            expect.any(Function),
            expect.any(Function)
        );

        expect(app.get).toHaveBeenCalledWith(
            '/notificacoes',
            expect.any(Function),
            expect.any(Function)
        );

        expect(app.post).toHaveBeenCalledWith(
            '/notificacoes',
            expect.any(Function),
            expect.any(Function)
        );
    });

    it('deve registrar as rotas administrativas de pedidos de síndico', () => {
        require('../src/server');

        expect(app.patch).toHaveBeenCalledWith(
            '/admin/pedidos-sindico/:pedidoId/aprovar',
            expect.any(Function),
            expect.any(Function),
            expect.any(Function)
        );

        expect(app.patch).toHaveBeenCalledWith(
            '/admin/pedidos-sindico/:pedidoId/reprovar',
            expect.any(Function),
            expect.any(Function),
            expect.any(Function)
        );
    });

    it('deve registrar as rotas de condomínios', () => {
        require('../src/server');

        expect(app.post).toHaveBeenCalledWith(
            '/condominios',
            expect.any(Function),
            expect.any(Function),
            expect.any(Function)
        );

        expect(app.get).toHaveBeenCalledWith(
            '/condominios',
            expect.any(Function)
        );

        expect(app.delete).toHaveBeenCalledWith(
            '/condominios/:idCondominio',
            expect.any(Function),
            expect.any(Function),
            expect.any(Function)
        );
    });

    it('não deve iniciar o servidor HTTP durante a importação do módulo', () => {
        require('../src/server');

        const servidor = http.createServer.mock.results[0].value;

        expect(servidor.listen).not.toHaveBeenCalled();
    });
});