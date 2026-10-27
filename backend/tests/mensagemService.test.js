jest.mock('../src/repositories/mensagemRepository', () => ({
    buscarMensagem: jest.fn()
}));

const mensagemRepository = require('../src/repositories/mensagemRepository');
const mensagemService = require('../src/services/mensagemService');

describe('mensagemService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('obterMensagem', () => {
        it('deve retornar a mensagem obtida do repositório', () => {
            const mensagem = { texto: 'Mensagem de teste' };

            mensagemRepository.buscarMensagem.mockReturnValue(mensagem);

            const resultado = mensagemService.obterMensagem();

            expect(mensagemRepository.buscarMensagem).toHaveBeenCalledTimes(1);
            expect(resultado).toBe(mensagem);
        });

        it('deve retornar undefined quando o repositório retornar undefined', () => {
            mensagemRepository.buscarMensagem.mockReturnValue(undefined);

            const resultado = mensagemService.obterMensagem();

            expect(mensagemRepository.buscarMensagem).toHaveBeenCalledTimes(1);
            expect(resultado).toBeUndefined();
        });

        it('deve propagar o erro lançado pelo repositório', () => {
            const erro = new Error('Erro ao buscar mensagem');

            mensagemRepository.buscarMensagem.mockImplementation(() => {
                throw erro;
            });

            expect(() => mensagemService.obterMensagem()).toThrow(erro);
            expect(mensagemRepository.buscarMensagem).toHaveBeenCalledTimes(1);
        });
    });
});