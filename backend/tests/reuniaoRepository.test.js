const connection = require('../src/repositories/database');
const reuniaoRepository = require('../src/repositories/reuniaoRepository');

jest.mock('../src/repositories/database', () => ({
    query: jest.fn()
}));

describe('reuniaoRepository', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('buscarPorCondominio', () => {
        it('deve buscar reuniões ordenadas por data_hora', async () => {
            const reunioes = [{ id: 1, titulo: 'Assembleia' }];
            connection.query.mockImplementation((sql, params, callback) => {
                callback(null, reunioes);
            });

            const resultado = await reuniaoRepository.buscarPorCondominio(1);

            expect(resultado).toEqual(reunioes);
            expect(connection.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM reunioes WHERE id_condominio = ?'),
                [1],
                expect.any(Function)
            );
        });

        it('deve rejeitar em caso de erro na consulta', async () => {
            const erro = new Error('Falha no select');
            connection.query.mockImplementation((sql, params, callback) => {
                callback(erro, null);
            });

            await expect(reuniaoRepository.buscarPorCondominio(1)).rejects.toBe(erro);
        });
    });

    describe('salvar', () => {
        it('deve salvar reunião e retornar os dados com id', async () => {
            connection.query.mockImplementation((sql, params, callback) => {
                callback(null, { insertId: 10 });
            });

            const dados = {
                id_condominio: 1,
                titulo: 'Reunião',
                pauta: 'Prestação de contas',
                data_hora: '2026-11-20 19:00',
                local_link: 'Auditório'
            };

            const resultado = await reuniaoRepository.salvar(dados);

            expect(resultado).toEqual({ id: 10, ...dados });
            expect(connection.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO reunioes'),
                [1, 'Reunião', 'Prestação de contas', '2026-11-20 19:00', 'Auditório'],
                expect.any(Function)
            );
        });

        it('deve rejeitar em caso de erro no insert', async () => {
            const erro = new Error('Falha no insert');
            connection.query.mockImplementation((sql, params, callback) => {
                callback(erro, null);
            });

            await expect(
                reuniaoRepository.salvar({
                    id_condominio: 1,
                    titulo: 'Reunião',
                    pauta: 'Pauta',
                    data_hora: '2026-11-20',
                    local_link: 'Link'
                })
            ).rejects.toBe(erro);
        });
    });

    describe('remover', () => {
        it('deve remover reunião pelo ID', async () => {
            connection.query.mockImplementation((sql, params, callback) => {
                callback(null, { affectedRows: 1 });
            });

            const resultado = await reuniaoRepository.remover(10);

            expect(resultado).toBe(true);
            expect(connection.query).toHaveBeenCalledWith(
                'DELETE FROM reunioes WHERE id = ?',
                [10],
                expect.any(Function)
            );
        });

        it('deve rejeitar em caso de erro no delete', async () => {
            const erro = new Error('Falha no delete');
            connection.query.mockImplementation((sql, params, callback) => {
                callback(erro, null);
            });

            await expect(reuniaoRepository.remover(10)).rejects.toBe(erro);
        });
    });
});
