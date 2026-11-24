const connection = require('../src/repositories/database');
const visitanteRepository = require('../src/repositories/visitanteRepository');

jest.mock('../src/repositories/database', () => ({
    query: jest.fn()
}));

const ok = (results) => connection.query.mockImplementation((sql, params, cb) => cb(null, results));
const falha = () => connection.query.mockImplementation((sql, params, cb) => cb(new Error('db')));

describe('visitanteRepository', () => {
    beforeEach(() => jest.clearAllMocks());

    it('criar retorna insertId', async () => {
        ok({ insertId: 7 });
        const id = await visitanteRepository.criar({
            id_condominio: 1, id_usuario: 2, nome_visitante: 'Ana', documento: '123', data_prevista: 'a', validade_ate: 'b'
        });
        expect(id).toBe(7);
        expect(connection.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO visitantes'),
            [1, 2, 'Ana', '123', 'a', 'b'],
            expect.any(Function)
        );
    });

    it('listarPorCondominio retorna linhas', async () => {
        ok([{ id: 1 }]);
        expect(await visitanteRepository.listarPorCondominio(1)).toEqual([{ id: 1 }]);
    });

    it('listarPorUsuario filtra por usuário', async () => {
        ok([{ id: 1 }]);
        await visitanteRepository.listarPorUsuario(1, 2);
        expect(connection.query).toHaveBeenCalledWith(expect.stringContaining('v.id_usuario = ?'), [1, 2], expect.any(Function));
    });

    it('buscarPorId retorna item ou null', async () => {
        ok([{ id: 3 }]);
        expect(await visitanteRepository.buscarPorId(3)).toEqual({ id: 3 });
        ok([]);
        expect(await visitanteRepository.buscarPorId(4)).toBeNull();
    });

    it.each([
        ['ENTROU', 'entrada_em'],
        ['SAIU', 'saida_em'],
        ['CANCELADO', null]
    ])('atualizarStatus %s', async (novo, coluna) => {
        ok({ affectedRows: 1 });
        expect(await visitanteRepository.atualizarStatus(1, 'X', novo)).toBe(true);
        const sql = connection.query.mock.calls[0][0];
        if (coluna) expect(sql).toContain(coluna);
        else expect(sql).not.toContain('_em =');
        expect(connection.query.mock.calls[0][1]).toEqual([novo, 1, 'X']);
    });

    it('atualizarStatus retorna false sem linhas afetadas', async () => {
        ok({ affectedRows: 0 });
        expect(await visitanteRepository.atualizarStatus(1, 'A', 'B')).toBe(false);
    });

    it('propaga erros do banco', async () => {
        falha();
        await expect(visitanteRepository.criar({})).rejects.toThrow('db');
        await expect(visitanteRepository.listarPorCondominio(1)).rejects.toThrow('db');
        await expect(visitanteRepository.listarPorUsuario(1, 2)).rejects.toThrow('db');
        await expect(visitanteRepository.buscarPorId(1)).rejects.toThrow('db');
        await expect(visitanteRepository.atualizarStatus(1, 'A', 'B')).rejects.toThrow('db');
    });
});
