jest.mock('../src/repositories/pedidoSindicoRepository', () => ({
    criarPedidoSindico: jest.fn(),
    aprovarPedidoSindico: jest.fn(),
}));

const pedidoSindicoRepository = require('../src/repositories/pedidoSindicoRepository');
const pedidoSindicoService = require('../src/services/pedidoSindicoService');

beforeEach(() => {
    jest.resetAllMocks();
});

describe('criarPedidoSindico', () => {
    it('deve criar um pedido de cadastro de síndico', async () => {
        pedidoSindicoRepository.criarPedidoSindico.mockResolvedValue(1);

        const resultado =
            await pedidoSindicoService.criarPedidoSindico(1);

        expect(
            pedidoSindicoRepository.criarPedidoSindico
        ).toHaveBeenCalledWith(1);

        expect(resultado).toBe(1);
    });
});

describe('aprovarPedidoSindico', () => {
    it('deve aprovar o pedido de cadastro de síndico', async () => {
        pedidoSindicoRepository.aprovarPedidoSindico.mockResolvedValue(true);

        const resultado =
            await pedidoSindicoService.aprovarPedidoSindico(1);

        expect(
            pedidoSindicoRepository.aprovarPedidoSindico
        ).toHaveBeenCalledWith(1);

        expect(resultado).toBe(true);
    });

    it('deve retornar false quando o pedido não puder ser aprovado', async () => {
        pedidoSindicoRepository.aprovarPedidoSindico.mockResolvedValue(false);

        const resultado =
            await pedidoSindicoService.aprovarPedidoSindico(1);

        expect(
            pedidoSindicoRepository.aprovarPedidoSindico
        ).toHaveBeenCalledWith(1);

        expect(resultado).toBe(false);
    });
});