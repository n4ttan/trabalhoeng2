const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const connection = require('../src/repositories/database');
const authController = require('../src/controllers/authController');

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

        req = {
            body: {
                email: 'teste@email.com',
                senha: 'senha-super-secreta'
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    it('deve realizar login com sucesso e retornar o token', async () => {
        connection.query.mockResolvedValue([
            [{
                id: 1,
                perfil: 'MORADOR',
                senha: 'hash-do-banco',
                status_cadastro: 'APROVADO'
            }]
        ]);

        bcrypt.compare.mockResolvedValue(true);
        jwt.sign.mockReturnValue('token-fake-123');

        await authController.login(req, res);

        expect(connection.query).toHaveBeenCalledWith(
            'SELECT * FROM usuarios WHERE email = ?',
            ['teste@email.com']
        );

        expect(res.json).toHaveBeenCalledWith({
            mensagem: 'Login realizado com sucesso!',
            token: 'token-fake-123'
        });
    });

    it('deve retornar erro 401 se o usuário não for encontrado no banco', async () => {
        connection.query.mockResolvedValue([[]]);

        await authController.login(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            mensagem: 'E-mail incorreto'
        });
    });

    it('deve retornar erro 401 se a senha for inválida', async () => {
        connection.query.mockResolvedValue([
            [{
                id: 1,
                perfil: 'MORADOR',
                senha: 'hash-do-banco',
                status_cadastro: 'APROVADO'
            }]
        ]);

        bcrypt.compare.mockResolvedValue(false);

        await authController.login(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            mensagem: 'Senha incorreta'
        });
    });

    it('deve retornar erro 500 se ocorrer um problema no banco de dados', async () => {
        connection.query.mockRejectedValue(
            new Error('Falha de conexão com o banco')
        );

        await authController.login(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            mensagem: 'Erro interno no servidor'
        });
    });
});