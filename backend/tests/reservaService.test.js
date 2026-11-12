jest.mock('../src/repositories/reservaRepository', () => ({
    verificarConflito: jest.fn(),
    criarReserva: jest.fn(),
    listarPorCondominio: jest.fn()
}));

const reservaRepository = require('../src/repositories/reservaRepository');
const reservaService = require('../src/services/reservaService');

describe('reservaService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('agendar', () => {
        it('deve agendar uma reserva com sucesso', async () => {
            const dados = {
                id_condominio: 1,
                id_usuario: 5,
                data_reserva: '2026-11-20',
                horario_inicio: '10:00',
                horario_fim: '14:00'
            };

            reservaRepository.verificarConflito.mockResolvedValue(false);
            reservaRepository.criarReserva.mockResolvedValue(10);

            const resultado = await reservaService.agendar(dados);

            expect(reservaRepository.verificarConflito).toHaveBeenCalledWith(
                1,
                '2026-11-20',
                '10:00',
                '14:00'
            );
            expect(reservaRepository.criarReserva).toHaveBeenCalledWith(dados);
            expect(resultado).toBe(10);
        });

        it('deve lançar erro se faltar data ou horários', async () => {
            await expect(
                reservaService.agendar({ id_condominio: 1, data_reserva: '', horario_inicio: '10:00', horario_fim: '14:00' })
            ).rejects.toThrow('Data, horário de início e término são obrigatórios.');

            await expect(
                reservaService.agendar({ id_condominio: 1, data_reserva: '2026-11-20', horario_inicio: '', horario_fim: '14:00' })
            ).rejects.toThrow('Data, horário de início e término são obrigatórios.');

            await expect(
                reservaService.agendar({ id_condominio: 1, data_reserva: '2026-11-20', horario_inicio: '10:00', horario_fim: '' })
            ).rejects.toThrow('Data, horário de início e término são obrigatórios.');
        });

        it('deve lançar erro se o horário de início for posterior ou igual ao de término', async () => {
            await expect(
                reservaService.agendar({
                    id_condominio: 1,
                    data_reserva: '2026-11-20',
                    horario_inicio: '15:00',
                    horario_fim: '14:00'
                })
            ).rejects.toThrow('O horário de início deve ser anterior ao horário de término.');

            await expect(
                reservaService.agendar({
                    id_condominio: 1,
                    data_reserva: '2026-11-20',
                    horario_inicio: '14:00',
                    horario_fim: '14:00'
                })
            ).rejects.toThrow('O horário de início deve ser anterior ao horário de término.');
        });

        it('deve lançar erro se houver conflito de horário', async () => {
            reservaRepository.verificarConflito.mockResolvedValue(true);

            await expect(
                reservaService.agendar({
                    id_condominio: 1,
                    data_reserva: '2026-11-20',
                    horario_inicio: '10:00',
                    horario_fim: '14:00'
                })
            ).rejects.toThrow('A churrasqueira já está reservada para este horário.');
        });
    });

    describe('listar', () => {
        it('deve listar reservas do condomínio', async () => {
            const reservas = [{ id: 1, data_reserva: '2026-11-20' }];
            reservaRepository.listarPorCondominio.mockResolvedValue(reservas);

            const resultado = await reservaService.listar(1);

            expect(reservaRepository.listarPorCondominio).toHaveBeenCalledWith(1);
            expect(resultado).toBe(reservas);
        });
    });
});
