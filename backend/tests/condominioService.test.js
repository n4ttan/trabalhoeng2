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
    buscarBlocoPorId: jest.fn(),
    atribuirGestores: jest.fn(),
    removerGestao: jest.fn(),
    listarGerenciamentosUsuario: jest.fn()
}));

jest.mock('../src/repositories/usuarioRepository', () => ({
    buscarPorId: jest.fn()
}));

const repository = require('../src/repositories/condominioRepository');
const usuarioRepository = require('../src/repositories/usuarioRepository');
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

        describe('com usuário gestor', () => {
            beforeEach(() => {
                usuarioRepository.buscarPorId.mockResolvedValue({ id: 20, perfil: 'SINDICO' });
                repository.buscarPorId.mockResolvedValue({ id: 1 });
                repository.buscarBlocoPorId.mockResolvedValue({ id: 5, id_condominio: 2 });
                repository.atribuirGestores.mockImplementation(async (id, itens) =>
                    itens.map((item, indice) => ({ id: 100 + indice, ...item, nova: true }))
                );
            });

            test('atribui condomínios e blocos', async () => {
                await expect(
                    service.atribuirGestao('20', [1, { condominioId: 2, blocoId: 5 }])
                ).resolves.toEqual({
                    mensagem: 'Gerenciamento atribuído com sucesso.',
                    atribuicoes: [
                        { id: 100, condominioId: 1, blocoId: null, nova: true },
                        { id: 101, condominioId: 2, blocoId: 5, nova: true }
                    ]
                });

                expect(repository.atribuirGestores).toHaveBeenCalledWith(20, [
                    { condominioId: 1, blocoId: null },
                    { condominioId: 2, blocoId: 5 }
                ]);
            });

            test('descarta repetições do próprio pedido', async () => {
                await service.atribuirGestao(20, [1, { condominioId: 1 }, '1']);

                expect(repository.atribuirGestores).toHaveBeenCalledWith(20, [
                    { condominioId: 1, blocoId: null }
                ]);
                expect(repository.buscarPorId).toHaveBeenCalledTimes(1);
            });

            test.each([
                [{}],
                [{ condominioId: 'abc' }],
                [{ condominioId: 1, blocoId: 'x' }],
                [-3],
                [null]
            ])('rejeita atribuição malformada %j', async (item) => {
                await expect(
                    service.atribuirGestao(20, [item])
                ).rejects.toMatchObject({ status: 400, codigo: 'DADOS_INVALIDOS' });

                expect(repository.atribuirGestores).not.toHaveBeenCalled();
            });

            test('rejeita condomínio inexistente sem gravar nada', async () => {
                repository.buscarPorId.mockResolvedValue(null);

                await expect(
                    service.atribuirGestao(20, [999])
                ).rejects.toMatchObject({ status: 404, codigo: 'CONDOMINIO_NAO_ENCONTRADO' });

                expect(repository.atribuirGestores).not.toHaveBeenCalled();
            });

            test('rejeita bloco inexistente', async () => {
                repository.buscarBlocoPorId.mockResolvedValue(null);

                await expect(
                    service.atribuirGestao(20, [{ condominioId: 2, blocoId: 77 }])
                ).rejects.toMatchObject({ status: 404, codigo: 'BLOCO_NAO_ENCONTRADO' });

                expect(repository.atribuirGestores).not.toHaveBeenCalled();
            });

            test('rejeita bloco que pertence a outro condomínio', async () => {
                await expect(
                    service.atribuirGestao(20, [{ condominioId: 1, blocoId: 5 }])
                ).rejects.toMatchObject({ status: 400, codigo: 'BLOCO_INVALIDO' });

                expect(repository.atribuirGestores).not.toHaveBeenCalled();
            });

            test('valida o pedido inteiro antes de gravar qualquer item', async () => {
                repository.buscarPorId
                    .mockResolvedValueOnce({ id: 1 })
                    .mockResolvedValueOnce(null);

                await expect(
                    service.atribuirGestao(20, [1, 999])
                ).rejects.toMatchObject({ status: 404 });

                expect(repository.atribuirGestores).not.toHaveBeenCalled();
            });
        });

        test('rejeita usuário inexistente', async () => {
            usuarioRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                service.atribuirGestao(20, [1])
            ).rejects.toMatchObject({ status: 404, codigo: 'USUARIO_NAO_ENCONTRADO' });

            expect(repository.atribuirGestores).not.toHaveBeenCalled();
        });

        test('rejeita usuário que não é síndico nem admin', async () => {
            usuarioRepository.buscarPorId.mockResolvedValue({ id: 20, perfil: 'MORADOR' });

            await expect(
                service.atribuirGestao(20, [1])
            ).rejects.toMatchObject({ status: 400, codigo: 'PERFIL_INVALIDO' });

            expect(repository.atribuirGestores).not.toHaveBeenCalled();
        });

        test('aceita administrador como gestor', async () => {
            usuarioRepository.buscarPorId.mockResolvedValue({ id: 20, perfil: 'ADMIN' });
            repository.buscarPorId.mockResolvedValue({ id: 1 });
            repository.atribuirGestores.mockResolvedValue([]);

            await expect(service.atribuirGestao(20, [1])).resolves.toMatchObject({
                mensagem: 'Gerenciamento atribuído com sucesso.'
            });
        });
    });

    describe('removerGestao', () => {
        test('rejeita IDs inválidos', async () => {
            await expect(service.removerGestao(0, 3)).rejects.toMatchObject({ status: 400, codigo: 'ID_INVALIDO' });
            await expect(service.removerGestao(20, 'abc')).rejects.toMatchObject({ status: 400, codigo: 'ID_INVALIDO' });
            expect(repository.removerGestao).not.toHaveBeenCalled();
        });

        test('remove a atribuição do usuário', async () => {
            repository.removerGestao.mockResolvedValue(true);

            await expect(service.removerGestao('20', '3')).resolves.toEqual({
                mensagem: 'Gerenciamento removido com sucesso.'
            });
            expect(repository.removerGestao).toHaveBeenCalledWith(20, 3);
        });

        test('devolve 404 quando a atribuição não existe para o usuário', async () => {
            repository.removerGestao.mockResolvedValue(false);

            await expect(service.removerGestao(20, 3)).rejects.toMatchObject({
                status: 404,
                codigo: 'GERENCIAMENTO_NAO_ENCONTRADO'
            });
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
