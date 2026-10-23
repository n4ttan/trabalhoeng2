// Testes unitários para o serviço de condomínios, garantindo que a lógica de negócios funcione corretamente,
jest.mock('../src/repositories/condominioRepository', () => ({
    criarCondominio: jest.fn(),
    excluirCondominio: jest.fn(),
    listarCondominios: jest.fn(),
    buscarPorId: jest.fn(),
    listarMoradores: jest.fn(),
    adicionarMoradorAoCondominio: jest.fn(),
    definirMoradorBloco: jest.fn(),
    recalcularNumeroMoradores: jest.fn(),
    atribuirSindicoCondominio: jest.fn(),
    criarBloco: jest.fn(),
    listarBlocos: jest.fn(),
    atribuirGestor: jest.fn(),
    listarGerenciamentosUsuario: jest.fn()
}));

const repository = require('../src/repositories/condominioRepository');
const service = require('../src/services/condominioService');

describe('condominioService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('criarCondominio', () => {
        test('cria condomínio e remove espaços extras do nome', async () => {
            repository.criarCondominio.mockResolvedValue(10);

            await expect(
                service.criarCondominio('  Condomínio Central  ')
            ).resolves.toEqual({
                id: 10,
                nome: 'Condomínio Central'
            });

            expect(repository.criarCondominio)
                .toHaveBeenCalledWith('Condomínio Central');
        });

        test.each([null, undefined, '', '   ', 123])(
            'rejeita nome inválido: %p',
            async (nome) => {
                await expect(
                    service.criarCondominio(nome)
                ).rejects.toMatchObject({
                    status: 400,
                    codigo: 'NOME_OBRIGATORIO'
                });

                expect(repository.criarCondominio)
                    .not.toHaveBeenCalled();
            }
        );
    });

    describe('excluirCondominio', () => {
        test('exclui condomínio existente', async () => {
            repository.excluirCondominio.mockResolvedValue(true);

            await expect(
                service.excluirCondominio('10')
            ).resolves.toEqual({
                mensagem: 'Condomínio excluído com sucesso.'
            });

            expect(repository.excluirCondominio)
                .toHaveBeenCalledWith(10);
        });

        test('rejeita ID inválido', async () => {
            await expect(
                service.excluirCondominio('abc')
            ).rejects.toMatchObject({
                status: 400,
                codigo: 'ID_INVALIDO'
            });
        });

        test('retorna 404 quando o condomínio não existe', async () => {
            repository.excluirCondominio.mockResolvedValue(false);

            await expect(
                service.excluirCondominio(999)
            ).rejects.toMatchObject({
                status: 404,
                codigo: 'CONDOMINIO_NAO_ENCONTRADO'
            });
        });
    });

    describe('listarCondominios', () => {
        test('delega a listagem ao repositório', async () => {
            const lista = [{ id: 1, nome: 'Condomínio Central' }];
            repository.listarCondominios.mockResolvedValue(lista);

            await expect(service.listarCondominios())
                .resolves.toEqual(lista);
        });
    });

    describe('buscarCondominioPorId', () => {
        test('retorna condomínio encontrado', async () => {
            const condominio = { id: 1, nome: 'Central' };
            repository.buscarPorId.mockResolvedValue(condominio);

            await expect(service.buscarCondominioPorId(1))
                .resolves.toEqual(condominio);
        });

        test('retorna 404 quando não encontra condomínio', async () => {
            repository.buscarPorId.mockResolvedValue(null);

            await expect(service.buscarCondominioPorId(999))
                .rejects.toMatchObject({
                    status: 404,
                    codigo: 'CONDOMINIO_NAO_ENCONTRADO'
                });
        });
    });

    describe('adicionarMorador', () => {
        test('valida os IDs', async () => {
            await expect(
                service.adicionarMorador(0, 20)
            ).rejects.toMatchObject({
                status: 400,
                codigo: 'DADOS_INVALIDOS'
            });
        });

        test('rejeita condomínio inexistente', async () => {
            repository.buscarPorId.mockResolvedValue(null);

            await expect(
                service.adicionarMorador(1, 20)
            ).rejects.toMatchObject({
                status: 404,
                codigo: 'CONDOMINIO_NAO_ENCONTRADO'
            });
        });

        test('adiciona morador e recalcula quantidade', async () => {
            repository.buscarPorId.mockResolvedValue({ id: 1 });
            repository.adicionarMoradorAoCondominio.mockResolvedValue(true);
            repository.recalcularNumeroMoradores.mockResolvedValue();

            await expect(
                service.adicionarMorador(1, 20, 3, 'A-12')
            ).resolves.toEqual({
                mensagem: 'Morador adicionado ao condomínio com sucesso.'
            });

            expect(repository.adicionarMoradorAoCondominio)
                .toHaveBeenCalledWith(20, 1, 3, 'A-12');
            expect(repository.recalcularNumeroMoradores)
                .toHaveBeenCalledWith(1);
        });

        test('retorna 404 se o usuário não for encontrado', async () => {
            repository.buscarPorId.mockResolvedValue({ id: 1 });
            repository.adicionarMoradorAoCondominio.mockResolvedValue(false);

            await expect(
                service.adicionarMorador(1, 20)
            ).rejects.toMatchObject({
                status: 404,
                codigo: 'USUARIO_NAO_ENCONTRADO'
            });

            expect(repository.recalcularNumeroMoradores)
                .not.toHaveBeenCalled();
        });
    });

    describe('definirMoradorBloco', () => {
        test('define bloco e recalcula quantidade', async () => {
            repository.buscarPorId.mockResolvedValue({ id: 1 });
            repository.definirMoradorBloco.mockResolvedValue(true);
            repository.recalcularNumeroMoradores.mockResolvedValue();

            await expect(
                service.definirMoradorBloco(1, 20, 3, 'Bloco A', 'A-12')
            ).resolves.toEqual({
                mensagem: 'Morador atribuído ao bloco com sucesso.'
            });

            expect(repository.definirMoradorBloco)
                .toHaveBeenCalledWith(20, 1, 3, 'Bloco A', 'A-12');
            expect(repository.recalcularNumeroMoradores)
                .toHaveBeenCalledWith(1);
        });

        test('rejeita usuário não encontrado', async () => {
            repository.buscarPorId.mockResolvedValue({ id: 1 });
            repository.definirMoradorBloco.mockResolvedValue(false);

            await expect(
                service.definirMoradorBloco(1, 20, 3)
            ).rejects.toMatchObject({
                status: 404,
                codigo: 'USUARIO_NAO_ENCONTRADO'
            });
        });
    });

    describe('listarMoradores', () => {
        test('rejeita ID de condomínio inválido', async () => {
            await expect(
                service.listarMoradores('abc')
            ).rejects.toMatchObject({
                status: 400,
                codigo: 'ID_INVALIDO'
            });
        });

        test('lista moradores com filtro de bloco', async () => {
            const moradores = [{ id: 20, nome: 'Morador Teste' }];
            repository.listarMoradores.mockResolvedValue(moradores);

            await expect(service.listarMoradores('1', 3))
                .resolves.toEqual(moradores);

            expect(repository.listarMoradores)
                .toHaveBeenCalledWith(1, 3);
        });
    });

    describe('criarBloco', () => {
        test('cria bloco com nome normalizado', async () => {
            repository.criarBloco.mockResolvedValue(7);

            await expect(
                service.criarBloco('1', '  Bloco A  ')
            ).resolves.toEqual({
                id: 7,
                nome: 'Bloco A',
                id_condominio: 1
            });

            expect(repository.criarBloco)
                .toHaveBeenCalledWith('Bloco A', 1);
        });

        test('rejeita ID ou nome inválido', async () => {
            await expect(
                service.criarBloco(0, 'Bloco A')
            ).rejects.toMatchObject({
                status: 400,
                codigo: 'DADOS_INVALIDOS'
            });

            await expect(
                service.criarBloco(1, '   ')
            ).rejects.toMatchObject({
                status: 400,
                codigo: 'DADOS_INVALIDOS'
            });
        });
    });

    describe('listarBlocos', () => {
        test('rejeita ID inválido', async () => {
            await expect(
                service.listarBlocos('abc')
            ).rejects.toMatchObject({
                status: 400,
                codigo: 'ID_INVALIDO'
            });
        });

        test('delega listagem ao repositório', async () => {
            repository.listarBlocos.mockResolvedValue([{ id: 3, nome: 'A' }]);

            await expect(service.listarBlocos('1'))
                .resolves.toEqual([{ id: 3, nome: 'A' }]);

            expect(repository.listarBlocos).toHaveBeenCalledWith(1);
        });
    });

    describe('atribuirGestao', () => {
        test('rejeita usuário ou lista inválida', async () => {
            await expect(
                service.atribuirGestao(0, [1])
            ).rejects.toMatchObject({
                status: 400,
                codigo: 'DADOS_INVALIDOS'
            });

            await expect(
                service.atribuirGestao(20, [])
            ).rejects.toMatchObject({
                status: 400,
                codigo: 'DADOS_INVALIDOS'
            });
        });

        test('atribui condomínios e blocos', async () => {
            repository.atribuirGestor
                .mockResolvedValueOnce(100)
                .mockResolvedValueOnce(101);

            await expect(
                service.atribuirGestao(20, [
                    1,
                    { condominioId: 2, blocoId: 5 },
                    {}
                ])
            ).resolves.toEqual({
                mensagem: 'Gerenciamento atribuído com sucesso.',
                atribuicoes: [
                    { id: 100, condominioId: 1, blocoId: null },
                    { id: 101, condominioId: 2, blocoId: 5 }
                ]
            });

            expect(repository.atribuirGestor)
                .toHaveBeenNthCalledWith(1, 20, 1, null);
            expect(repository.atribuirGestor)
                .toHaveBeenNthCalledWith(2, 20, 2, 5);
        });
    });

    describe('listarGerenciamentosUsuario', () => {
        test('rejeita ID inválido', async () => {
            await expect(
                service.listarGerenciamentosUsuario('abc')
            ).rejects.toMatchObject({
                status: 400,
                codigo: 'ID_INVALIDO'
            });
        });

        test('delega a consulta ao repositório', async () => {
            const gerenciamentos = [{ condominio_id: 1, bloco_id: null }];
            repository.listarGerenciamentosUsuario.mockResolvedValue(gerenciamentos);

            await expect(
                service.listarGerenciamentosUsuario('20')
            ).resolves.toEqual(gerenciamentos);

            expect(repository.listarGerenciamentosUsuario)
                .toHaveBeenCalledWith(20);
        });
    });
});
