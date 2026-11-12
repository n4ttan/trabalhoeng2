jest.mock('../src/services/reuniaoService', () => ({
    listarPorCondominio: jest.fn(),
    criar: jest.fn(),
    deletar: jest.fn()
}));

const reuniaoService = require('../src/services/reuniaoService');
const reuniaoController = require('../src/controllers/reuniaoController');

function criarResposta() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
}

describe('reuniaoController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('listarReunioes', () => {
        it('deve listar reuniões com sucesso', async () => {
            const req = { params: { idCondominio: '1' } };
            const res = criarResposta();
            const reunioes = [{ id: 1, titulo: 'Assembleia Ordinária' }];

            reuniaoService.listarPorCondominio.mockResolvedValue(reunioes);

            await reuniaoController.listarReunioes(req, res);

            expect(reuniaoService.listarPorCondominio).toHaveBeenCalledWith('1');
            expect(res.json).toHaveBeenCalledWith(reunioes);
        });

        it('deve retornar status 500 em caso de erro', async () => {
            const req = { params: { idCondominio: '1' } };
            const res = criarResposta();

            reuniaoService.listarPorCondominio.mockRejectedValue(new Error('Falha no banco'));

            await reuniaoController.listarReunioes(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ erro: 'Falha no banco' });
        });
    });

    describe('criarReuniao', () => {
        it('deve criar uma reunião com status 201', async () => {
            const req = {
                params: { idCondominio: '1' },
                body: {
                    titulo: 'Reunião de Condomínio',
                    pauta: 'Reforma da Fachada',
                    data_hora: '2026-11-20 19:00',
                    local_link: 'Salão de Festas'
                }
            };
            const res = criarResposta();
            const reuniaoCriada = { id: 10, ...req.body };

            reuniaoService.criar.mockResolvedValue(reuniaoCriada);

            await reuniaoController.criarReuniao(req, res);

            expect(reuniaoService.criar).toHaveBeenCalledWith({
                id_condominio: '1',
                titulo: 'Reunião de Condomínio',
                pauta: 'Reforma da Fachada',
                data_hora: '2026-11-20 19:00',
                local_link: 'Salão de Festas'
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(reuniaoCriada);
        });

        it('deve retornar status 400 se faltar título ou data_hora', async () => {
            const req = {
                params: { idCondominio: '1' },
                body: { pauta: 'Reforma' }
            };
            const res = criarResposta();

            await reuniaoController.criarReuniao(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ erro: 'Título e Data/Hora são obrigatórios.' });
        });

        it('deve retornar status 500 em caso de erro inesperado', async () => {
            const req = {
                params: { idCondominio: '1' },
                body: { titulo: 'Reunião', data_hora: '2026-11-20 19:00' }
            };
            const res = criarResposta();

            reuniaoService.criar.mockRejectedValue(new Error('Erro de inserção'));

            await reuniaoController.criarReuniao(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ erro: 'Erro de inserção' });
        });
    });

    describe('deletarReuniao', () => {
        it('deve deletar reunião com sucesso', async () => {
            const req = { params: { reuniaoId: '5' } };
            const res = criarResposta();

            reuniaoService.deletar.mockResolvedValue(true);

            await reuniaoController.deletarReuniao(req, res);

            expect(reuniaoService.deletar).toHaveBeenCalledWith('5');
            expect(res.json).toHaveBeenCalledWith({ mensagem: 'Reunião cancelada com sucesso.' });
        });

        it('deve retornar status 500 em caso de erro na exclusão', async () => {
            const req = { params: { reuniaoId: '5' } };
            const res = criarResposta();

            reuniaoService.deletar.mockRejectedValue(new Error('Falha ao excluir'));

            await reuniaoController.deletarReuniao(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ erro: 'Falha ao excluir' });
        });
    });
});
