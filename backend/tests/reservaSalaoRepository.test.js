const connection = require('../src/repositories/database');
const reservaSalaoRepository = require('../src/repositories/reservaSalaoRepository');

jest.mock('../src/repositories/database', () => ({
    query: jest.fn()
}));

describe('reservaSalaoRepository', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('verificarConflito', () => {
        it('deve retornar true quando houver conflito sem idIgnorar', async () => {
            connection.query.mockImplementation((sql, params, callback) => {
                callback(null, [{ id: 1 }]);
            });

            const conflito = await reservaSalaoRepository.verificarConflito(1, '2026-12-25', '18:00', '22:00');

            expect(conflito).toBe(true);
            expect(connection.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM reservas_salao'),
                [1, '2026-12-25', '22:00', '18:00'],
                expect.any(Function)
            );
        });

        it('deve considerar idReservaIgnorar na query', async () => {
            connection.query.mockImplementation((sql, params, callback) => {
                callback(null, []);
            });

            const conflito = await reservaSalaoRepository.verificarConflito(1, '2026-12-25', '18:00', '22:00', 99);

            expect(conflito).toBe(false);
            expect(connection.query).toHaveBeenCalledWith(
                expect.stringContaining('AND id != ?'),
                [1, '2026-12-25', '22:00', '18:00', 99],
                expect.any(Function)
            );
        });

        it('deve rejeitar se a consulta falhar', async () => {
            const erro = new Error('Falha no banco');
            connection.query.mockImplementation((sql, params, callback) => {
                callback(erro, null);
            });

            await expect(
                reservaSalaoRepository.verificarConflito(1, '2026-12-25', '18:00', '22:00')
            ).rejects.toBe(erro);
        });
    });

    describe('criarReserva', () => {
        it('deve inserir nova reserva de salão e retornar o insertId', async () => {
            connection.query.mockImplementation((sql, params, callback) => {
                callback(null, { insertId: 77 });
            });

            const dados = {
                id_condominio: 1,
                id_usuario: 5,
                data_reserva: '2026-12-25',
                horario_inicio: '18:00',
                horario_fim: '22:00',
                status: 'CONFIRMADA'
            };

            const id = await reservaSalaoRepository.criarReserva(dados);

            expect(id).toBe(77);
            expect(connection.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO reservas_salao'),
                [1, 5, '2026-12-25', '18:00', '22:00', 'CONFIRMADA'],
                expect.any(Function)
            );
        });

        it('deve rejeitar em caso de erro na query', async () => {
            const erro = new Error('Falha no insert');
            connection.query.mockImplementation((sql, params, callback) => {
                callback(erro, null);
            });

            await expect(
                reservaSalaoRepository.criarReserva({
                    id_condominio: 1,
                    id_usuario: 5,
                    data_reserva: '2026-12-25',
                    horario_inicio: '18:00',
                    horario_fim: '22:00'
                })
            ).rejects.toBe(erro);
        });
    });

    describe('listarPorCondominio', () => {
        it('deve retornar lista de reservas', async () => {
            const lista = [{ id: 1, usuario_nome: 'Maria' }];
            connection.query.mockImplementation((sql, params, callback) => {
                callback(null, lista);
            });

            const resultado = await reservaSalaoRepository.listarPorCondominio(1);

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

            await expect(reservaSalaoRepository.listarPorCondominio(1)).rejects.toBe(erro);
        });
    });

    describe('buscarPorId', () => {
        it('deve retornar reserva quando encontrada', async () => {
            const reserva = { id: 10, data_reserva: '2026-12-25' };
            connection.query.mockImplementation((sql, params, callback) => {
                callback(null, [reserva]);
            });

            const resultado = await reservaSalaoRepository.buscarPorId(10);

            expect(resultado).toEqual(reserva);
            expect(connection.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT r.*, u.nome AS usuario_nome'),
                [10],
                expect.any(Function)
            );
        });

        it('deve retornar null quando não encontrada', async () => {
            connection.query.mockImplementation((sql, params, callback) => {
                callback(null, []);
            });

            const resultado = await reservaSalaoRepository.buscarPorId(999);

            expect(resultado).toBeNull();
        });

        it('deve rejeitar se a consulta der erro', async () => {
            const erro = new Error('Falha no select por id');
            connection.query.mockImplementation((sql, params, callback) => {
                callback(erro, null);
            });

            await expect(reservaSalaoRepository.buscarPorId(10)).rejects.toBe(erro);
        });
    });

    describe('cancelarReserva', () => {
        it('deve atualizar status para CANCELADA e retornar boolean', async () => {
            connection.query.mockImplementation((sql, params, callback) => {
                callback(null, { affectedRows: 1 });
            });

            const resultado = await reservaSalaoRepository.cancelarReserva(10);

            expect(resultado).toBe(true);
            expect(connection.query).toHaveBeenCalledWith(
                expect.stringMatching(/UPDATE\s+reservas_salao\s+SET\s+status\s*=\s*'CANCELADA'/i),
                [10],
                expect.any(Function)
            );
        });

        it('deve rejeitar em caso de erro', async () => {
            const erro = new Error('Falha no update');
            connection.query.mockImplementation((sql, params, callback) => {
                callback(erro, null);
            });

            await expect(reservaSalaoRepository.cancelarReserva(10)).rejects.toBe(erro);
        });
    });
});
