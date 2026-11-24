jest.mock('../src/repositories/ocorrenciaRepository', () => ({
    salvar: jest.fn(),
    buscarPorCondominio: jest.fn(),
    buscarPorUsuario: jest.fn(),
    atualizar: jest.fn()
}));

const repo = require('../src/repositories/ocorrenciaRepository');
const service = require('../src/services/ocorrenciaService');

const valido = {
    id_condominio: 1,
    id_usuario: 2,
    titulo: '  Barulho  ',
    descricao: ' Muito alto ',
    categoria: 'BARULHO',
    data_ocorrencia: '2026-05-10'
};

describe('ocorrenciaService', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('registrar', () => {
        it('salva com campos aparados', async () => {
            repo.salvar.mockResolvedValue({ id: 1 });
            expect(await service.registrar(valido)).toEqual({ id: 1 });
            expect(repo.salvar).toHaveBeenCalledWith({ ...valido, titulo: 'Barulho', descricao: 'Muito alto' });
        });

        it.each([
            [{ titulo: ' ' }, 'obrigatórios'],
            [{ descricao: undefined }, 'obrigatórios'],
            [{ categoria: undefined }, 'obrigatórios'],
            [{ data_ocorrencia: undefined }, 'obrigatórios'],
            [{ categoria: 'XYZ' }, 'Categoria inválida'],
            [{ data_ocorrencia: '10/05/2026' }, 'Data inválida'],
            [{ data_ocorrencia: '2026-13-45' }, 'Data inválida']
        ])('rejeita com 400 %j', async (alteracao, msg) => {
            await expect(service.registrar({ ...valido, ...alteracao }))
                .rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining(msg) });
            expect(repo.salvar).not.toHaveBeenCalled();
        });
    });

    it('listarPorCondominio delega ao repositório', async () => {
        repo.buscarPorCondominio.mockResolvedValue([1]);
        expect(await service.listarPorCondominio(1)).toEqual([1]);
        expect(repo.buscarPorCondominio).toHaveBeenCalledWith(1);
    });

    it('listarMinhas delega ao repositório', async () => {
        repo.buscarPorUsuario.mockResolvedValue([2]);
        expect(await service.listarMinhas(1, 9)).toEqual([2]);
        expect(repo.buscarPorUsuario).toHaveBeenCalledWith(1, 9);
    });

    describe('atualizar', () => {
        it('atualiza status e resposta', async () => {
            repo.atualizar.mockResolvedValue(true);
            expect(await service.atualizar(1, '3', { status: 'EM_ANALISE', resposta: ' vamos ver ' }))
                .toEqual({ id: 3, status: 'EM_ANALISE', resposta: 'vamos ver' });
            expect(repo.atualizar).toHaveBeenCalledWith(1, '3', { status: 'EM_ANALISE', resposta: 'vamos ver' });
        });

        it('resposta vazia vira null', async () => {
            repo.atualizar.mockResolvedValue(true);
            const r = await service.atualizar(1, 3, { status: 'RESOLVIDA' });
            expect(r.resposta).toBeNull();
        });

        it('rejeita status inválido com 400', async () => {
            await expect(service.atualizar(1, 3, { status: 'X' })).rejects.toMatchObject({ statusCode: 400 });
        });

        it('rejeita não encontrada com 404', async () => {
            repo.atualizar.mockResolvedValue(false);
            await expect(service.atualizar(1, 3, { status: 'RESOLVIDA' })).rejects.toMatchObject({ statusCode: 404 });
        });
    });
});
