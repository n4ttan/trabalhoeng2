const connection = require('../src/repositories/database');
const repo = require('../src/repositories/multaRepository');

jest.mock('../src/repositories/database', () => ({ query: jest.fn() }));

const ok = (resultado) => connection.query.mockImplementation((s, p, cb) => cb(null, resultado));
const falha = (e) => connection.query.mockImplementation((s, p, cb) => cb(e, null));

describe('multaRepository', () => {
    beforeEach(() => jest.clearAllMocks());

    it('buscarMorador retorna o morador ou null', async () => {
        ok([{ id: 3 }]);
        expect(await repo.buscarMorador(3, 1)).toEqual({ id: 3 });
        expect(connection.query).toHaveBeenCalledWith(expect.stringContaining('FROM usuarios'), [3, 1], expect.any(Function));
        ok([]);
        expect(await repo.buscarMorador(9, 1)).toBeNull();
    });

    it('salvar retorna a multa com id e status PENDENTE', async () => {
        ok({ insertId: 7 });
        const dados = { id_condominio: 1, id_usuario: 3, valor: 50, motivo: 'Barulho', data_multa: '2026-01-01' };
        expect(await repo.salvar(dados)).toEqual({ id: 7, ...dados, status: 'PENDENTE' });
    });

    it('listarPorCondominio e listarPorUsuario retornam linhas', async () => {
        ok([{ id: 1 }]);
        expect(await repo.listarPorCondominio(1)).toEqual([{ id: 1 }]);
        expect(await repo.listarPorUsuario(1, 3)).toEqual([{ id: 1 }]);
        expect(connection.query).toHaveBeenLastCalledWith(expect.stringContaining('FROM multas'), [1, 3], expect.any(Function));
    });

    it('buscarPorId retorna multa ou null', async () => {
        ok([{ id: 1 }]);
        expect(await repo.buscarPorId(1)).toEqual({ id: 1 });
        ok([]);
        expect(await repo.buscarPorId(2)).toBeNull();
    });

    it('atualizarStatus informa se alterou linha', async () => {
        ok({ affectedRows: 1 });
        expect(await repo.atualizarStatus(1, 'PAGA')).toBe(true);
        ok({ affectedRows: 0 });
        expect(await repo.atualizarStatus(1, 'PAGA')).toBe(false);
    });

    it('rejeita em erro de banco', async () => {
        const e = new Error('db');
        falha(e);
        await expect(repo.buscarPorId(1)).rejects.toBe(e);
    });
});
