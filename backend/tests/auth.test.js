//Teste para o auth do middleware

const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken', () => ({
    verify: jest.fn()
}));

const {
    verificarToken,
    verificarSindico,
    verificarMorador,
    verificarAdmin,
    verificarCondominioMorador,
    verificarCondominioSindico
} = require('../src/middleware/auth');

describe('Middleware de autenticação e autorização', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            headers: {},
            params: {},
            usuario: undefined
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        next = jest.fn();
    });

    describe('verificarToken', () => {
        it('deve rejeitar requisições sem token', () => {
            verificarToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                mensagem: 'Token não fornecido'
            });
            expect(next).not.toHaveBeenCalled();
            expect(jwt.verify).not.toHaveBeenCalled();
        });

        it('deve rejeitar um cabeçalho com formato inválido', () => {
            req.headers.authorization = 'Token abc123';

            verificarToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                mensagem: 'Formato de token inválido.'
            });
            expect(next).not.toHaveBeenCalled();
            expect(jwt.verify).not.toHaveBeenCalled();
        });

        it('deve rejeitar um cabeçalho com partes demais', () => {
            req.headers.authorization = 'Bearer abc123 extra';

            verificarToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                mensagem: 'Formato de token inválido.'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('deve aceitar um token válido e adicionar o payload à requisição', () => {
            const payload = {
                id: 10,
                perfil: 'MORADOR',
                id_condominio: 5
            };

            req.headers.authorization = 'Bearer token-valido';
            jwt.verify.mockReturnValue(payload);

            verificarToken(req, res, next);

            expect(jwt.verify).toHaveBeenCalledWith(
                'token-valido',
                process.env.JWT_SECRET
            );
            expect(req.usuario).toBe(payload);
            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });

        it('deve rejeitar um token inválido ou expirado', () => {
            req.headers.authorization = 'Bearer token-invalido';
            jwt.verify.mockImplementation(() => {
                throw new Error('Token inválido');
            });

            verificarToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                mensagem: 'Token inválido ou expirado'
            });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('verificarSindico', () => {
        it('deve permitir o acesso de um síndico', () => {
            req.usuario = { perfil: 'SINDICO' };

            verificarSindico(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
        });

        it('deve permitir o acesso de um administrador', () => {
            req.usuario = { perfil: 'ADMIN' };

            verificarSindico(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
        });

        it('deve negar o acesso de um morador', () => {
            req.usuario = { perfil: 'MORADOR' };

            verificarSindico(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                mensagem: 'Acesso negado. Apenas síndicos podem fazer isso.'
            });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('verificarMorador', () => {
        it('deve permitir o acesso de um morador', () => {
            req.usuario = { perfil: 'MORADOR' };

            verificarMorador(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
        });

        it('deve negar o acesso de um síndico', () => {
            req.usuario = { perfil: 'SINDICO' };

            verificarMorador(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                mensagem: 'Acesso negado. Apenas moradores podem fazer isso.'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('deve negar o acesso de um administrador', () => {
            req.usuario = { perfil: 'ADMIN' };

            verificarMorador(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('verificarCondominioMorador', () => {
        beforeEach(() => {
            req.params.idCondominio = '5';
        });

        it('deve permitir o acesso de um administrador a qualquer condomínio', () => {
            req.usuario = {
                perfil: 'ADMIN',
                id_condominio: null
            };

            verificarCondominioMorador(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
        });

        it('deve permitir o acesso do morador ao próprio condomínio', () => {
            req.usuario = {
                perfil: 'MORADOR',
                id_condominio: 5
            };

            verificarCondominioMorador(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
        });

        it('deve negar o acesso do morador a outro condomínio', () => {
            req.usuario = {
                perfil: 'MORADOR',
                id_condominio: 8
            };

            verificarCondominioMorador(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                mensagem: 'Acesso negado. Você só pode acessar o seu próprio condomínio.'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('deve negar o acesso do síndico por esta regra de autorização', () => {
            req.usuario = {
                perfil: 'SINDICO',
                id_condominio: 5
            };

            verificarCondominioMorador(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });

        it('deve negar o acesso quando o identificador da rota não corresponde', () => {
            req.params.idCondominio = 'abc';
            req.usuario = {
                perfil: 'MORADOR',
                id_condominio: 5
            };

            verificarCondominioMorador(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('verificarCondominioSindico', () => {
        beforeEach(() => {
            req.params.idCondominio = '5';
        });

        it('deve permitir o acesso de um administrador a qualquer condomínio', () => {
            req.usuario = {
                perfil: 'ADMIN',
                id_condominio: null
            };

            verificarCondominioSindico(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
        });

        it('deve permitir o acesso do síndico ao próprio condomínio', () => {
            req.usuario = {
                perfil: 'SINDICO',
                id_condominio: 5
            };

            verificarCondominioSindico(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
        });

        it('deve negar o acesso do síndico a outro condomínio', () => {
            req.usuario = {
                perfil: 'SINDICO',
                id_condominio: 8
            };

            verificarCondominioSindico(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                mensagem: 'Acesso negado. Somente o sindico desse condominio consegue realizar essa ação'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('deve negar o acesso do morador', () => {
            req.usuario = {
                perfil: 'MORADOR',
                id_condominio: 5
            };

            verificarCondominioSindico(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('verificarAdmin', () => {
        it('deve permitir o acesso do administrador', () => {
            req.usuario = { perfil: 'ADMIN' };

            verificarAdmin(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
        });

        it('deve negar o acesso do síndico', () => {
            req.usuario = { perfil: 'SINDICO' };

            verificarAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                mensagem: 'Acesso negado: Requer privilégios de administrador geral.'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('deve negar o acesso do morador', () => {
            req.usuario = { perfil: 'MORADOR' };

            verificarAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });
    });
});