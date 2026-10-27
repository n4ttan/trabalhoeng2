jest.mock('../src/repositories/pedidoSindicoRepository', () => ({
    criarPedidoSindico: jest.fn(),
    aprovarPedidoSindico: jest.fn(),
    reprovarPedidoSindico: jest.fn()
}));

const pedidoSindicoRepository = require('../src/repositories/pedidoSindicoRepository');
const pedidoSindicoService = require('../src/services/pedidoSindicoService');

beforeEach(() => {
    jest.resetAllMocks();
});

describe('criarPedidoSindico', () => {
    it('deve criar um pedido de cadastro de síndico com usuário e condomínio', async () => {
        pedidoSindicoRepository.criarPedidoSindico.mockResolvedValue(1);

        const resultado = await pedidoSindicoService.criarPedidoSindico(1, 2);

        expect(pedidoSindicoRepository.criarPedidoSindico).toHaveBeenCalledWith(1, 2);
        expect(resultado).toBe(1);
    });

    it('deve propagar erros do repositório', async () => {
        pedidoSindicoRepository.criarPedidoSindico.mockRejectedValue(
            new Error('Erro ao criar pedido')
        );

        await expect(
            pedidoSindicoService.criarPedidoSindico(1, 2)
        ).rejects.toThrow('Erro ao criar pedido');
    });
});

describe('aprovarPedidoSindico', () => {
    it('deve aprovar o pedido de cadastro de síndico', async () => {
        pedidoSindicoRepository.aprovarPedidoSindico.mockResolvedValue(true);

        const resultado = await pedidoSindicoService.aprovarPedidoSindico(1);

        expect(pedidoSindicoRepository.aprovarPedidoSindico).toHaveBeenCalledWith(1);
        expect(resultado).toBe(true);
    });

    it('deve retornar false quando o pedido não puder ser aprovado', async () => {
        pedidoSindicoRepository.aprovarPedidoSindico.mockResolvedValue(false);

        const resultado = await pedidoSindicoService.aprovarPedidoSindico(1);

        expect(pedidoSindicoRepository.aprovarPedidoSindico).toHaveBeenCalledWith(1);
        expect(resultado).toBe(false);
    });

    it('deve propagar erros do repositório', async () => {
        pedidoSindicoRepository.aprovarPedidoSindico.mockRejectedValue(
            new Error('Erro ao aprovar pedido')
        );

        await expect(
            pedidoSindicoService.aprovarPedidoSindico(1)
        ).rejects.toThrow('Erro ao aprovar pedido');
    });
});

describe('reprovarPedidoSindico', () => {
    it('deve reprovar o pedido de cadastro de síndico', async () => {
        pedidoSindicoRepository.reprovarPedidoSindico.mockResolvedValue(true);

        const resultado = await pedidoSindicoService.reprovarPedidoSindico(1);

        expect(pedidoSindicoRepository.reprovarPedidoSindico).toHaveBeenCalledWith(1);
        expect(resultado).toBe(true);
    });

    it('deve retornar false quando o pedido não puder ser reprovado', async () => {
        pedidoSindicoRepository.reprovarPedidoSindico.mockResolvedValue(false);

        const resultado = await pedidoSindicoService.reprovarPedidoSindico(1);

        expect(pedidoSindicoRepository.reprovarPedidoSindico).toHaveBeenCalledWith(1);
        expect(resultado).toBe(false);
    });

    it('deve propagar erros do repositório', async () => {
        pedidoSindicoRepository.reprovarPedidoSindico.mockRejectedValue(
            new Error('Erro ao reprovar pedido')
        );

        await expect(
            pedidoSindicoService.reprovarPedidoSindico(1)
        ).rejects.toThrow('Erro ao reprovar pedido');
    });
});