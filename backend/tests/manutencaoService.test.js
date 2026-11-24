jest.mock('../src/repositories/manutencaoRepository', () => ({
    criar: jest.fn(),
    listar: jest.fn(),
    buscarPorId: jest.fn(),
    atualizarStatus: jest.fn()
}));

const repo = require('../src/repositories/manutencaoRepository');
const service = require('../src/services/manutencaoService');

const base = { id_condominio: 1, id_usuario: 2, titulo: ' Vazamento ', descricao: 'Cano', local: 'Garagem', prioridade: 'ALTA' };

describe('manutencaoService', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('abrir', () => {
        it('cria chamado com campos aparados', async () => {
            repo.criar.mockResolvedValue(7);
            await expect(service.abrir(base)).resolves.toBe(7);
            expect(repo.criar).toHaveBeenCalledWith({ ...base, titulo: 'Vazamento' });
        });

        it('usa prioridade MEDIA por padrão', async () => {
            repo.criar.mockResolvedValue(1);
            await service.abrir({ ...base, prioridade: undefined });
            expect(repo.criar).toHaveBeenCalledWith(expect.objectContaining({ prioridade: 'MEDIA' }));
        });

        it.each([
            [{ id_condominio: null }, 'Condomínio e usuário são obrigatórios.'],
            [{ id_usuario: null }, 'Condomínio e usuário são obrigatórios.'],
            [{ titulo: '  ' }, 'Título, descrição e local são obrigatórios.'],
            [{ descricao: undefined }, 'Título, descrição e local são obrigatórios.'],
            [{ local: 5 }, 'Título, descrição e local são obrigatórios.'],
            [{ titulo: 'a'.repeat(151) }, 'Título e local devem ter no máximo 150 caracteres.'],
            [{ prioridade: 'X' }, 'Prioridade inválida.']
        ])('rejeita dados inválidos %j', async (alteracao, msg) => {
            await expect(service.abrir({ ...base, ...alteracao })).rejects.toMatchObject({ message: msg, status: 400 });
            expect(repo.criar).not.toHaveBeenCalled();
        });
    });

    describe('listar', () => {
        it('síndico vê todos', async () => {
            repo.listar.mockResolvedValue([1]);
            await expect(service.listar('1', { id: 9, perfil: 'SINDICO' })).resolves.toEqual([1]);
            expect(repo.listar).toHaveBeenCalledWith(1, null);
        });

        it('admin vê todos', async () => {
            await service.listar(1, { id: 9, perfil: 'ADMIN' });
            expect(repo.listar).toHaveBeenCalledWith(1, null);
        });

        it('morador vê só os seus', async () => {
            await service.listar(1, { id: 5, perfil: 'MORADOR' });
            expect(repo.listar).toHaveBeenCalledWith(1, 5);
        });

        it('rejeita id inválido', async () => {
            await expect(service.listar('x', { perfil: 'MORADOR' })).rejects.toMatchObject({ status: 400 });
        });
    });

    describe('atualizarStatus', () => {
        it('atualiza status', async () => {
            repo.buscarPorId.mockResolvedValue({ id: 3, id_condominio: 1 });
            await expect(service.atualizarStatus('3', '1', 'CONCLUIDO')).resolves.toEqual({ mensagem: 'Status atualizado com sucesso.' });
            expect(repo.atualizarStatus).toHaveBeenCalledWith(3, 'CONCLUIDO');
        });

        it('rejeita id inválido', async () => {
            await expect(service.atualizarStatus('x', 1, 'ABERTO')).rejects.toMatchObject({ status: 400 });
        });

        it('rejeita status inválido', async () => {
            await expect(service.atualizarStatus(3, 1, 'FOO')).rejects.toMatchObject({ message: 'Status inválido.', status: 400 });
        });

        it('404 se não existir', async () => {
            repo.buscarPorId.mockResolvedValue(null);
            await expect(service.atualizarStatus(3, 1, 'ABERTO')).rejects.toMatchObject({ status: 404 });
        });

        it('404 se for de outro condomínio', async () => {
            repo.buscarPorId.mockResolvedValue({ id: 3, id_condominio: 2 });
            await expect(service.atualizarStatus(3, 1, 'ABERTO')).rejects.toMatchObject({ status: 404 });
            expect(repo.atualizarStatus).not.toHaveBeenCalled();
        });
    });
});
