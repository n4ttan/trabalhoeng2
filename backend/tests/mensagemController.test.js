//Testes para o controller de mensagens
const mensagemService = require('../src/services/mensagemService');
const mensagemController = require('../src/controllers/mensagemController');

jest.mock('../src/services/mensagemService', () => ({
    obterMensagem: jest.fn()
}));

describe('mensagemController - obterMensagem', () => {
    let req;
    let res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {};

        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };

        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('deve retornar a mensagem quando o serviço executa com sucesso', async () => {
        const mensagemEsperada = {
            mensagem: 'Olá, mundo!'
        };

        mensagemService.obterMensagem.mockResolvedValue(mensagemEsperada);

        await mensagemController.obterMensagem(req, res);

        expect(mensagemService.obterMensagem).toHaveBeenCalledTimes(1);
        expect(res.json).toHaveBeenCalledWith(mensagemEsperada);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('deve retornar erro 500 quando o serviço falha', async () => {
        const erro = new Error('Falha ao consultar mensagem');

        mensagemService.obterMensagem.mockRejectedValue(erro);

        await mensagemController.obterMensagem(req, res);

        expect(mensagemService.obterMensagem).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalledWith(
            'Erro ao buscar mensagem:',
            erro
        );
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            erro: 'Erro ao buscar mensagem'
        });
    });
});