jest.mock('../src/services/manutencaoService', () => ({
    abrir: jest.fn(),
    listar: jest.fn(),
    atualizarStatus: jest.fn()
}));

const service = require('../src/services/manutencaoService');
const controller = require('../src/controllers/manutencaoController');

const resposta = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() });
const morador = { id: 5, perfil: 'MORADOR', id_condominio: 1 };

describe('manutencaoController', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('criar', () => {
        const body = { titulo: 'T', descricao: 'D', local: 'L', prioridade: 'ALTA' };

        it('201 em sucesso', async () => {
            service.abrir.mockResolvedValue(4);
            const res = resposta();
            await controller.criar({ params: { idCondominio: '1' }, usuario: morador, body }, res);
            expect(service.abrir).toHaveBeenCalledWith({ id_condominio: 1, id_usuario: 5, ...body });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 4 }));
        });

        it('403 para outro condomínio', async () => {
            const res = resposta();
            await controller.criar({ params: { idCondominio: '2' }, usuario: morador, body }, res);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(service.abrir).not.toHaveBeenCalled();
        });

        it('usa status do erro do service', async () => {
            service.abrir.mockRejectedValue(Object.assign(new Error('x'), { status: 422 }));
            const res = resposta();
            await controller.criar({ params: { idCondominio: '1' }, usuario: morador, body }, res);
            expect(res.status).toHaveBeenCalledWith(422);
        });

        it('400 por padrão', async () => {
            service.abrir.mockRejectedValue(new Error('x'));
            const res = resposta();
            await controller.criar({ params: { idCondominio: '1' }, usuario: morador, body }, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('listar', () => {
        it('200 com a lista', async () => {
            service.listar.mockResolvedValue([{ id: 1 }]);
            const res = resposta();
            await controller.listar({ params: { idCondominio: '1' }, usuario: morador }, res);
            expect(service.listar).toHaveBeenCalledWith('1', morador);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([{ id: 1 }]);
        });

        it('admin acessa qualquer condomínio', async () => {
            service.listar.mockResolvedValue([]);
            const res = resposta();
            await controller.listar({ params: { idCondominio: '9' }, usuario: { id: 1, perfil: 'ADMIN' } }, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('403 para outro condomínio', async () => {
            const res = resposta();
            await controller.listar({ params: { idCondominio: '2' }, usuario: { id: 1, perfil: 'SINDICO', id_condominio: 1 } }, res);
            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('500 em erro genérico', async () => {
            service.listar.mockRejectedValue(new Error('db'));
            const res = resposta();
            await controller.listar({ params: { idCondominio: '1' }, usuario: morador }, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });

        it('mensagem padrão se erro sem texto', async () => {
            service.listar.mockRejectedValue({});
            const res = resposta();
            await controller.listar({ params: { idCondominio: '1' }, usuario: morador }, res);
            expect(res.json).toHaveBeenCalledWith({ erro: 'Erro ao buscar manutenções.' });
        });
    });

    describe('atualizarStatus', () => {
        const sindico = { id: 2, perfil: 'SINDICO', id_condominio: 1 };

        it('200 em sucesso', async () => {
            service.atualizarStatus.mockResolvedValue({ mensagem: 'ok' });
            const res = resposta();
            await controller.atualizarStatus({ params: { idCondominio: '1', id: '3' }, usuario: sindico, body: { status: 'CONCLUIDO' } }, res);
            expect(service.atualizarStatus).toHaveBeenCalledWith('3', '1', 'CONCLUIDO');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('403 para outro condomínio', async () => {
            const res = resposta();
            await controller.atualizarStatus({ params: { idCondominio: '2', id: '3' }, usuario: sindico, body: {} }, res);
            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('propaga status do erro', async () => {
            service.atualizarStatus.mockRejectedValue(Object.assign(new Error('nf'), { status: 404 }));
            const res = resposta();
            await controller.atualizarStatus({ params: { idCondominio: '1', id: '3' }, usuario: sindico, body: { status: 'ABERTO' } }, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('400 por padrão', async () => {
            service.atualizarStatus.mockRejectedValue(new Error('x'));
            const res = resposta();
            await controller.atualizarStatus({ params: { idCondominio: '1', id: '3' }, usuario: sindico, body: {} }, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});
