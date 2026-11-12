jest.mock('../src/repositories/reservaSalaoRepository', () => ({
    verificarConflito: jest.fn(),
    criarReserva: jest.fn(),
    listarPorCondominio: jest.fn(),
    buscarPorId: jest.fn(),
    cancelarReserva: jest.fn()
}));

const reservaSalaoRepository = require('../src/repositories/reservaSalaoRepository');
const reservaSalaoService = require('../src/services/reservaSalaoService');

describe('reservaSalaoService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('agendar', () => {
        it('deve agendar uma reserva com sucesso', async () => {
            reservaSalaoRepository.verificarConflito.mockResolvedValue(false);
            reservaSalaoRepository.criarReserva.mockResolvedValue(10);

            const dados = {
                id_condominio: 1,
                id_usuario: 5,
                data_reserva: '2026-12-25',
                horario_inicio: '18:00',
                horario_fim: '22:00'
            };

            const resultado = await reservaSalaoService.agendar(dados);

            expect(reservaSalaoRepository.verificarConflito).toHaveBeenCalledWith(
                1,
                '2026-12-25',
                '18:00',
                '22:00'
            );
            expect(reservaSalaoRepository.criarReserva).toHaveBeenCalledWith({
                ...dados,
                status: 'CONFIRMADA'
            });
            expect(resultado).toBe(10);
        });

        it('deve lançar erro se id_condominio não for fornecido', async () => {
            await expect(
                reservaSalaoService.agendar({
                    id_usuario: 5,
                    data_reserva: '2026-12-25',
                    horario_inicio: '18:00',
                    horario_fim: '22:00'
                })
            ).rejects.toThrow('Condomínio é obrigatório.');
        });

        it('deve lançar erro se id_usuario não for fornecido', async () => {
            await expect(
                reservaSalaoService.agendar({
                    id_condominio: 1,
                    data_reserva: '2026-12-25',
                    horario_inicio: '18:00',
                    horario_fim: '22:00'
                })
            ).rejects.toThrow('Usuário é obrigatório.');
        });

        it('deve lançar erro se faltar data ou horários', async () => {
            await expect(
                reservaSalaoService.agendar({
                    id_condominio: 1,
                    id_usuario: 5,
                    data_reserva: '',
                    horario_inicio: '18:00',
                    horario_fim: '22:00'
                })
            ).rejects.toThrow('Data, horário de início e término são obrigatórios.');
        });

        it('deve lançar erro se horário de início for posterior ou igual ao de término', async () => {
            await expect(
                reservaSalaoService.agendar({
                    id_condominio: 1,
                    id_usuario: 5,
                    data_reserva: '2026-12-25',
                    horario_inicio: '22:00',
                    horario_fim: '18:00'
                })
            ).rejects.toThrow('O horário de início deve ser anterior ao horário de término.');

            await expect(
                reservaSalaoService.agendar({
                    id_condominio: 1,
                    id_usuario: 5,
                    data_reserva: '2026-12-25',
                    horario_inicio: '18:00',
                    horario_fim: '18:00'
                })
            ).rejects.toThrow('O horário de início deve ser anterior ao horário de término.');
        });

        it('deve lançar erro 409 quando houver conflito de horário', async () => {
            reservaSalaoRepository.verificarConflito.mockResolvedValue(true);

            await expect(
                reservaSalaoService.agendar({
                    id_condominio: 1,
                    id_usuario: 5,
                    data_reserva: '2026-12-25',
                    horario_inicio: '18:00',
                    horario_fim: '22:00'
                })
            ).rejects.toMatchObject({
                message: 'O salão de festas já está reservado para este horário.',
                status: 409
            });
        });
    });

    describe('listar', () => {
        it('deve listar reservas do condomínio', async () => {
            const reservas = [{ id: 1, data_reserva: '2026-12-25' }];
            reservaSalaoRepository.listarPorCondominio.mockResolvedValue(reservas);

            const resultado = await reservaSalaoService.listar(1);

            expect(reservaSalaoRepository.listarPorCondominio).toHaveBeenCalledWith(1);
            expect(resultado).toBe(reservas);
        });

        it('deve rejeitar se id_condominio for inválido', async () => {
            await expect(reservaSalaoService.listar('abc')).rejects.toThrow('ID do condomínio inválido.');
        });
    });

    describe('cancelar', () => {
        it('deve permitir que o autor cancele sua própria reserva', async () => {
            reservaSalaoRepository.buscarPorId.mockResolvedValue({
                id: 1,
                id_usuario: 5,
                id_condominio: 2,
                status: 'CONFIRMADA'
            });
            reservaSalaoRepository.cancelarReserva.mockResolvedValue(true);

            const usuario = { id: 5, perfil: 'MORADOR', id_condominio: 2 };
            const resultado = await reservaSalaoService.cancelar(1, usuario);

            expect(reservaSalaoRepository.cancelarReserva).toHaveBeenCalledWith(1);
            expect(resultado).toEqual({ mensagem: 'Reserva cancelada com sucesso.' });
        });

        it('deve permitir que o síndico do condomínio cancele a reserva', async () => {
            reservaSalaoRepository.buscarPorId.mockResolvedValue({
                id: 1,
                id_usuario: 5,
                id_condominio: 2,
                status: 'CONFIRMADA'
            });
            reservaSalaoRepository.cancelarReserva.mockResolvedValue(true);

            const sindico = { id: 99, perfil: 'SINDICO', id_condominio: 2 };
            const resultado = await reservaSalaoService.cancelar(1, sindico);

            expect(resultado).toEqual({ mensagem: 'Reserva cancelada com sucesso.' });
        });

        it('deve permitir que o admin geral cancele a reserva', async () => {
            reservaSalaoRepository.buscarPorId.mockResolvedValue({
                id: 1,
                id_usuario: 5,
                id_condominio: 2,
                status: 'CONFIRMADA'
            });
            reservaSalaoRepository.cancelarReserva.mockResolvedValue(true);

            const admin = { id: 999, perfil: 'ADMIN' };
            const resultado = await reservaSalaoService.cancelar(1, admin);

            expect(resultado).toEqual({ mensagem: 'Reserva cancelada com sucesso.' });
        });

        it('deve negar o cancelamento para outro morador', async () => {
            reservaSalaoRepository.buscarPorId.mockResolvedValue({
                id: 1,
                id_usuario: 5,
                id_condominio: 2,
                status: 'CONFIRMADA'
            });

            const outroMorador = { id: 8, perfil: 'MORADOR', id_condominio: 2 };
            await expect(
                reservaSalaoService.cancelar(1, outroMorador)
            ).rejects.toMatchObject({
                status: 403,
                message: 'Acesso negado. Você não tem permissão para cancelar esta reserva.'
            });
        });

        it('deve negar cancelamento se a reserva já estiver cancelada', async () => {
            reservaSalaoRepository.buscarPorId.mockResolvedValue({
                id: 1,
                id_usuario: 5,
                id_condominio: 2,
                status: 'CANCELADA'
            });

            const usuario = { id: 5, perfil: 'MORADOR', id_condominio: 2 };
            await expect(
                reservaSalaoService.cancelar(1, usuario)
            ).rejects.toMatchObject({
                status: 400,
                message: 'Esta reserva já se encontra cancelada.'
            });
        });

        it('deve retornar 404 se a reserva não existir', async () => {
            reservaSalaoRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                reservaSalaoService.cancelar(999, { id: 1, perfil: 'ADMIN' })
            ).rejects.toMatchObject({
                status: 404,
                message: 'Reserva não encontrada.'
            });
        });

        it('deve lançar erro se id da reserva for inválido ao cancelar', async () => {
            await expect(
                reservaSalaoService.cancelar('abc', { id: 1 })
            ).rejects.toMatchObject({
                status: 400,
                message: 'ID de reserva inválido.'
            });
        });
    });

    describe('buscarPorId', () => {
        it('deve buscar reserva por id com sucesso', async () => {
            const reserva = { id: 10, data_reserva: '2026-12-25' };
            reservaSalaoRepository.buscarPorId.mockResolvedValue(reserva);

            const resultado = await reservaSalaoService.buscarPorId(10);
            expect(resultado).toBe(reserva);
            expect(reservaSalaoRepository.buscarPorId).toHaveBeenCalledWith(10);
        });

        it('deve rejeitar se id for inválido', async () => {
            await expect(
                reservaSalaoService.buscarPorId('invalido')
            ).rejects.toMatchObject({
                status: 400,
                message: 'ID de reserva inválido.'
            });
        });

        it('deve retornar 404 se não encontrada', async () => {
            reservaSalaoRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                reservaSalaoService.buscarPorId(999)
            ).rejects.toMatchObject({
                status: 404,
                message: 'Reserva não encontrada.'
            });
        });
    });
});
