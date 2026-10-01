describe('Teste de Conexão com o Banco de Dados (database.js)', () => {
    let consoleErrorSpy;
    let consoleLogSpy;

    beforeEach(() => {

        jest.resetModules(); 
        
        // Espiões para ler o que o seu arquivo vai imprimir no terminal
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
        consoleLogSpy.mockRestore();
    });

    it('deve cair no if(error) e chamar o console.error quando a conexão falhar', () => {

        jest.mock('mysql2', () => ({
            createConnection: jest.fn().mockReturnValue({
                connect: jest.fn((callback) => {

                    callback(new Error('Falha de conexão simulada (Acesso negado)'));
                })
            })
        }));

        require('../src/repositories/database'); 
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Erro ao conectar ao MySQL:', 
            expect.any(Error)
        );
        
    });
});