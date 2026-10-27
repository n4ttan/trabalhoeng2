const { setIO, getIO } = require('../src/socket');

describe('Gerenciamento da instância do Socket.IO', () => {
    beforeEach(() => {
        // Reseta a instância para evitar dependência entre os testes.
        setIO(null);
    });

    it('deve retornar null quando nenhuma instância foi registrada', () => {
        expect(getIO()).toBeNull();
    });

    it('deve registrar uma instância do Socket.IO', () => {
        const ioMock = {};

        setIO(ioMock);

        expect(getIO()).toBe(ioMock);
    });

    it('deve retornar a mesma instância registrada', () => {
        const ioMock = {
            emit: jest.fn(),
            to: jest.fn()
        };

        setIO(ioMock);

        expect(getIO()).toBe(ioMock);
        expect(getIO()).toBe(getIO());
    });

    it('deve substituir a instância anterior quando outra for registrada', () => {
        const primeiraInstancia = {};
        const segundaInstancia = {};

        setIO(primeiraInstancia);
        setIO(segundaInstancia);

        expect(getIO()).toBe(segundaInstancia);
        expect(getIO()).not.toBe(primeiraInstancia);
    });
});