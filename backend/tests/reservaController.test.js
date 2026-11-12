jest.mock('../src/services/reservaService', () => ({
    agendar: jest.fn(),
    listar: jest.fn()
}));

const reservaService = require('../src/services/reservaService');
const reservaController = require('../src/controllers/reservaController');

function criarResposta() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
}

describe('reservaController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('criar', () => {
        it('deve criar uma reserva de churrasqueira com sucesso', async () => {
            const req = {
                params: { idCondominio: '1' },
                usuario: { id: 5 },
                body: {
                    data_reserva: '2026-11-20',
                    horario_inicio: '10:00',
                    horario_fim: '14:00'
                }
            };
            const res = criarResposta();

            reservaService.agendar.mockResolvedValue(10);

            await reservaController.criar(req, res);

            expect(reservaService.agendar).toHaveBeenCalledWith({
                id_condominio: '1',
                id_usuario: 5,
                data_reserva: '2026-11-20',
                horario_inicio: '10:00',
                horario_fim: '14:00'
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Reserva realizada com sucesso!',
                id: 10
            });
        });

        it('deve usar id_condominio default se não informado nos params', async () => {
            const req = {
                params: {},
                usuario: { id: 5 },
                body: {
                    data_reserva: '2026-11-20',
                    horario_inicio: '10:00',
                    horario_fim: '14:00'
                }
            };
            const res = criarResposta();

            reservaService.agendar.mockResolvedValue(12);

            await reservaController.criar(req, res);

            expect(reservaService.agendar).toHaveBeenCalledWith(
                expect.objectContaining({ id_condominio: 1 })
            );
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('deve retornar status 400 em caso de erro', async () => {
            const req = {
                params: { idCondominio: '1' },
                usuario: { id: 5 },
                body: {}
            };
            const res = criarResposta();

            reservaService.agendar.mockRejectedValue(new Error('Erro de validação'));

            await reservaController.criar(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Erro de validação' });
        });
    });

    describe('listar', () => {
        it('deve listar reservas com sucesso', async () => {
            const req = { params: { idCondominio: '1' } };
            const res = criarResposta();
            const lista = [{ id: 1, data_reserva: '2026-11-20' }];

            reservaService.listar.mockResolvedValue(lista);

            await reservaController.listar(req, res);

            expect(reservaService.listar).toHaveBeenCalledWith('1');
            expect(res.json).toHaveBeenCalledWith(lista);
        });

        it('deve usar id_condominio default se não informado nos params', async () => {
            const req = { params: {} };
            const res = criarResposta();
            const lista = [];

            reservaService.listar.mockResolvedValue(lista);

            await reservaController.listar(req, res);

            expect(reservaService.listar).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith(lista);
        });

        it('deve retornar status 500 em caso de erro', async () => {
            const req = { params: { idCondominio: '1' } };
            const res = criarResposta();

            reservaService.listar.mockRejectedValue(new Error('Erro no banco'));

            await reservaController.listar(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao buscar reservas.' });
        });
    });
});
