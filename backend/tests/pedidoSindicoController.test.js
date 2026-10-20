jest.mock('../src/services/pedidoSindicoService', () => ({
    criarPedidoSindico: jest.fn(),
    aprovarPedidoSindico: jest.fn(),
    reprovarPedidoSindico: jest.fn(),
}));

const pedidoSindicoService = require('../src/services/pedidoSindicoService');
const pedidoSindicoController = require('../src/controllers/pedidoSindicoController');

let consoleErrorSpy;

beforeEach(() => {
    jest.resetAllMocks();

    consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
});

afterEach(() => {
    consoleErrorSpy.mockRestore();
});

describe('criarPedidoSindico', () => {
    it('deve criar um pedido de cadastro de síndico', async () => {
        const req = {
            usuario: {
                id: 1
            },
            body: {
                condominioId: 2
            }
        };

        const res = {
            status: jest.fn(),
            json: jest.fn()
        };

        res.status.mockReturnValue(res);

        pedidoSindicoService.criarPedidoSindico.mockResolvedValue(10);

        await pedidoSindicoController.criarPedidoSindico(req, res);

        expect(
            pedidoSindicoService.criarPedidoSindico
        ).toHaveBeenCalledWith(1, 2);

        expect(res.status)
            .toHaveBeenCalledWith(201);

        expect(res.json)
            .toHaveBeenCalledWith({
                mensagem: 'Pedido de cadastro de síndico criado com sucesso',
                pedidoId: 10
            });
    });

    it('deve retornar 400 se condominioId não for fornecido', async () => {
        const req = {
            usuario: {
                id: 1
            },
            body: {}
        };

        const res = {
            status: jest.fn(),
            json: jest.fn()
        };

        res.status.mockReturnValue(res);

        await pedidoSindicoController.criarPedidoSindico(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            erro: 'O ID do condomínio é obrigatório.'
        });
    });

    it('deve retornar erro 500 quando ocorrer um erro ao criar o pedido', async () => {
        const req = {
            usuario: {
                id: 1
            },
            body: {
                condominioId: 2
            }
        };

        const res = {
            status: jest.fn(),
            json: jest.fn()
        };

        res.status.mockReturnValue(res);

        pedidoSindicoService.criarPedidoSindico
            .mockRejectedValue(new Error('Erro de teste'));

        await pedidoSindicoController.criarPedidoSindico(req, res);

        expect(res.status)
            .toHaveBeenCalledWith(500);

        expect(res.json)
            .toHaveBeenCalledWith({
                erro: 'Erro ao criar pedido de síndico'
            });
    });
});

describe('aprovarPedidoSindico', () => {
    it('deve aprovar o pedido de cadastro de síndico', async () => {
        const req = {
            params: {
                pedidoId: 10
            }
        };

        const res = {
            status: jest.fn(),
            json: jest.fn()
        };

        res.status.mockReturnValue(res);

        pedidoSindicoService.aprovarPedidoSindico
            .mockResolvedValue(true);

        await pedidoSindicoController.aprovarPedidoSindico(req, res);

        expect(
            pedidoSindicoService.aprovarPedidoSindico
        ).toHaveBeenCalledWith(10);

        expect(res.json)
            .toHaveBeenCalledWith({
                mensagem: 'Pedido aprovado e usuário promovido a síndico'
            });
    });

    it('deve retornar erro 404 quando o pedido não puder ser aprovado', async () => {
        const req = {
            params: {
                pedidoId: 10
            }
        };

        const res = {
            status: jest.fn(),
            json: jest.fn()
        };

        res.status.mockReturnValue(res);

        pedidoSindicoService.aprovarPedidoSindico
            .mockResolvedValue(false);

        await pedidoSindicoController.aprovarPedidoSindico(req, res);

        expect(res.status)
            .toHaveBeenCalledWith(404);

        expect(res.json)
            .toHaveBeenCalledWith({
                erro: 'Pedido não encontrado ou não está pendente'
            });
    });

    it('deve retornar erro 500 quando ocorrer um erro ao aprovar o pedido', async () => {
        const req = {
            params: {
                pedidoId: 10
            }
        };

        const res = {
            status: jest.fn(),
            json: jest.fn()
        };

        res.status.mockReturnValue(res);

        pedidoSindicoService.aprovarPedidoSindico
            .mockRejectedValue(new Error('Erro de teste'));

        await pedidoSindicoController.aprovarPedidoSindico(req, res);

        expect(res.status)
            .toHaveBeenCalledWith(500);

        expect(res.json)
            .toHaveBeenCalledWith({
                erro: 'Erro ao aprovar pedido de síndico'
            });
    });
});

describe('reprovarPedidoSindico', () => {
    it('deve reprovar o pedido de cadastro de síndico', async () => {
        const req = {
            params: {
                pedidoId: 10
            }
        };

        const res = {
            status: jest.fn(),
            json: jest.fn()
        };

        res.status.mockReturnValue(res);

        pedidoSindicoService.reprovarPedidoSindico
            .mockResolvedValue(true);

        await pedidoSindicoController.reprovarPedidoSindico(req, res);

        expect(
            pedidoSindicoService.reprovarPedidoSindico
        ).toHaveBeenCalledWith(10);

        expect(res.json)
            .toHaveBeenCalledWith({
                mensagem: 'Pedido de síndico reprovado com sucesso'
            });
    });

    it('deve retornar erro 404 quando o pedido não for encontrado ao reprovar', async () => {
        const req = {
            params: {
                pedidoId: 10
            }
        };

        const res = {
            status: jest.fn(),
            json: jest.fn()
        };

        res.status.mockReturnValue(res);

        pedidoSindicoService.reprovarPedidoSindico
            .mockResolvedValue(false);

        await pedidoSindicoController.reprovarPedidoSindico(req, res);

        expect(res.status)
            .toHaveBeenCalledWith(404);

        expect(res.json)
            .toHaveBeenCalledWith({
                erro: 'Pedido não encontrado'
            });
    });

    it('deve retornar erro 500 quando ocorrer um erro ao reprovar o pedido', async () => {
        const req = {
            params: {
                pedidoId: 10
            }
        };

        const res = {
            status: jest.fn(),
            json: jest.fn()
        };

        res.status.mockReturnValue(res);

        pedidoSindicoService.reprovarPedidoSindico
            .mockRejectedValue(new Error('Erro de teste'));

        await pedidoSindicoController.reprovarPedidoSindico(req, res);

        expect(res.status)
            .toHaveBeenCalledWith(500);

        expect(res.json)
            .toHaveBeenCalledWith({
                erro: 'Erro ao reprovar pedido de síndico'
            });
    });
});
