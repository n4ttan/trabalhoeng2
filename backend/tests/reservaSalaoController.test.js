jest.mock('../src/services/reservaSalaoService', () => ({
    agendar: jest.fn(),
    listar: jest.fn(),
    buscarPorId: jest.fn(),
    cancelar: jest.fn()
}));

const reservaSalaoService = require('../src/services/reservaSalaoService');
const reservaSalaoController = require('../src/controllers/reservaSalaoController');

function criarResposta() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
}

describe('reservaSalaoController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('criar', () => {
        it('deve criar uma reserva com sucesso', async () => {
            const req = {
                params: { idCondominio: '1' },
                usuario: { id: 5, perfil: 'MORADOR', id_condominio: 1 },
                body: {
                    data_reserva: '2026-12-25',
                    horario_inicio: '18:00',
                    horario_fim: '22:00'
                }
            };
            const res = criarResposta();

            reservaSalaoService.agendar.mockResolvedValue(15);

            await reservaSalaoController.criar(req, res);

            expect(reservaSalaoService.agendar).toHaveBeenCalledWith({
                id_condominio: 1,
                id_usuario: 5,
                data_reserva: '2026-12-25',
                horario_inicio: '18:00',
                horario_fim: '22:00'
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                mensagem: 'Reserva do salão realizada com sucesso!',
                id: 15
            });
        });

        it('deve negar morador tentando reservar salão de outro condomínio', async () => {
            const req = {
                params: { idCondominio: '2' },
                usuario: { id: 5, perfil: 'MORADOR', id_condominio: 1 },
                body: {
                    data_reserva: '2026-12-25',
                    horario_inicio: '18:00',
                    horario_fim: '22:00'
                }
            };
            const res = criarResposta();

            await reservaSalaoController.criar(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    mensagem: 'Acesso negado. Você só pode acessar o seu próprio condomínio.'
                })
            );
            expect(reservaSalaoService.agendar).not.toHaveBeenCalled();
        });

        it('deve retornar status e erro em caso de falha de validação ou conflito', async () => {
            const req = {
                params: { idCondominio: '1' },
                usuario: { id: 5, perfil: 'MORADOR', id_condominio: 1 },
                body: {}
            };
            const res = criarResposta();
            const erro = Object.assign(new Error('Data, horário de início e término são obrigatórios.'), { status: 400 });

            reservaSalaoService.agendar.mockRejectedValue(erro);

            await reservaSalaoController.criar(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                erro: 'Data, horário de início e término são obrigatórios.',
                mensagem: 'Data, horário de início e término são obrigatórios.'
            });
        });
    });

    describe('listar', () => {
        it('deve listar reservas do condomínio', async () => {
            const req = {
                params: { idCondominio: '1' },
                usuario: { id: 5, perfil: 'MORADOR', id_condominio: 1 }
            };
            const res = criarResposta();
            const lista = [{ id: 1, data_reserva: '2026-12-25' }];

            reservaSalaoService.listar.mockResolvedValue(lista);

            await reservaSalaoController.listar(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(lista);
        });

        it('deve negar morador listando reservas de outro condomínio', async () => {
            const req = {
                params: { idCondominio: '2' },
                usuario: { id: 5, perfil: 'MORADOR', id_condominio: 1 }
            };
            const res = criarResposta();

            await reservaSalaoController.listar(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(reservaSalaoService.listar).not.toHaveBeenCalled();
        });

        it('deve retornar 500 em caso de erro no serviço ao listar', async () => {
            const req = {
                params: { idCondominio: '1' },
                usuario: { id: 5, perfil: 'MORADOR', id_condominio: 1 }
            };
            const res = criarResposta();
            reservaSalaoService.listar.mockRejectedValue(new Error('Erro interno'));

            await reservaSalaoController.listar(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ erro: 'Erro interno' });
        });
    });

    describe('obterPorId', () => {
        it('deve obter reserva por id com sucesso', async () => {
            const req = {
                params: { idCondominio: '1', id: '10' },
                usuario: { id: 5, perfil: 'MORADOR', id_condominio: 1 }
            };
            const res = criarResposta();
            const reserva = { id: 10, id_condominio: 1, data_reserva: '2026-12-25' };

            reservaSalaoService.buscarPorId.mockResolvedValue(reserva);

            await reservaSalaoController.obterPorId(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(reserva);
        });

        it('deve barrar morador ao tentar obter reserva que pertence a outro condomínio', async () => {
            const req = {
                params: { idCondominio: '1', id: '10' },
                usuario: { id: 5, perfil: 'MORADOR', id_condominio: 1 }
            };
            const res = criarResposta();
            const reserva = { id: 10, id_condominio: 2, data_reserva: '2026-12-25' };

            reservaSalaoService.buscarPorId.mockResolvedValue(reserva);

            await reservaSalaoController.obterPorId(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                erro: 'Acesso negado. Você só pode acessar o seu próprio condomínio.'
            });
        });

        it('deve retornar status e erro em caso de falha no serviço em obterPorId', async () => {
            const req = {
                params: { idCondominio: '1', id: '10' },
                usuario: { id: 5, perfil: 'MORADOR', id_condominio: 1 }
            };
            const res = criarResposta();
            const erro = Object.assign(new Error('Não encontrada'), { status: 404 });
            reservaSalaoService.buscarPorId.mockRejectedValue(erro);

            await reservaSalaoController.obterPorId(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ erro: 'Não encontrada' });
        });
    });

    describe('cancelar', () => {
        it('deve cancelar reserva com sucesso', async () => {
            const req = {
                params: { idCondominio: '1', id: '10' },
                usuario: { id: 5, perfil: 'MORADOR', id_condominio: 1 }
            };
            const res = criarResposta();

            reservaSalaoService.cancelar.mockResolvedValue({ mensagem: 'Reserva cancelada com sucesso.' });

            await reservaSalaoController.cancelar(req, res);

            expect(reservaSalaoService.cancelar).toHaveBeenCalledWith(10, req.usuario);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ mensagem: 'Reserva cancelada com sucesso.' });
        });

        it('deve negar morador cancelando reserva informando outro idCondominio na rota', async () => {
            const req = {
                params: { idCondominio: '99', id: '10' },
                usuario: { id: 5, perfil: 'MORADOR', id_condominio: 1 }
            };
            const res = criarResposta();

            await reservaSalaoController.cancelar(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(reservaSalaoService.cancelar).not.toHaveBeenCalled();
        });

        it('deve retornar status de erro em caso de falha no serviço ao cancelar', async () => {
            const req = {
                params: { idCondominio: '1', id: '10' },
                usuario: { id: 5, perfil: 'MORADOR', id_condominio: 1 }
            };
            const res = criarResposta();
            const erro = Object.assign(new Error('Reserva já cancelada'), { status: 400 });
            reservaSalaoService.cancelar.mockRejectedValue(erro);

            await reservaSalaoController.cancelar(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ erro: 'Reserva já cancelada' });
        });
    });
});
