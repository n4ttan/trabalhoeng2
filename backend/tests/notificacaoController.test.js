//Testes unitários para o controlador de notificações, garantindo que as funções de listagem, marcação como lida 
// e publicação funcionem corretamente e lidem com erros de forma apropriada.
jest.mock('../src/services/notificacaoService', () => ({
    listarPorUsuario: jest.fn(),
    marcarComoLida: jest.fn(),
    publicar: jest.fn()
}));

const notificacaoService = require('../src/services/notificacaoService');
const notificacaoController = require('../src/controllers/notificacaoController');

let consoleErrorSpy;

beforeEach(() => {
    jest.resetAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    consoleErrorSpy.mockRestore();
});

function criarResponse() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    };
}

describe('notificacaoController', () => {
    it('deve listar as notificações do usuário autenticado', async () => {
        const req = { usuario: { id: 2 } };
        const res = criarResponse();
        const notificacoes = [{ id: 1, titulo: 'Aviso de teste' }];

        notificacaoService.listarPorUsuario.mockResolvedValue(notificacoes);

        await notificacaoController.listar(req, res);

        expect(notificacaoService.listarPorUsuario).toHaveBeenCalledWith(2);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(notificacoes);
    });

    it('deve retornar erro 500 se a listagem falhar', async () => {
        const req = { usuario: { id: 2 } };
        const res = criarResponse();

        notificacaoService.listarPorUsuario.mockRejectedValue(
            new Error('Erro simulado')
        );

        await notificacaoController.listar(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('deve rejeitar ID inválido ao marcar como lida', async () => {
        const req = {
            params: { id: 'abc' },
            usuario: { id: 2 }
        };
        const res = criarResponse();

        await notificacaoController.marcarComoLida(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(notificacaoService.marcarComoLida).not.toHaveBeenCalled();
    });

    it('deve marcar uma notificação como lida', async () => {
        const req = {
            params: { id: '7' },
            usuario: { id: 2 }
        };
        const res = criarResponse();

        notificacaoService.marcarComoLida.mockResolvedValue(true);

        await notificacaoController.marcarComoLida(req, res);

        expect(notificacaoService.marcarComoLida).toHaveBeenCalledWith(7, 2);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deve retornar 404 quando a notificação não for encontrada ou já estiver lida', async () => {
        const req = {
            params: { id: '7' },
            usuario: { id: 2 }
        };
        const res = criarResponse();

        notificacaoService.marcarComoLida.mockResolvedValue(false);

        await notificacaoController.marcarComoLida(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('deve publicar uma notificação e retornar 201', async () => {
        const req = {
            body: {
                titulo: 'Aviso de teste',
                mensagem: 'Mensagem de teste',
                tipo: 'AVISO',
                escopo: 'PLATAFORMA'
            },
            usuario: { id: 1, perfil: 'ADMIN' }
        };
        const res = criarResponse();
        const notificacao = { id: 10, titulo: 'Aviso de teste' };

        notificacaoService.publicar.mockResolvedValue(notificacao);

        await notificacaoController.publicar(req, res);

        expect(notificacaoService.publicar).toHaveBeenCalledWith(
            req.body,
            req.usuario
        );
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(notificacao);
    });

    it('deve retornar o status de erro informado pelo serviço', async () => {
        const req = {
            body: {},
            usuario: { id: 2, perfil: 'MORADOR' }
        };
        const res = criarResponse();
        const erro = new Error('Sem permissão');
        erro.status = 403;

        notificacaoService.publicar.mockRejectedValue(erro);

        await notificacaoController.publicar(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            mensagem: 'Sem permissão'
        });
    });
});
