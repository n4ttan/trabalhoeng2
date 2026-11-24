jest.mock('../src/services/visitanteService', () => ({
    autorizar: jest.fn(),
    listarDoMorador: jest.fn(),
    listarDoCondominio: jest.fn(),
    cancelar: jest.fn(),
    registrarEntrada: jest.fn(),
    registrarSaida: jest.fn()
}));

const service = require('../src/services/visitanteService');
const controller = require('../src/controllers/visitanteController');

const criarResposta = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
});
const req = (extra = {}) => ({
    params: { idCondominio: '1', id: '9' },
    usuario: { id: 5, perfil: 'MORADOR', id_condominio: 1 },
    body: {},
    ...extra
});

describe('visitanteController', () => {
    beforeEach(() => jest.clearAllMocks());

    it('autorizar responde 201', async () => {
        service.autorizar.mockResolvedValue(3);
        const res = criarResposta();
        const body = { nome_visitante: 'Ana', documento: '1', data_prevista: 'a', validade_ate: 'b' };
        await controller.autorizar(req({ body }), res);
        expect(service.autorizar).toHaveBeenCalledWith({ id_condominio: 1, id_usuario: 5, ...body });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 3 }));
    });

    it('autorizar usa status do erro ou 400', async () => {
        const res = criarResposta();
        service.autorizar.mockRejectedValue(Object.assign(new Error('x'), { status: 409 }));
        await controller.autorizar(req(), res);
        expect(res.status).toHaveBeenCalledWith(409);
        service.autorizar.mockRejectedValue(new Error('y'));
        await controller.autorizar(req(), res);
        expect(res.status).toHaveBeenLastCalledWith(400);
    });

    it('listarMeus 200 e erro 500', async () => {
        const res = criarResposta();
        service.listarDoMorador.mockResolvedValue([1]);
        await controller.listarMeus(req(), res);
        expect(service.listarDoMorador).toHaveBeenCalledWith(1, 5);
        expect(res.status).toHaveBeenCalledWith(200);
        service.listarDoMorador.mockRejectedValue(new Error('x'));
        await controller.listarMeus(req(), res);
        expect(res.status).toHaveBeenLastCalledWith(500);
    });

    it('listar 200 e erro 500', async () => {
        const res = criarResposta();
        service.listarDoCondominio.mockResolvedValue([1]);
        await controller.listar(req(), res);
        expect(res.json).toHaveBeenCalledWith([1]);
        service.listarDoCondominio.mockRejectedValue(new Error('x'));
        await controller.listar(req(), res);
        expect(res.status).toHaveBeenLastCalledWith(500);
    });

    it.each([
        ['cancelar', 'cancelar', ['9', 1, { id: 5, perfil: 'MORADOR', id_condominio: 1 }]],
        ['registrarEntrada', 'registrarEntrada', ['9', 1]],
        ['registrarSaida', 'registrarSaida', ['9', 1]]
    ])('%s 200 e erro com status', async (nome, fn, args) => {
        const res = criarResposta();
        service[fn].mockResolvedValue({ mensagem: 'ok' });
        await controller[nome](req(), res);
        expect(service[fn]).toHaveBeenCalledWith(...args);
        expect(res.status).toHaveBeenCalledWith(200);
        service[fn].mockRejectedValue(Object.assign(new Error('x'), { status: 404 }));
        await controller[nome](req(), res);
        expect(res.status).toHaveBeenLastCalledWith(404);
        service[fn].mockRejectedValue(new Error('y'));
        await controller[nome](req(), res);
        expect(res.status).toHaveBeenLastCalledWith(400);
    });
});
