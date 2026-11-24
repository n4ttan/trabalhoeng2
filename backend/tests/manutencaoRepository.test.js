const connection = require('../src/repositories/database');
const manutencaoRepository = require('../src/repositories/manutencaoRepository');

jest.mock('../src/repositories/database', () => ({
    query: jest.fn()
}));

const ok = (resultado) => connection.query.mockImplementation((sql, params, cb) => cb(null, resultado));
const falha = (erro) => connection.query.mockImplementation((sql, params, cb) => cb(erro, null));

describe('manutencaoRepository', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('criar', () => {
        const dados = { id_condominio: 1, id_usuario: 2, titulo: 'T', descricao: 'D', local: 'L', prioridade: 'ALTA' };

        it('insere e retorna insertId', async () => {
            ok({ insertId: 9 });
            await expect(manutencaoRepository.criar(dados)).resolves.toBe(9);
            expect(connection.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO manutencoes'),
                [1, 2, 'T', 'D', 'L', 'ALTA'],
                expect.any(Function)
            );
        });

        it('rejeita em erro', async () => {
            const erro = new Error('db');
            falha(erro);
            await expect(manutencaoRepository.criar(dados)).rejects.toBe(erro);
        });
    });

    describe('listar', () => {
        it('lista todos do condomínio', async () => {
            ok([{ id: 1 }]);
            await expect(manutencaoRepository.listar(1)).resolves.toEqual([{ id: 1 }]);
            expect(connection.query).toHaveBeenCalledWith(
                expect.not.stringContaining('m.id_usuario = ?'),
                [1],
                expect.any(Function)
            );
        });

        it('filtra por usuário quando informado', async () => {
            ok([]);
            await manutencaoRepository.listar(1, 5);
            expect(connection.query).toHaveBeenCalledWith(
                expect.stringContaining('AND m.id_usuario = ?'),
                [1, 5],
                expect.any(Function)
            );
        });

        it('rejeita em erro', async () => {
            const erro = new Error('db');
            falha(erro);
            await expect(manutencaoRepository.listar(1)).rejects.toBe(erro);
        });
    });

    describe('buscarPorId', () => {
        it('retorna o registro', async () => {
            ok([{ id: 3 }]);
            await expect(manutencaoRepository.buscarPorId(3)).resolves.toEqual({ id: 3 });
        });

        it('retorna null se não existir', async () => {
            ok([]);
            await expect(manutencaoRepository.buscarPorId(3)).resolves.toBeNull();
        });

        it('rejeita em erro', async () => {
            const erro = new Error('db');
            falha(erro);
            await expect(manutencaoRepository.buscarPorId(3)).rejects.toBe(erro);
        });
    });

    describe('atualizarStatus', () => {
        it('retorna true quando atualiza', async () => {
            ok({ affectedRows: 1 });
            await expect(manutencaoRepository.atualizarStatus(3, 'CONCLUIDO')).resolves.toBe(true);
            expect(connection.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE manutencoes SET status'),
                ['CONCLUIDO', 3],
                expect.any(Function)
            );
        });

        it('retorna false quando nada muda', async () => {
            ok({ affectedRows: 0 });
            await expect(manutencaoRepository.atualizarStatus(3, 'ABERTO')).resolves.toBe(false);
        });

        it('rejeita em erro', async () => {
            const erro = new Error('db');
            falha(erro);
            await expect(manutencaoRepository.atualizarStatus(3, 'ABERTO')).rejects.toBe(erro);
        });
    });
});
