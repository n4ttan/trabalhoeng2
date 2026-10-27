jest.mock('../src/repositories/database', () => ({
    query: jest.fn()
}));

const connection = require('../src/repositories/database');
const repository = require('../src/repositories/usuarioRepository');

beforeEach(() => {
    jest.clearAllMocks();
});

function responderQuery(error, results) {
    connection.query.mockImplementationOnce((sql, params, callback) => {
        callback(error, results);
    });
}

describe('criarUsuario', () => {
    it('deve inserir um usuário e retornar seu ID', async () => {
        responderQuery(null, { insertId: 10 });

        await expect(
            repository.criarUsuario('Ana', 'ana@example.com', 'hash', 'MORADOR')
        ).resolves.toBe(10);

        expect(connection.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO usuarios'),
            ['Ana', 'ana@example.com', 'hash', 'MORADOR', null],
            expect.any(Function)
        );
    });

    it('deve propagar erros do banco', async () => {
        responderQuery(new Error('Falha ao inserir'));

        await expect(
            repository.criarUsuario('Ana', 'ana@example.com', 'hash', 'MORADOR')
        ).rejects.toThrow('Falha ao inserir');
    });

    it('deve aceitar um ID de condomínio informado', async () => {
        responderQuery(null, { insertId: 11 });

        await expect(
            repository.criarUsuario('Ana', 'ana@example.com', 'hash', 'MORADOR', 5)
        ).resolves.toBe(11);

        expect(connection.query.mock.calls[0][1][4]).toBe(5);
    });
});

describe('criarMorador', () => {
    it('deve inserir um morador e retornar seu ID', async () => {
        responderQuery(null, { insertId: 20 });

        await expect(
            repository.criarMorador(
                'Bruno', 'bruno@example.com', 'hash', 'MORADOR', '101'
            )
        ).resolves.toBe(20);

        expect(connection.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO usuarios'),
            ['Bruno', 'bruno@example.com', 'hash', 'MORADOR', '101', null, null, null],
            expect.any(Function)
        );
    });

    it('deve propagar erros do banco', async () => {
        responderQuery(new Error('Falha ao criar morador'));

        await expect(
            repository.criarMorador(
                'Bruno', 'bruno@example.com', 'hash', 'MORADOR', '101'
            )
        ).rejects.toThrow('Falha ao criar morador');
    });

    it('deve aceitar condomínio, bloco e ID do bloco', async () => {
        responderQuery(null, { insertId: 21 });

        await repository.criarMorador(
            'Bruno', 'bruno@example.com', 'hash', 'MORADOR', '101', 3, 'A', 7
        );

        expect(connection.query.mock.calls[0][1]).toEqual([
            'Bruno', 'bruno@example.com', 'hash', 'MORADOR', '101', 3, 'A', 7
        ]);
    });
});

describe('excluirUsuarioEPedido', () => {
    it('deve excluir os pedidos antes de excluir o usuário', async () => {
        responderQuery(null, {});
        responderQuery(null, { affectedRows: 1 });

        await expect(repository.excluirUsuarioEPedido(4)).resolves.toBe(1);

        expect(connection.query).toHaveBeenCalledTimes(2);
        expect(connection.query.mock.calls[0][0]).toContain('DELETE FROM pedidos_sindico');
        expect(connection.query.mock.calls[1][0]).toContain('DELETE FROM usuarios');
    });

    it('deve rejeitar se falhar ao excluir os pedidos', async () => {
        responderQuery(new Error('Falha nos pedidos'));

        await expect(repository.excluirUsuarioEPedido(4))
            .rejects.toThrow('Falha nos pedidos');

        expect(connection.query).toHaveBeenCalledTimes(1);
    });

    it('deve rejeitar se falhar ao excluir o usuário', async () => {
        responderQuery(null, {});
        responderQuery(new Error('Falha no usuário'));

        await expect(repository.excluirUsuarioEPedido(4))
            .rejects.toThrow('Falha no usuário');
    });
});

describe('salvarTokenValidacao', () => {
    it('deve salvar o token e retornar as linhas afetadas', async () => {
        responderQuery(null, { affectedRows: 1 });

        await expect(
            repository.salvarTokenValidacao(2, '123456', '2030-01-01')
        ).resolves.toBe(1);

        expect(connection.query.mock.calls[0][1]).toEqual([
            '123456', '2030-01-01', 2
        ]);
    });

    it('deve propagar erros do banco', async () => {
        responderQuery(new Error('Falha ao salvar token'));

        await expect(
            repository.salvarTokenValidacao(2, '123456', '2030-01-01')
        ).rejects.toThrow('Falha ao salvar token');
    });
});

describe('buscarPorEmail', () => {
    it('deve retornar o usuário encontrado', async () => {
        const usuario = { id: 2, email: 'ana@example.com' };
        responderQuery(null, [usuario]);

        await expect(repository.buscarPorEmail('ana@example.com'))
            .resolves.toBe(usuario);
    });

    it('deve retornar undefined quando não encontrar usuário', async () => {
        responderQuery(null, []);

        await expect(repository.buscarPorEmail('ausente@example.com'))
            .resolves.toBeUndefined();
    });

    it('deve propagar erros do banco', async () => {
        responderQuery(new Error('Falha na busca'));

        await expect(repository.buscarPorEmail('ana@example.com'))
            .rejects.toThrow('Falha na busca');
    });
});

describe('reservarTentativaValidacao', () => {
    it('deve retornar true quando uma tentativa for reservada', async () => {
        responderQuery(null, { affectedRows: 1 });

        await expect(repository.reservarTentativaValidacao(2, 5))
            .resolves.toBe(true);
    });

    it('deve retornar false quando nenhuma linha for alterada', async () => {
        responderQuery(null, { affectedRows: 0 });

        await expect(repository.reservarTentativaValidacao(2, 5))
            .resolves.toBe(false);
    });

    it('deve propagar erros do banco', async () => {
        responderQuery(new Error('Falha ao reservar tentativa'));

        await expect(repository.reservarTentativaValidacao(2, 5))
            .rejects.toThrow('Falha ao reservar tentativa');
    });
});

describe('confirmarEmail', () => {
    it('deve confirmar o e-mail e retornar as linhas afetadas', async () => {
        responderQuery(null, { affectedRows: 1 });

        await expect(repository.confirmarEmail(2)).resolves.toBe(1);
    });

    it('deve retornar zero quando nenhuma linha for alterada', async () => {
        responderQuery(null, { affectedRows: 0 });

        await expect(repository.confirmarEmail(2)).resolves.toBe(0);
    });

    it('deve propagar erros do banco', async () => {
        responderQuery(new Error('Falha ao confirmar e-mail'));

        await expect(repository.confirmarEmail(2))
            .rejects.toThrow('Falha ao confirmar e-mail');
    });
});

describe('listarPendentes', () => {
    it('deve listar pendentes sem filtro de condomínio', async () => {
        const usuarios = [{ id: 1 }, { id: 2 }];
        responderQuery(null, usuarios);

        await expect(repository.listarPendentes()).resolves.toBe(usuarios);

        expect(connection.query.mock.calls[0][1]).toEqual([]);
        expect(connection.query.mock.calls[0][0]).not.toContain('AND id_condominio = ?');
    });

    it('deve filtrar pendentes pelo condomínio informado', async () => {
        responderQuery(null, [{ id: 3 }]);

        await repository.listarPendentes(8);

        expect(connection.query.mock.calls[0][0]).toContain('AND id_condominio = ?');
        expect(connection.query.mock.calls[0][1]).toEqual([8]);
    });

    it('deve propagar erros do banco', async () => {
        responderQuery(new Error('Falha ao listar pendentes'));

        await expect(repository.listarPendentes())
            .rejects.toThrow('Falha ao listar pendentes');
    });
});

describe.each([
    ['aprovarMorador', 'Falha ao aprovar morador'],
    ['rejeitarMorador', 'Falha ao rejeitar morador']
])('%s', (metodo, mensagemErro) => {
    it('deve retornar true quando uma linha for alterada', async () => {
        responderQuery(null, { affectedRows: 1 });

        await expect(repository[metodo](2)).resolves.toBe(true);
    });

    it('deve retornar false quando nenhuma linha for alterada', async () => {
        responderQuery(null, { affectedRows: 0 });

        await expect(repository[metodo](2)).resolves.toBe(false);
    });

    it('deve propagar erros do banco', async () => {
        responderQuery(new Error(mensagemErro));

        await expect(repository[metodo](2)).rejects.toThrow(mensagemErro);
    });
});

describe('rebaixarUsuario', () => {
    it('deve retornar true quando o perfil for alterado', async () => {
        responderQuery(null, { affectedRows: 1 });

        await expect(repository.rebaixarUsuario(3)).resolves.toBe(true);
    });

    it('deve retornar false quando nenhuma linha for alterada', async () => {
        responderQuery(null, { affectedRows: 0 });

        await expect(repository.rebaixarUsuario(3)).resolves.toBe(false);
    });

    it('deve propagar erros do banco', async () => {
        responderQuery(new Error('Falha ao rebaixar usuário'));

        await expect(repository.rebaixarUsuario(3))
            .rejects.toThrow('Falha ao rebaixar usuário');
    });
});