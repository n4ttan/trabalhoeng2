jest.mock('../src/services/ocorrenciaService', () => ({
    registrar: jest.fn(),
    listarPorCondominio: jest.fn(),
    listarMinhas: jest.fn(),
    atualizar: jest.fn()
}));

const service = require('../src/services/ocorrenciaService');
const controller = require('../src/controllers/ocorrenciaController');

function criarResposta() {
    return { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
}

describe('ocorrenciaController', () => {
    beforeEach(() => jest.clearAllMocks());

    it('registrar retorna 201', async () => {
        const req = {
            params: { idCondominio: '1' },
            usuario: { id: 7 },
            body: { titulo: 'T', descricao: 'D', categoria: 'BARULHO', data_ocorrencia: '2026-01-01' }
        };
        const res = criarResposta();
        service.registrar.mockResolvedValue({ id: 1 });

        await controller.registrar(req, res);

        expect(service.registrar).toHaveBeenCalledWith({ id_condominio: 1, id_usuario: 7, ...req.body });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ id: 1 });
    });

    it('registrar usa statusCode do erro', async () => {
        const res = criarResposta();
        service.registrar.mockRejectedValue(Object.assign(new Error('Inválido'), { statusCode: 400 }));
        await controller.registrar({ params: {}, usuario: {}, body: {} }, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ erro: 'Inválido' });
    });

    it('registrar usa 500 e mensagem padrão sem detalhes', async () => {
        const res = criarResposta();
        service.registrar.mockRejectedValue({});
        await controller.registrar({ params: {}, usuario: {}, body: {} }, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ erro: 'Erro ao registrar ocorrência.' });
    });

    it('listar retorna lista do condomínio', async () => {
        const res = criarResposta();
        service.listarPorCondominio.mockResolvedValue([{ id: 1 }]);
        await controller.listar({ params: { idCondominio: '1' } }, res);
        expect(service.listarPorCondominio).toHaveBeenCalledWith('1');
        expect(res.json).toHaveBeenCalledWith([{ id: 1 }]);
    });

    it('listar retorna 500 em erro', async () => {
        const res = criarResposta();
        service.listarPorCondominio.mockRejectedValue(new Error('db'));
        await controller.listar({ params: {} }, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ erro: 'db' });
    });

    it('listarMinhas usa id do token', async () => {
        const res = criarResposta();
        service.listarMinhas.mockResolvedValue([{ id: 2 }]);
        await controller.listarMinhas({ params: { idCondominio: '1' }, usuario: { id: 7 } }, res);
        expect(service.listarMinhas).toHaveBeenCalledWith('1', 7);
        expect(res.json).toHaveBeenCalledWith([{ id: 2 }]);
    });

    it('listarMinhas retorna 500 em erro', async () => {
        const res = criarResposta();
        service.listarMinhas.mockRejectedValue(new Error('db'));
        await controller.listarMinhas({ params: {}, usuario: {} }, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('atualizar retorna resultado', async () => {
        const res = criarResposta();
        service.atualizar.mockResolvedValue({ id: 3 });
        await controller.atualizar(
            { params: { idCondominio: '1', id: '3' }, body: { status: 'RESOLVIDA', resposta: 'ok' } }, res
        );
        expect(service.atualizar).toHaveBeenCalledWith('1', '3', { status: 'RESOLVIDA', resposta: 'ok' });
        expect(res.json).toHaveBeenCalledWith({ id: 3 });
    });

    it('atualizar propaga 404', async () => {
        const res = criarResposta();
        service.atualizar.mockRejectedValue(Object.assign(new Error('Não encontrada'), { statusCode: 404 }));
        await controller.atualizar({ params: {}, body: {} }, res);
        expect(res.status).toHaveBeenCalledWith(404);
    });
});
