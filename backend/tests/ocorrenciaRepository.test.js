const connection = require('../src/repositories/database');
const repo = require('../src/repositories/ocorrenciaRepository');

jest.mock('../src/repositories/database', () => ({
    query: jest.fn()
}));

describe('ocorrenciaRepository', () => {
    beforeEach(() => jest.clearAllMocks());

    const ok = (resultado) => connection.query.mockImplementation((sql, p, cb) => cb(null, resultado));
    const falha = (erro) => connection.query.mockImplementation((sql, p, cb) => cb(erro, null));

    it('salvar insere e retorna id com status REGISTRADA', async () => {
        ok({ insertId: 5 });
        const dados = { id_condominio: 1, id_usuario: 2, titulo: 'T', descricao: 'D', categoria: 'BARULHO', data_ocorrencia: '2026-01-01' };

        const r = await repo.salvar(dados);

        expect(r).toEqual({ id: 5, status: 'REGISTRADA', ...dados });
        expect(connection.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO ocorrencias'),
            [1, 2, 'T', 'D', 'BARULHO', '2026-01-01'],
            expect.any(Function)
        );
    });

    it('salvar rejeita em erro', async () => {
        const erro = new Error('x');
        falha(erro);
        await expect(repo.salvar({})).rejects.toBe(erro);
    });

    it('buscarPorCondominio filtra por condomínio', async () => {
        ok([{ id: 1 }]);
        expect(await repo.buscarPorCondominio(1)).toEqual([{ id: 1 }]);
        expect(connection.query).toHaveBeenCalledWith(
            expect.stringContaining('WHERE o.id_condominio = ?'), [1], expect.any(Function)
        );
    });

    it('buscarPorUsuario filtra por condomínio e usuário', async () => {
        ok([{ id: 2 }]);
        expect(await repo.buscarPorUsuario(1, 9)).toEqual([{ id: 2 }]);
        expect(connection.query).toHaveBeenCalledWith(
            expect.stringContaining('id_usuario = ?'), [1, 9], expect.any(Function)
        );
    });

    it('atualizar retorna true quando altera e false quando não', async () => {
        ok({ affectedRows: 1 });
        expect(await repo.atualizar(1, 3, { status: 'RESOLVIDA', resposta: 'ok' })).toBe(true);
        expect(connection.query).toHaveBeenCalledWith(
            expect.stringContaining('id_condominio = ?'), ['RESOLVIDA', 'ok', 3, 1], expect.any(Function)
        );
        ok({ affectedRows: 0 });
        expect(await repo.atualizar(1, 3, { status: 'RESOLVIDA', resposta: null })).toBe(false);
    });
});
