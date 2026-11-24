jest.mock('../src/repositories/multaRepository');

const repo = require('../src/repositories/multaRepository');
const service = require('../src/services/multaService');

const valido = { id_usuario: 3, valor: '50.5', motivo: ' Barulho ', data_multa: '2026-01-01' };

describe('multaService', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('criar', () => {
        it('salva multa com valor numérico e motivo aparado', async () => {
            repo.buscarMorador.mockResolvedValue({ id: 3 });
            repo.salvar.mockResolvedValue({ id: 1 });

            expect(await service.criar(1, valido)).toEqual({ id: 1 });
            expect(repo.salvar).toHaveBeenCalledWith({
                id_condominio: 1, id_usuario: 3, valor: 50.5, motivo: 'Barulho', data_multa: '2026-01-01'
            });
        });

        it.each([
            [{ ...valido, id_usuario: undefined }],
            [{ ...valido, motivo: '  ' }],
            [{ ...valido, data_multa: '' }],
            [{ ...valido, valor: 0 }],
            [{ ...valido, valor: 'abc' }],
            [{ ...valido, data_multa: 'xx' }],
            [undefined]
        ])('rejeita dados inválidos com 400 (%#)', async (dados) => {
            await expect(service.criar(1, dados)).rejects.toMatchObject({ status: 400 });
            expect(repo.salvar).not.toHaveBeenCalled();
        });

        it('rejeita morador de outro condomínio com 404', async () => {
            repo.buscarMorador.mockResolvedValue(null);
            await expect(service.criar(1, valido)).rejects.toMatchObject({ status: 404 });
        });
    });

    it('listarPorCondominio e listarMinhas delegam ao repositório', async () => {
        repo.listarPorCondominio.mockResolvedValue([1]);
        repo.listarPorUsuario.mockResolvedValue([2]);
        expect(await service.listarPorCondominio(1)).toEqual([1]);
        expect(await service.listarMinhas(1, { id: 3 })).toEqual([2]);
        expect(repo.listarPorUsuario).toHaveBeenCalledWith(1, 3);
    });

    describe('atualizarStatus', () => {
        it('marca multa pendente como paga', async () => {
            repo.buscarPorId.mockResolvedValue({ id: 5, id_condominio: 1, status: 'PENDENTE' });
            const r = await service.atualizarStatus(1, 5, 'PAGA');
            expect(repo.atualizarStatus).toHaveBeenCalledWith(5, 'PAGA');
            expect(r.status).toBe('PAGA');
        });

        it('rejeita status inválido (400)', async () => {
            await expect(service.atualizarStatus(1, 5, 'PENDENTE')).rejects.toMatchObject({ status: 400 });
        });

        it('rejeita multa inexistente ou de outro condomínio (404)', async () => {
            repo.buscarPorId.mockResolvedValue(null);
            await expect(service.atualizarStatus(1, 5, 'PAGA')).rejects.toMatchObject({ status: 404 });
            repo.buscarPorId.mockResolvedValue({ id: 5, id_condominio: 2, status: 'PENDENTE' });
            await expect(service.atualizarStatus(1, 5, 'PAGA')).rejects.toMatchObject({ status: 404 });
        });

        it('rejeita multa já finalizada (400)', async () => {
            repo.buscarPorId.mockResolvedValue({ id: 5, id_condominio: 1, status: 'PAGA' });
            await expect(service.atualizarStatus(1, 5, 'CANCELADA')).rejects.toMatchObject({ status: 400 });
        });
    });
});
