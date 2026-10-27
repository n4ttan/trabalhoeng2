//Teste para o repositório de mensagens
const connection = require('../src/repositories/database');
const mensagemRepository = require('../src/repositories/mensagemRepository');

jest.mock('../src/repositories/database', () => ({
    query: jest.fn()
}));

describe('mensagemRepository - buscarMensagem', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('deve retornar a primeira mensagem encontrada', async () => {
        const mensagens = [
            { id: 1, mensagem: 'Mensagem de teste' },
            { id: 2, mensagem: 'Outra mensagem' }
        ];

        connection.query.mockImplementation((sql, callback) => {
            callback(null, mensagens);
        });

        const resultado = await mensagemRepository.buscarMensagem();

        expect(connection.query).toHaveBeenCalledWith(
            'SELECT * FROM mensagens LIMIT 1',
            expect.any(Function)
        );
        expect(resultado).toEqual(mensagens[0]);
    });

    it('deve rejeitar a Promise quando a consulta falhar', async () => {
        const erro = new Error('Falha na consulta');

        connection.query.mockImplementation((sql, callback) => {
            callback(erro, null);
        });

        await expect(
            mensagemRepository.buscarMensagem()
        ).rejects.toBe(erro);

        expect(connection.query).toHaveBeenCalledTimes(1);
    });

    it('deve retornar undefined quando nenhuma mensagem for encontrada', async () => {
        connection.query.mockImplementation((sql, callback) => {
            callback(null, []);
        });

        const resultado = await mensagemRepository.buscarMensagem();

        expect(resultado).toBeUndefined();
    });
});