jest.mock('../src/repositories/database', () => ({ query: jest.fn() }));
jest.mock('../src/repositories/relatorioRepository', () => ({
    moradoresPorStatus: jest.fn(),
    boletosPorStatus: jest.fn(),
    reservasPorMes: jest.fn(),
    reunioesFuturas: jest.fn(),
    notificacoesPorTipo: jest.fn()
}));

const connection = require('../src/repositories/database');
const repoMock = require('../src/repositories/relatorioRepository');
const relatorioService = require('../src/services/relatorioService');
const relatorioController = require('../src/controllers/relatorioController');

const repoReal = jest.requireActual('../src/repositories/relatorioRepository');

describe('relatorioRepository', () => {
    beforeEach(() => jest.clearAllMocks());

    it('executa as consultas com o id do condomínio', async () => {
        connection.query.mockImplementation((sql, params, cb) => cb(null, [{ ok: 1 }]));

        expect(await repoReal.moradoresPorStatus(1)).toEqual([{ ok: 1 }]);
        await repoReal.boletosPorStatus(1);
        await repoReal.reservasPorMes(1, 'reservas_salao');
        await repoReal.reunioesFuturas(1, '2026-01-01T00:00');
        await repoReal.notificacoesPorTipo(1);

        expect(connection.query).toHaveBeenCalledTimes(5);
        connection.query.mock.calls.forEach(([, params]) => expect(params[0]).toBe(1));
        expect(connection.query.mock.calls[3][1]).toEqual([1, '2026-01-01T00:00']);
    });

    it('rejeita em erro do banco', async () => {
        connection.query.mockImplementation((sql, params, cb) => cb(new Error('db')));
        await expect(repoReal.moradoresPorStatus(1)).rejects.toThrow('db');
    });

    it('rejeita tabela de reservas inválida', () => {
        expect(() => repoReal.reservasPorMes(1, 'usuarios; DROP')).toThrow('Tabela de reservas inválida.');
    });
});

describe('relatorioService', () => {
    const sindico = { id: 2, perfil: 'SINDICO', id_condominio: 1 };

    beforeEach(() => {
        jest.clearAllMocks();
        repoMock.moradoresPorStatus.mockResolvedValue([{ status: 'APROVADO', total: 3 }]);
        repoMock.boletosPorStatus.mockResolvedValue([
            { situacao: 'PAGO', quantidade: 2, valor_total: '600.00' },
            { situacao: 'VENCIDO', quantidade: 1, valor_total: '300.00' }
        ]);
        repoMock.reservasPorMes
            .mockResolvedValueOnce([{ mes: '2026-12', total: 2 }])
            .mockResolvedValueOnce([{ mes: '2026-11', total: 1 }, { mes: '2026-12', total: 4 }]);
        repoMock.reunioesFuturas.mockResolvedValue([{ id: 1 }]);
        repoMock.notificacoesPorTipo.mockResolvedValue([{ tipo: 'AVISO', total: 2 }, { tipo: 'URGENTE', total: 1 }]);
    });

    it('agrega o relatório', async () => {
        const r = await relatorioService.obterRelatorio('1', sindico);

        expect(r.id_condominio).toBe(1);
        expect(r.moradoresPorStatus).toEqual([{ status: 'APROVADO', total: 3 }]);
        expect(r.boletos.pagos).toEqual({ quantidade: 2, valor: 600 });
        expect(r.boletos.pendentes).toEqual({ quantidade: 0, valor: 0 });
        expect(r.boletos.vencidos).toEqual({ quantidade: 1, valor: 300 });
        expect(r.reservasPorMes).toEqual([
            { mes: '2026-11', churrasqueira: 0, salao: 1 },
            { mes: '2026-12', churrasqueira: 2, salao: 4 }
        ]);
        expect(r.reunioesFuturas).toEqual([{ id: 1 }]);
        expect(r.notificacoes.total).toBe(3);
        expect(repoMock.reunioesFuturas).toHaveBeenCalledWith(1, expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/));
    });

    it('admin acessa qualquer condomínio', async () => {
        await expect(relatorioService.obterRelatorio(9, { perfil: 'ADMIN' })).resolves.toBeDefined();
    });

    it.each([
        ['id inválido', 'x', sindico, 400],
        ['sem usuário', 1, null, 403],
        ['morador', 1, { perfil: 'MORADOR', id_condominio: 1 }, 403],
        ['síndico de outro condomínio', 2, sindico, 403]
    ])('bloqueia: %s', async (_n, id, usuario, status) => {
        await expect(relatorioService.obterRelatorio(id, usuario)).rejects.toMatchObject({ status });
        expect(repoMock.moradoresPorStatus).not.toHaveBeenCalled();
    });
});

describe('relatorioController', () => {
    const res = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() });
    const req = { params: { idCondominio: '1' }, usuario: { perfil: 'ADMIN' } };
    let spy;
    let svc;

    beforeEach(() => {
        spy = jest.spyOn(console, 'error').mockImplementation(() => {});
        svc = jest.spyOn(relatorioService, 'obterRelatorio');
    });
    afterEach(() => {
        spy.mockRestore();
        svc.mockRestore();
    });

    it('200 com relatório', async () => {
        svc.mockResolvedValue({ a: 1 });
        const r = res();
        await relatorioController.obter(req, r);
        expect(svc).toHaveBeenCalledWith('1', req.usuario);
        expect(r.status).toHaveBeenCalledWith(200);
        expect(r.json).toHaveBeenCalledWith({ a: 1 });
    });

    it('repassa erro com status', async () => {
        svc.mockRejectedValue(Object.assign(new Error('negado'), { status: 403 }));
        const r = res();
        await relatorioController.obter(req, r);
        expect(r.status).toHaveBeenCalledWith(403);
        expect(r.json).toHaveBeenCalledWith({ erro: 'negado' });
    });

    it('500 em erro inesperado', async () => {
        svc.mockRejectedValue(new Error('boom'));
        const r = res();
        await relatorioController.obter(req, r);
        expect(r.status).toHaveBeenCalledWith(500);
    });
});
