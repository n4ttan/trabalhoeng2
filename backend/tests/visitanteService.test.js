jest.mock('../src/repositories/visitanteRepository', () => ({
    criar: jest.fn(),
    listarPorCondominio: jest.fn(),
    listarPorUsuario: jest.fn(),
    buscarPorId: jest.fn(),
    atualizarStatus: jest.fn()
}));

const repo = require('../src/repositories/visitanteRepository');
const service = require('../src/services/visitanteService');

const futuro = (h) => new Date(Date.now() + h * 3600000).toISOString();
const dadosValidos = () => ({
    id_condominio: 1,
    id_usuario: 5,
    nome_visitante: ' Ana ',
    documento: ' 123 ',
    data_prevista: futuro(1),
    validade_ate: futuro(5)
});

describe('visitanteService', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('autorizar', () => {
        it('cria com sucesso e faz trim', async () => {
            repo.criar.mockResolvedValue(9);
            const d = dadosValidos();
            expect(await service.autorizar(d)).toBe(9);
            expect(repo.criar).toHaveBeenCalledWith(expect.objectContaining({ nome_visitante: 'Ana', documento: '123' }));
        });

        it.each([
            ['sem condomínio', { id_condominio: null }, 'Condomínio e usuário'],
            ['sem nome', { nome_visitante: ' ' }, 'Nome e documento'],
            ['sem documento', { documento: '' }, 'Nome e documento'],
            ['sem datas', { data_prevista: null }, 'obrigatórias'],
            ['data inválida', { data_prevista: 'xx' }, 'inválida'],
            ['validade antes da prevista', { validade_ate: new Date(Date.now() + 1000).toISOString() }, 'posterior'],
            ['validade no passado', { data_prevista: futuro(-5), validade_ate: futuro(-1) }, 'passado']
        ])('rejeita %s com 400', async (_, extra, trecho) => {
            await expect(service.autorizar({ ...dadosValidos(), ...extra }))
                .rejects.toMatchObject({ status: 400, message: expect.stringContaining(trecho) });
            expect(repo.criar).not.toHaveBeenCalled();
        });
    });

    describe('listagens', () => {
        it('listarDoCondominio', async () => {
            repo.listarPorCondominio.mockResolvedValue([1]);
            expect(await service.listarDoCondominio('3')).toEqual([1]);
            expect(repo.listarPorCondominio).toHaveBeenCalledWith(3);
            await expect(service.listarDoCondominio('x')).rejects.toMatchObject({ status: 400 });
        });

        it('listarDoMorador', async () => {
            repo.listarPorUsuario.mockResolvedValue([2]);
            expect(await service.listarDoMorador('3', 5)).toEqual([2]);
            expect(repo.listarPorUsuario).toHaveBeenCalledWith(3, 5);
            await expect(service.listarDoMorador('x', 5)).rejects.toMatchObject({ status: 400 });
        });
    });

    describe('cancelar', () => {
        const visitante = (extra = {}) => ({ id: 1, id_condominio: 1, id_usuario: 5, status: 'AUTORIZADO', ...extra });

        it('cancela o próprio', async () => {
            repo.buscarPorId.mockResolvedValue(visitante());
            repo.atualizarStatus.mockResolvedValue(true);
            const r = await service.cancelar('1', 1, { id: 5 });
            expect(r.mensagem).toMatch(/cancelada/);
            expect(repo.atualizarStatus).toHaveBeenCalledWith(1, 'AUTORIZADO', 'CANCELADO');
        });

        it('id inválido 400', async () => {
            await expect(service.cancelar('x', 1, { id: 5 })).rejects.toMatchObject({ status: 400 });
        });

        it('inexistente ou de outro condomínio 404', async () => {
            repo.buscarPorId.mockResolvedValue(null);
            await expect(service.cancelar('1', 1, { id: 5 })).rejects.toMatchObject({ status: 404 });
            repo.buscarPorId.mockResolvedValue(visitante({ id_condominio: 2 }));
            await expect(service.cancelar('1', 1, { id: 5 })).rejects.toMatchObject({ status: 404 });
        });

        it('de outro morador 403', async () => {
            repo.buscarPorId.mockResolvedValue(visitante());
            await expect(service.cancelar('1', 1, { id: 6 })).rejects.toMatchObject({ status: 403 });
        });

        it('status diferente de AUTORIZADO 400', async () => {
            repo.buscarPorId.mockResolvedValue(visitante({ status: 'ENTROU' }));
            await expect(service.cancelar('1', 1, { id: 5 })).rejects.toMatchObject({ status: 400 });
        });

        it('corrida (update sem linhas) 409', async () => {
            repo.buscarPorId.mockResolvedValue(visitante());
            repo.atualizarStatus.mockResolvedValue(false);
            await expect(service.cancelar('1', 1, { id: 5 })).rejects.toMatchObject({ status: 409 });
        });
    });

    describe('portaria', () => {
        const v = (extra = {}) => ({ id: 1, id_condominio: 1, status: 'AUTORIZADO', validade_ate: futuro(2), ...extra });

        it('registra entrada', async () => {
            repo.buscarPorId.mockResolvedValue(v());
            repo.atualizarStatus.mockResolvedValue(true);
            await service.registrarEntrada('1', 1);
            expect(repo.atualizarStatus).toHaveBeenCalledWith(1, 'AUTORIZADO', 'ENTROU');
        });

        it('entrada expirada 400', async () => {
            repo.buscarPorId.mockResolvedValue(v({ validade_ate: futuro(-2) }));
            await expect(service.registrarEntrada('1', 1)).rejects.toMatchObject({ status: 400, message: 'Autorização expirada.' });
        });

        it('entrada com status errado 400', async () => {
            repo.buscarPorId.mockResolvedValue(v({ status: 'CANCELADO' }));
            await expect(service.registrarEntrada('1', 1)).rejects.toMatchObject({ status: 400 });
        });

        it('registra saída (mesmo com validade vencida)', async () => {
            repo.buscarPorId.mockResolvedValue(v({ status: 'ENTROU', validade_ate: futuro(-2) }));
            repo.atualizarStatus.mockResolvedValue(true);
            await service.registrarSaida('1', 1);
            expect(repo.atualizarStatus).toHaveBeenCalledWith(1, 'ENTROU', 'SAIU');
        });

        it('saída sem ter entrado 400', async () => {
            repo.buscarPorId.mockResolvedValue(v());
            await expect(service.registrarSaida('1', 1)).rejects.toMatchObject({ status: 400 });
        });

        it('corrida 409', async () => {
            repo.buscarPorId.mockResolvedValue(v());
            repo.atualizarStatus.mockResolvedValue(false);
            await expect(service.registrarEntrada('1', 1)).rejects.toMatchObject({ status: 409 });
        });
    });
});
