jest.mock('../src/services/multaService');

const service = require('../src/services/multaService');
const controller = require('../src/controllers/multaController');

const res = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() });
const req = (extra = {}) => ({ params: { idCondominio: '1', id: '5' }, body: {}, usuario: { id: 3 }, ...extra });

describe('multaController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('criar responde 201', async () => {
        service.criar.mockResolvedValue({ id: 1 });
        const r = res();
        await controller.criar(req({ body: { a: 1 } }), r);
        expect(service.criar).toHaveBeenCalledWith(1, { a: 1 });
        expect(r.status).toHaveBeenCalledWith(201);
    });

    it('criar repassa erro de negócio com status', async () => {
        service.criar.mockRejectedValue(Object.assign(new Error('inválido'), { status: 400 }));
        const r = res();
        await controller.criar(req(), r);
        expect(r.status).toHaveBeenCalledWith(400);
        expect(r.json).toHaveBeenCalledWith({ erro: 'inválido' });
    });

    it('listar e listarMinhas retornam lista', async () => {
        service.listarPorCondominio.mockResolvedValue([1]);
        service.listarMinhas.mockResolvedValue([2]);
        const r1 = res();
        const r2 = res();
        await controller.listar(req(), r1);
        await controller.listarMinhas(req(), r2);
        expect(r1.json).toHaveBeenCalledWith([1]);
        expect(service.listarMinhas).toHaveBeenCalledWith(1, { id: 3 });
        expect(r2.json).toHaveBeenCalledWith([2]);
    });

    it('atualizarStatus responde com multa', async () => {
        service.atualizarStatus.mockResolvedValue({ id: 5, status: 'PAGA' });
        const r = res();
        await controller.atualizarStatus(req({ body: { status: 'PAGA' } }), r);
        expect(service.atualizarStatus).toHaveBeenCalledWith(1, 5, 'PAGA');
        expect(r.json).toHaveBeenCalledWith({ mensagem: 'Status da multa atualizado.', multa: { id: 5, status: 'PAGA' } });
    });

    it('erro inesperado vira 500 genérico', async () => {
        service.listarPorCondominio.mockRejectedValue(new Error('db'));
        service.listarMinhas.mockRejectedValue(new Error('db'));
        service.atualizarStatus.mockRejectedValue(new Error('db'));
        for (const [fn, msg] of [
            ['listar', 'Erro ao listar multas.'],
            ['listarMinhas', 'Erro ao listar suas multas.'],
            ['atualizarStatus', 'Erro ao atualizar multa.']
        ]) {
            const r = res();
            await controller[fn](req(), r);
            expect(r.status).toHaveBeenCalledWith(500);
            expect(r.json).toHaveBeenCalledWith({ erro: msg });
        }
    });

    it('criar com erro inesperado vira 500', async () => {
        service.criar.mockRejectedValue(new Error('db'));
        const r = res();
        await controller.criar(req(), r);
        expect(r.json).toHaveBeenCalledWith({ erro: 'Erro ao registrar multa.' });
    });
});
