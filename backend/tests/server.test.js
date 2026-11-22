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
    rejeitarMorador: jest.fn(),
    buscarPerfil: jest.fn()
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

jest.mock('../src/controllers/reservaSalaoController', () => ({
    listar: jest.fn(),
    criar: jest.fn(),
    cancelar: jest.fn(),
    obterPorId: jest.fn()
}));

jest.mock('../src/controllers/boletoController', () => ({
    criar: jest.fn(),
    gerarEmLote: jest.fn(),
    listarMeusBoletos: jest.fn(),
    listar: jest.fn(),
    obterSegundaVia: jest.fn(),
    pagar: jest.fn(),
    obterEstadoPagamentos: jest.fn(),
    notificarInadimplentes: jest.fn()
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

        expect(app.get).toHaveBeenCalledWith(
            '/usuarios/me',
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

    it('deve registrar as rotas de reserva do salão de festas', () => {
        require('../src/server');

        expect(app.get).toHaveBeenCalledWith(
            '/condominios/:idCondominio/reservas-salao',
            expect.any(Function),
            expect.any(Function)
        );

        expect(app.post).toHaveBeenCalledWith(
            '/condominios/:idCondominio/reservas-salao',
            expect.any(Function),
            expect.any(Function)
        );

        expect(app.patch).toHaveBeenCalledWith(
            '/condominios/:idCondominio/reservas-salao/:id/cancelar',
            expect.any(Function),
            expect.any(Function)
        );

        expect(app.get).toHaveBeenCalledWith(
            '/condominios/:idCondominio/reservas-salao/:id',
            expect.any(Function),
            expect.any(Function)
        );
    });

    it('deve registrar as rotas de boletos, segunda via, pagamento e notificações de inadimplentes', () => {
        require('../src/server');

        expect(app.post).toHaveBeenCalledWith(
            '/condominios/:idCondominio/boletos',
            expect.any(Function),
            expect.any(Function),
            expect.any(Function)
        );

        expect(app.post).toHaveBeenCalledWith(
            '/condominios/:idCondominio/boletos/gerar-lote',
            expect.any(Function),
            expect.any(Function),
            expect.any(Function)
        );

        expect(app.get).toHaveBeenCalledWith(
            '/condominios/:idCondominio/boletos/meus-boletos',
            expect.any(Function),
            expect.any(Function)
        );

        expect(app.get).toHaveBeenCalledWith(
            '/condominios/:idCondominio/boletos',
            expect.any(Function),
            expect.any(Function),
            expect.any(Function)
        );

        expect(app.get).toHaveBeenCalledWith(
            '/condominios/:idCondominio/boletos/:id/segunda-via',
            expect.any(Function),
            expect.any(Function)
        );

        expect(app.post).toHaveBeenCalledWith(
            '/condominios/:idCondominio/boletos/:id/pagar',
            expect.any(Function),
            expect.any(Function)
        );

        expect(app.get).toHaveBeenCalledWith(
            '/condominios/:idCondominio/pagamentos/status',
            expect.any(Function),
            expect.any(Function),
            expect.any(Function)
        );

        expect(app.post).toHaveBeenCalledWith(
            '/condominios/:idCondominio/pagamentos/notificar-inadimplentes',
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

    it('deve autenticar conexões WebSocket via middleware do Socket.IO', () => {
        const jwt = require('jsonwebtoken');
        let useCallback;
        Server.mockImplementation(() => ({
            use: jest.fn((cb) => {
                useCallback = cb;
            }),
            on: jest.fn()
        }));

        require('../src/server');

        expect(useCallback).toBeDefined();

        // Sem token
        const nextSemToken = jest.fn();
        useCallback({ handshake: { auth: {} } }, nextSemToken);
        expect(nextSemToken).toHaveBeenCalledWith(new Error('Token não fornecido'));

        // Token inválido
        jwt.verify.mockImplementation(() => {
            throw new Error('Invalido');
        });
        const nextInvalido = jest.fn();
        useCallback({ handshake: { auth: { token: 'bad' } } }, nextInvalido);
        expect(nextInvalido).toHaveBeenCalledWith(new Error('Token inválido ou expirado'));

        // Token válido
        jwt.verify.mockReturnValue({ id: 99 });
        const nextValido = jest.fn();
        const socketValido = { handshake: { auth: { token: 'good' } }, data: {} };
        useCallback(socketValido, nextValido);
        expect(socketValido.data.usuario).toEqual({ id: 99 });
        expect(nextValido).toHaveBeenCalledWith();
    });

    it('deve registrar conexão do socket e evento de disconnect', () => {
        let connectionCallback;
        Server.mockImplementation(() => ({
            use: jest.fn(),
            on: jest.fn((event, cb) => {
                if (event === 'connection') connectionCallback = cb;
            })
        }));

        require('../src/server');

        expect(connectionCallback).toBeDefined();

        let disconnectCallback;
        const socket = {
            id: 'socket-123',
            data: { usuario: { id: 77 } },
            join: jest.fn(),
            on: jest.fn((event, cb) => {
                if (event === 'disconnect') disconnectCallback = cb;
            })
        };

        connectionCallback(socket);

        expect(socket.join).toHaveBeenCalledWith('usuario:77');
        expect(disconnectCallback).toBeDefined();
        disconnectCallback();
    });
});