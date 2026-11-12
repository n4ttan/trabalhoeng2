const connection = require('../src/repositories/database');
const reservaRepository = require('../src/repositories/reservaRepository');

jest.mock('../src/repositories/database', () => ({
    query: jest.fn()
}));

describe('reservaRepository', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('verificarConflito', () => {
        it('deve retornar true quando houver conflito', async () => {
            connection.query.mockImplementation((sql, params, callback) => {
                callback(null, [{ id: 1 }]);
            });

            const conflito = await reservaRepository.verificarConflito(1, '2026-11-20', '10:00', '14:00');

            expect(conflito).toBe(true);
            expect(connection.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM reservas_churrasqueira'),
                [1, '2026-11-20', '14:00', '10:00'],
                expect.any(Function)
            );
        });

        it('deve retornar false quando não houver conflito', async () => {
            connection.query.mockImplementation((sql, params, callback) => {
                callback(null, []);
            });

            const conflito = await reservaRepository.verificarConflito(1, '2026-11-20', '10:00', '14:00');

            expect(conflito).toBe(false);
        });

        it('deve rejeitar se a consulta der erro', async () => {
            const erro = new Error('Falha no banco');
            connection.query.mockImplementation((sql, params, callback) => {
                callback(erro, null);
            });

            await expect(
                reservaRepository.verificarConflito(1, '2026-11-20', '10:00', '14:00')
            ).rejects.toBe(erro);
        });
    });

    describe('criarReserva', () => {
        it('deve inserir nova reserva e retornar o insertId', async () => {
            connection.query.mockImplementation((sql, params, callback) => {
                callback(null, { insertId: 42 });
            });

            const dados = {
                id_condominio: 1,
                id_usuario: 5,
                data_reserva: '2026-11-20',
                horario_inicio: '10:00',
                horario_fim: '14:00'
            };

            const id = await reservaRepository.criarReserva(dados);

            expect(id).toBe(42);
            expect(connection.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO reservas_churrasqueira'),
                [1, 5, '2026-11-20', '10:00', '14:00'],
                expect.any(Function)
            );
        });

        it('deve rejeitar em caso de erro na query', async () => {
            const erro = new Error('Falha no insert');
            connection.query.mockImplementation((sql, params, callback) => {
                callback(erro, null);
            });

            await expect(
                reservaRepository.criarReserva({
                    id_condominio: 1,
                    id_usuario: 5,
                    data_reserva: '2026-11-20',
                    horario_inicio: '10:00',
                    horario_fim: '14:00'
                })
            ).rejects.toBe(erro);
        });
    });

    describe('listarPorCondominio', () => {
        it('deve retornar lista de reservas', async () => {
            const lista = [{ id: 1, usuario_nome: 'João' }];
            connection.query.mockImplementation((sql, params, callback) => {
                callback(null, lista);
            });

            const resultado = await reservaRepository.listarPorCondominio(1);

            expect(resultado).toEqual(lista);
            expect(connection.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT r.*, u.nome AS usuario_nome'),
                [1],
                expect.any(Function)
            );
        });

        it('deve rejeitar em caso de erro', async () => {
            const erro = new Error('Falha no select');
            connection.query.mockImplementation((sql, params, callback) => {
                callback(erro, null);
            });

            await expect(reservaRepository.listarPorCondominio(1)).rejects.toBe(erro);
        });
    });
});
