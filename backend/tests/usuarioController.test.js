jest.mock('../src/services/usuarioService', () => ({
    criarUsuario: jest.fn(),
    criarMorador: jest.fn(),
    gerarESalvarTokenValidacao: jest.fn(),
    excluirUsuarioEPedido: jest.fn(),
    validarEmail: jest.fn(),
    reenviarCodigo: jest.fn(),
    listarPendentes: jest.fn(),
    aprovarMorador: jest.fn(),
    rejeitarMorador: jest.fn(),
}));

jest.mock('../src/services/emailService', () => ({
    sendVerificationCode: jest.fn(),
}));

const usuarioService = require('../src/services/usuarioService');
const { sendVerificationCode } = require('../src/services/emailService');
const usuarioController = require('../src/controllers/usuarioController');

let consoleErrorSpy;

beforeEach(() => {
    jest.resetAllMocks();

    consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
});

afterEach(() => {
    consoleErrorSpy.mockRestore();
});

describe('criarUsuario', () => {
    it('deve criar um usuário com sucesso', async () => {
        const req = {
            body: {
                nome: 'João da Silva',
                email: 'joao@email.com',
                senha: '123456',
                perfil: 'CANDIDATO'
            }
        };

        const res = {
            status: jest.fn(),
            json: jest.fn()
        };

        res.status.mockReturnValue(res);

        usuarioService.criarUsuario.mockResolvedValue(1);

        await usuarioController.criarUsuario(req, res);

        expect(usuarioService.criarUsuario)
            .toHaveBeenCalledWith(
                'João da Silva',
                'joao@email.com',
                '123456',
                'CANDIDATO'
            );

        expect(res.status).toHaveBeenCalledWith(201);

        expect(res.json).toHaveBeenCalledWith({
            mensagem: 'Usuário criado com sucesso. Verifique seu e-mail para validar o cadastro.',
            usuarioId: 1
        });
    });

    it('deve retornar 400 quando o perfil for inválido', async () => {
        const req = {
            body: {
                nome: 'João',
                email: 'joao@email.com',
                senha: '123456',
                perfil: 'INVALIDO'
            }
        };

        const res = {
            status: jest.fn(),
            json: jest.fn()
        };

        res.status.mockReturnValue(res);

        const error = new Error('Perfil inválido.');
        error.codigo = 'PERFIL_INVALIDO';

        usuarioService.criarUsuario.mockRejectedValue(error);

        await usuarioController.criarUsuario(req, res);

        expect(res.status).toHaveBeenCalledWith(400);

        expect(res.json).toHaveBeenCalledWith({
            erro: 'Perfil inválido.'
        });
    });

    it('deve retornar 409 quando o e-mail já estiver cadastrado', async () => {
        const req = {
            body: {
                nome: 'João',
                email: 'joao@email.com',
                senha: '123456',
                perfil: 'CANDIDATO'
            }
        };

        const res = {
            status: jest.fn(),
            json: jest.fn()
        };

        res.status.mockReturnValue(res);

        const error = new Error('Duplicate entry');
        error.code = 'ER_DUP_ENTRY';

        usuarioService.criarUsuario.mockRejectedValue(error);

        await usuarioController.criarUsuario(req, res);

        expect(res.status).toHaveBeenCalledWith(409);

        expect(res.json).toHaveBeenCalledWith({
            erro: 'E-mail já cadastrado'
        });
    });

    it('deve retornar 500 para erro inesperado', async () => {
        const req = {
            body: {
                nome: 'João',
                email: 'joao@email.com',
                senha: '123456',
                perfil: 'CANDIDATO'
            }
        };

        const res = {
            status: jest.fn(),
            json: jest.fn()
        };

        res.status.mockReturnValue(res);

        usuarioService.criarUsuario.mockRejectedValue(
            new Error('Erro inesperado')
        );

        await usuarioController.criarUsuario(req, res);

        expect(res.status).toHaveBeenCalledWith(500);

        expect(res.json).toHaveBeenCalledWith({
            erro: 'Erro ao criar usuário'
        });
    });
});

describe('criarMorador', () => {
    it('deve criar um morador e enviar o código de validação', async () => {
        const req = {
            body: {
                nome: 'Maria',
                email: 'maria@email.com',
                senha: '123456',
                unidade: '101'
            }
        };

        const res = {
            status: jest.fn(),
            json: jest.fn()
        };

        res.status.mockReturnValue(res);

        usuarioService.criarMorador.mockResolvedValue({
            usuarioId: 2,
            email: 'maria@email.com'
        });

        usuarioService.gerarESalvarTokenValidacao
            .mockResolvedValue('123456');

        sendVerificationCode.mockResolvedValue();

        await usuarioController.criarMorador(req, res);

        expect(usuarioService.criarMorador)
            .toHaveBeenCalledWith(
                'Maria',
                'maria@email.com',
                '123456',
                '101'
            );

        expect(usuarioService.gerarESalvarTokenValidacao)
            .toHaveBeenCalledWith(2);

        expect(sendVerificationCode)
            .toHaveBeenCalledWith('maria@email.com', '123456');

        expect(res.status).toHaveBeenCalledWith(201);

        expect(res.json).toHaveBeenCalledWith({
            mensagem: 'Usuário criado com sucesso. Verifique seu e-mail para validar o cadastro.',
            usuarioId: 2
        });
    });

    it('deve criar o morador mesmo quando o envio do e-mail falhar', async () => {
        const req = {
            body: {
                nome: 'Maria',
                email: 'maria@email.com',
                senha: '123456',
                unidade: '101'
            }
        };

        const res = {
            status: jest.fn(),
            json: jest.fn()
        };

        res.status.mockReturnValue(res);

        usuarioService.criarMorador.mockResolvedValue({
            usuarioId: 2,
            email: 'maria@email.com'
        });

        usuarioService.gerarESalvarTokenValidacao
            .mockResolvedValue('123456');

        sendVerificationCode.mockRejectedValue(
            new Error('Falha no e-mail')
        );

        await usuarioController.criarMorador(req, res);

        expect(res.status).toHaveBeenCalledWith(201);

        expect(res.json).toHaveBeenCalledWith({
            mensagem: 'Usuário criado com sucesso. Verifique seu e-mail para validar o cadastro.',
            usuarioId: 2
        });
    });

    it('deve retornar 409 quando o e-mail já estiver cadastrado', async () => {
        const req = {
            body: {
                nome: 'Maria',
                email: 'maria@email.com',
                senha: '123456',
                unidade: '101'
            }
        };

        const res = {
            status: jest.fn(),
            json: jest.fn()
        };

        res.status.mockReturnValue(res);

        const error = new Error('Duplicate entry');
        error.code = 'ER_DUP_ENTRY';

        usuarioService.criarMorador.mockRejectedValue(error);

        await usuarioController.criarMorador(req, res);

        expect(res.status).toHaveBeenCalledWith(409);

        expect(res.json).toHaveBeenCalledWith({
            erro: 'E-mail já cadastrado'
        });
    });

    it('deve retornar erro de negócio quando o cadastro falhar com status', async () => {
        const req = {
            body: {
                nome: 'Maria',
                email: 'email-invalido',
                senha: '123456',
                unidade: '101'
            }
        };

        const res = {
            status: jest.fn(),
            json: jest.fn()
        };

        res.status.mockReturnValue(res);

        const error = new Error('Informe um e-mail válido.');
        error.status = 400;
        error.codigo = 'EMAIL_INVALIDO';

        usuarioService.criarMorador.mockRejectedValue(error);

        await usuarioController.criarMorador(req, res);

        expect(res.status).toHaveBeenCalledWith(400);

        expect(res.json).toHaveBeenCalledWith({
            erro: 'Informe um e-mail válido.',
            codigo: 'EMAIL_INVALIDO'
        });
    });

    it('deve retornar 500 para erro inesperado no cadastro de morador', async () => {
        const req = {
            body: {
                nome: 'Maria',
                email: 'maria@email.com',
                senha: '123456',
                unidade: '101'
            }
        };

        const res = {
            status: jest.fn(),
            json: jest.fn()
        };

        res.status.mockReturnValue(res);

        usuarioService.criarMorador.mockRejectedValue(
            new Error('Erro inesperado')
        );

        await usuarioController.criarMorador(req, res);

        expect(res.status).toHaveBeenCalledWith(500);

        expect(res.json).toHaveBeenCalledWith({
            erro: 'Erro ao criar morador'
        });
    });
});

describe('excluirUsuarioEPedido', () => {
    it('deve excluir o usuário e seus pedidos', async () => {
        const req = {
            params: {
                usuarioId: 1
            }
        };

        const res = {
            status: jest.fn(),
            json: jest.fn()
        };

        res.status.mockReturnValue(res);

        usuarioService.excluirUsuarioEPedido.mockResolvedValue(1);

        await usuarioController.excluirUsuarioEPedido(req, res);

        expect(usuarioService.excluirUsuarioEPedido)
            .toHaveBeenCalledWith(1);

        expect(res.json).toHaveBeenCalledWith({
            mensagem: 'Usuário e pedidos associados excluídos com sucesso'
        });
    });

    it('deve retornar 404 quando o usuário não existir', async () => {
        const req = {
            params: {
                usuarioId: 1
            }
        };

        const res = {
            status: jest.fn(),
            json: jest.fn()
        };

        res.status.mockReturnValue(res);

        usuarioService.excluirUsuarioEPedido.mockResolvedValue(0);

        await usuarioController.excluirUsuarioEPedido(req, res);

        expect(res.status).toHaveBeenCalledWith(404);

        expect(res.json).toHaveBeenCalledWith({
            erro: 'Usuário não encontrado'
        });
    });

    it('deve retornar 500 quando ocorrer erro na exclusão', async () => {
        const req = {
            params: {
                usuarioId: 1
            }
        };

        const res = {
            status: jest.fn(),
            json: jest.fn()
        };

        res.status.mockReturnValue(res);

        usuarioService.excluirUsuarioEPedido.mockRejectedValue(
            new Error('Erro inesperado')
        );

        await usuarioController.excluirUsuarioEPedido(req, res);

        expect(res.status).toHaveBeenCalledWith(500);

        expect(res.json).toHaveBeenCalledWith({
            erro: 'Erro ao excluir usuário'
        });
    });
});

describe('validarEmail', () => {
    it('deve validar o e-mail com sucesso', async () => {
        const req = {
            body: {
                email: 'maria@email.com',
                codigo: '123456'
            }
        };

        const res = {
            json: jest.fn(),
            status: jest.fn()
        };

        res.status.mockReturnValue(res);

        usuarioService.validarEmail.mockResolvedValue(true);

        await usuarioController.validarEmail(req, res);

        expect(usuarioService.validarEmail)
            .toHaveBeenCalledWith(
                'maria@email.com',
                '123456'
            );

        expect(res.json).toHaveBeenCalledWith({
            mensagem: 'E-mail validado com sucesso. Aguarde a aprovação do síndico.'
        });
    });

    it('deve retornar erro de negócio ao validar o e-mail', async () => {
        const req = {
            body: {
                email: 'maria@email.com',
                codigo: '000000'
            }
        };

        const res = {
            status: jest.fn(),
            json: jest.fn()
        };

        res.status.mockReturnValue(res);

        const error = new Error('Código inválido');
        error.status = 400;
        error.codigo = 'CODIGO_INVALIDO';

        usuarioService.validarEmail.mockRejectedValue(error);

        await usuarioController.validarEmail(req, res);

        expect(res.status).toHaveBeenCalledWith(400);

        expect(res.json).toHaveBeenCalledWith({
            erro: 'Código inválido',
            codigo: 'CODIGO_INVALIDO'
        });
    });

    it('deve retornar 500 para erro inesperado na validação', async () => {
        const req = {
            body: {
                email: 'maria@email.com',
                codigo: '123456'
            }
        };

        const res = {
            status: jest.fn(),
            json: jest.fn()
        };

        res.status.mockReturnValue(res);

        usuarioService.validarEmail.mockRejectedValue(
            new Error('Erro inesperado')
        );

        await usuarioController.validarEmail(req, res);

        expect(res.status).toHaveBeenCalledWith(500);

        expect(res.json).toHaveBeenCalledWith({
            erro: 'Erro ao validar e-mail'
        });
    });
});

describe('reenviarCodigo', () => {
    it('deve reenviar o código quando houver código novo', async () => {
        const req = {
            body: {
                email: 'maria@email.com'
            }
        };

        const res = {
            json: jest.fn(),
            status: jest.fn()
        };

        res.status.mockReturnValue(res);

        usuarioService.reenviarCodigo.mockResolvedValue({
            email: 'maria@email.com',
            codigo: '654321'
        });

        sendVerificationCode.mockResolvedValue();

        await usuarioController.reenviarCodigo(req, res);

        expect(usuarioService.reenviarCodigo)
            .toHaveBeenCalledWith('maria@email.com');

        expect(sendVerificationCode)
            .toHaveBeenCalledWith(
                'maria@email.com',
                '654321'
            );

        expect(res.json).toHaveBeenCalledWith({
            mensagem: 'Se o e-mail estiver aguardando validação, enviamos um novo código.'
        });
    });

    it('deve responder normalmente quando não houver código para reenviar', async () => {
        const req = {
            body: {
                email: 'maria@email.com'
            }
        };

        const res = {
            json: jest.fn(),
            status: jest.fn()
        };

        res.status.mockReturnValue(res);

        usuarioService.reenviarCodigo.mockResolvedValue(null);

        await usuarioController.reenviarCodigo(req, res);

        expect(sendVerificationCode).not.toHaveBeenCalled();

        expect(res.json).toHaveBeenCalledWith({
            mensagem: 'Se o e-mail estiver aguardando validação, enviamos um novo código.'
        });
    });

    it('deve responder normalmente quando o envio do e-mail falhar', async () => {
        const req = {
            body: {
                email: 'maria@email.com'
            }
        };

        const res = {
            json: jest.fn(),
            status: jest.fn()
        };

        res.status.mockReturnValue(res);

        usuarioService.reenviarCodigo.mockResolvedValue({
            email: 'maria@email.com',
            codigo: '654321'
        });

        sendVerificationCode.mockRejectedValue(
            new Error('Falha no e-mail')
        );

        await usuarioController.reenviarCodigo(req, res);

        expect(res.json).toHaveBeenCalledWith({
            mensagem: 'Se o e-mail estiver aguardando validação, enviamos um novo código.'
        });
    });

    it('deve retornar erro de negócio ao reenviar código', async () => {
        const req = {
            body: {
                email: 'email-invalido'
            }
        };

        const res = {
            status: jest.fn(),
            json: jest.fn()
        };

        res.status.mockReturnValue(res);

        const error = new Error('Informe um e-mail válido.');
        error.status = 400;
        error.codigo = 'EMAIL_INVALIDO';

        usuarioService.reenviarCodigo.mockRejectedValue(error);

        await usuarioController.reenviarCodigo(req, res);

        expect(res.status).toHaveBeenCalledWith(400);

        expect(res.json).toHaveBeenCalledWith({
            erro: 'Informe um e-mail válido.',
            codigo: 'EMAIL_INVALIDO'
        });
    });

    it('deve retornar 500 para erro inesperado ao reenviar código', async () => {
        const req = {
            body: {
                email: 'maria@email.com'
            }
        };

        const res = {
            status: jest.fn(),
            json: jest.fn()
        };

        res.status.mockReturnValue(res);

        usuarioService.reenviarCodigo.mockRejectedValue(
            new Error('Erro inesperado')
        );

        await usuarioController.reenviarCodigo(req, res);

        expect(res.status).toHaveBeenCalledWith(500);

        expect(res.json).toHaveBeenCalledWith({
            erro: 'Erro ao reenviar código'
        });
    });
});

describe('listarPendentes', () => {
    it('deve listar os moradores pendentes', async () => {
        const req = {};

        const res = {
            status: jest.fn(),
            json: jest.fn()
        };

        res.status.mockReturnValue(res);

        const moradores = [
            {
                id: 1,
                nome: 'Maria',
                email: 'maria@email.com'
            }
        ];

        usuarioService.listarPendentes.mockResolvedValue(moradores);

        await usuarioController.listarPendentes(req, res);

        expect(usuarioService.listarPendentes)
            .toHaveBeenCalledTimes(1);

        expect(res.status).toHaveBeenCalledWith(200);

        expect(res.json).toHaveBeenCalledWith(moradores);
    });

    it('deve retornar 500 quando o erro não possuir status', async () => {
    const req = {};

    const res = {
        status: jest.fn(),
        json: jest.fn()
    };

    res.status.mockReturnValue(res);

    const error = new Error('Erro inesperado');

    usuarioService.listarPendentes.mockRejectedValue(error);

    await usuarioController.listarPendentes(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
        mensagem: 'Erro inesperado'
    });
});

    it('deve retornar o erro do serviço ao listar pendentes', async () => {
        const req = {};

        const res = {
            status: jest.fn(),
            json: jest.fn()
        };

        res.status.mockReturnValue(res);

        const error = new Error('Erro ao listar moradores');
        error.status = 500;

        usuarioService.listarPendentes.mockRejectedValue(error);

        await usuarioController.listarPendentes(req, res);

        expect(res.status).toHaveBeenCalledWith(500);

        expect(res.json).toHaveBeenCalledWith({
            mensagem: 'Erro ao listar moradores'
        });
    });
});

describe('aprovarMorador', () => {
    it('deve aprovar o morador', async () => {
        const req = {
            params: {
                usuarioId: 1
            }
        };

        const res = {
            status: jest.fn(),
            json: jest.fn()
        };

        res.status.mockReturnValue(res);

        const resultado = {
            mensagem: 'Morador aprovado com sucesso'
        };

        usuarioService.aprovarMorador.mockResolvedValue(resultado);

        await usuarioController.aprovarMorador(req, res);

        expect(usuarioService.aprovarMorador)
            .toHaveBeenCalledWith(1, undefined);

        expect(res.status).toHaveBeenCalledWith(200);

        expect(res.json).toHaveBeenCalledWith(resultado);
    });

    it('deve retornar 500 quando o erro não possuir status', async () => {
    const req = {
        params: {
            usuarioId: 1
        }
    };

    const res = {
        status: jest.fn(),
        json: jest.fn()
    };

    res.status.mockReturnValue(res);

    const error = new Error('Erro inesperado');

    usuarioService.aprovarMorador.mockRejectedValue(error);

    await usuarioController.aprovarMorador(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
        mensagem: 'Erro inesperado'
    });
});

    it('deve retornar erro ao tentar aprovar o morador', async () => {
        const req = {
            params: {
                usuarioId: 1
            }
        };

        const res = {
            status: jest.fn(),
            json: jest.fn()
        };

        res.status.mockReturnValue(res);

        const error = new Error('Usuário não encontrado');
        error.status = 404;

        usuarioService.aprovarMorador.mockRejectedValue(error);

        await usuarioController.aprovarMorador(req, res);

        expect(res.status).toHaveBeenCalledWith(404);

        expect(res.json).toHaveBeenCalledWith({
            mensagem: 'Usuário não encontrado'
        });
    });
});

describe('rejeitarMorador', () => {
    it('deve rejeitar o morador', async () => {
        const req = {
            params: {
                usuarioId: 1
            }
        };

        const res = {
            status: jest.fn(),
            json: jest.fn()
        };

        res.status.mockReturnValue(res);

        const resultado = {
            mensagem: 'Morador rejeitado com sucesso'
        };

        usuarioService.rejeitarMorador.mockResolvedValue(resultado);

        await usuarioController.rejeitarMorador(req, res);

        expect(usuarioService.rejeitarMorador)
            .toHaveBeenCalledWith(1, undefined);

        expect(res.status).toHaveBeenCalledWith(200);

        expect(res.json).toHaveBeenCalledWith(resultado);
    });

    it('deve retornar 500 quando o erro não possuir status', async () => {
    const req = {
        params: {
            usuarioId: 1
        }
    };

    const res = {
        status: jest.fn(),
        json: jest.fn()
    };

    res.status.mockReturnValue(res);

    const error = new Error('Erro inesperado');

    usuarioService.rejeitarMorador.mockRejectedValue(error);

    await usuarioController.rejeitarMorador(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
        mensagem: 'Erro inesperado'
    });
});

    it('deve retornar erro ao tentar rejeitar o morador', async () => {
        const req = {
            params: {
                usuarioId: 1
            }
        };

        const res = {
            status: jest.fn(),
            json: jest.fn()
        };

        res.status.mockReturnValue(res);

        const error = new Error('Usuário não encontrado');
        error.status = 404;

        usuarioService.rejeitarMorador.mockRejectedValue(error);

        await usuarioController.rejeitarMorador(req, res);

        expect(res.status).toHaveBeenCalledWith(404);

        expect(res.json).toHaveBeenCalledWith({
            mensagem: 'Usuário não encontrado'
        });
    });
});

describe('escopo por condomínio (síndico x admin)', () => {
    const novoRes = () => {
        const res = { status: jest.fn(), json: jest.fn() };
        res.status.mockReturnValue(res);
        return res;
    };

    it('listarPendentes ignora ?condominioId e usa o condomínio do síndico', async () => {
        const req = {
            usuario: { perfil: 'SINDICO', id_condominio: 1 },
            query: { condominioId: '2' }
        };
        const res = novoRes();
        usuarioService.listarPendentes.mockResolvedValue([]);

        await usuarioController.listarPendentes(req, res);

        expect(usuarioService.listarPendentes).toHaveBeenCalledWith(1);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('listarPendentes do admin usa o filtro opcional ?condominioId', async () => {
        const req = { usuario: { perfil: 'ADMIN' }, query: { condominioId: '2' } };
        usuarioService.listarPendentes.mockResolvedValue([]);

        await usuarioController.listarPendentes(req, novoRes());

        expect(usuarioService.listarPendentes).toHaveBeenCalledWith('2');
    });

    it('listarPendentes do admin sem filtro lista todos os condomínios', async () => {
        const req = { usuario: { perfil: 'ADMIN', id_condominio: null }, query: {} };
        usuarioService.listarPendentes.mockResolvedValue([]);

        await usuarioController.listarPendentes(req, novoRes());

        expect(usuarioService.listarPendentes).toHaveBeenCalledWith(undefined);
    });

    it('síndico sem condomínio vinculado recebe 403 em vez de ver tudo', async () => {
        const req = { usuario: { perfil: 'SINDICO', id_condominio: null }, query: {} };
        const res = novoRes();

        await usuarioController.listarPendentes(req, res);

        expect(usuarioService.listarPendentes).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ mensagem: 'Síndico sem condomínio vinculado.' });
    });

    it.each([
        ['aprovarMorador'],
        ['rejeitarMorador']
    ])('%s repassa o condomínio do síndico para o serviço', async (metodo) => {
        const req = {
            params: { usuarioId: 15 },
            usuario: { perfil: 'SINDICO', id_condominio: 1 }
        };
        usuarioService[metodo].mockResolvedValue({ mensagem: 'ok' });

        await usuarioController[metodo](req, novoRes());

        expect(usuarioService[metodo]).toHaveBeenCalledWith(15, 1);
    });

    it.each([
        ['aprovarMorador'],
        ['rejeitarMorador']
    ])('%s do admin não restringe por condomínio', async (metodo) => {
        const req = { params: { usuarioId: 15 }, usuario: { perfil: 'ADMIN' } };
        usuarioService[metodo].mockResolvedValue({ mensagem: 'ok' });

        await usuarioController[metodo](req, novoRes());

        expect(usuarioService[metodo]).toHaveBeenCalledWith(15, undefined);
    });

    it.each([
        ['aprovarMorador'],
        ['rejeitarMorador']
    ])('%s de síndico sem condomínio devolve 403 sem chamar o serviço', async (metodo) => {
        const req = { params: { usuarioId: 15 }, usuario: { perfil: 'SINDICO' } };
        const res = novoRes();

        await usuarioController[metodo](req, res);

        expect(usuarioService[metodo]).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });
});
