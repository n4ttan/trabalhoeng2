const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const connection = require('../src/repositories/database'); // Ajuste o caminho se necessário
const authController = require('../src/controllers/authController'); // Ajuste o caminho se necessário

// 1. Criando os dublês para as bibliotecas e para o banco de dados
jest.mock('jsonwebtoken');
jest.mock('bcrypt');
jest.mock('../src/repositories/database', () => ({
    promise: jest.fn().mockReturnThis(),
    query: jest.fn()
}));

describe('authController - login', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        // Simulando a requisição (req) do Express
        req = {
            body: {
                email: 'teste@email.com',
                senha: 'senha-super-secreta'
            }
        };

        // Simulando a resposta (res) do Express
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    it('deve realizar login com sucesso e retornar o token', async () => {
        // Simula o banco de dados retornando um array com um usuário
        connection.query.mockResolvedValue([
            [{ id: 1, perfil: 'MORADOR', senha: 'hash-do-banco' }]
        ]);
        
        // Simula o bcrypt validando a senha como correta
        bcrypt.compare.mockResolvedValue(true);
        
        // Simula o JWT gerando o token
        jwt.sign.mockReturnValue('token-fake-123');

        await authController.login(req, res);

        // Verifica se a query no banco foi feita com o e-mail certo
        expect(connection.query).toHaveBeenCalledWith(
            'SELECT * FROM usuarios WHERE email = ?',
            ['teste@email.com']
        );
        
        // Verifica se retornou 200 e o JSON com o token
        expect(res.json).toHaveBeenCalledWith({
            mensagem: 'Login realizado com sucesso!',
            token: 'token-fake-123'
        });
    });

    it('deve retornar erro 401 se o usuário não for encontrado no banco', async () => {
        // Simula o banco de dados retornando vazio (usuário não existe)
        connection.query.mockResolvedValue([[]]);

        await authController.login(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
expect(res.json).toHaveBeenCalledWith({ mensagem: 'E-mail incorreto' });});

    it('deve retornar erro 401 se a senha for inválida', async () => {
        // Simula o banco retornando o usuário...
        connection.query.mockResolvedValue([
            [{ id: 1, perfil: 'MORADOR', senha: 'hash-do-banco' }]
        ]);
        
        // ...mas o bcrypt diz que a senha digitada está errada!
        bcrypt.compare.mockResolvedValue(false);

        await authController.login(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
expect(res.json).toHaveBeenCalledWith({ mensagem: 'Senha incorreta' });});

    it('deve retornar erro 500 se ocorrer um problema no banco de dados', async () => {
        // Simula o banco de dados "caindo" ou dando erro de SQL
        connection.query.mockRejectedValue(new Error('Falha de conexão com o banco'));

        await authController.login(req, res);

        // Verifica se caiu no bloco catch e devolveu 500
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ mensagem: 'Erro interno no servidor' });
    });
});