// Testes unitários para o repositório de condomínios, garantindo que as operações de criação, exclusão, 
// listagem e atualização funcionem corretamente, incluindo tratamento de erros do banco de dados.
jest.mock('../src/repositories/database', () => ({
    query: jest.fn(),
    beginTransaction: jest.fn((callback) => callback(null)),
    commit: jest.fn((callback) => callback(null)),
    rollback: jest.fn((callback) => callback())
}));

const connection = require('../src/repositories/database');
const repository = require('../src/repositories/condominioRepository');

describe('condominioRepository', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    function responder(error, results) {
        connection.query.mockImplementation((sql, params, callback) => {
            if (typeof params === 'function') callback = params;
            callback(error, results);
        });
    }

    function falharConsulta() {
        responder(new Error('Erro simulado no banco'), null);
    }

    test('criarCondominio retorna o ID criado', async () => {
        responder(null, { insertId: 12 });
        await expect(repository.criarCondominio('Residencial')).resolves.toBe(12);
        expect(connection.query).toHaveBeenCalledWith(
            'INSERT INTO condominios (nome, numero_moradores) VALUES (?, 0)',
            ['Residencial'],
            expect.any(Function)
        );
    });

    test('criarCondominio rejeita erro do banco', async () => {
        falharConsulta();
        await expect(repository.criarCondominio('Residencial')).rejects.toThrow('Erro simulado no banco');
    });

    test.each([
        [{ affectedRows: 1 }, true],
        [{ affectedRows: 0 }, false]
    ])('excluirCondominio retorna o resultado da exclusão', async (resultado, esperado) => {
        responder(null, resultado);
        await expect(repository.excluirCondominio(1)).resolves.toBe(esperado);
    });

    test('excluirCondominio rejeita erro do banco', async () => {
        falharConsulta();
        await expect(repository.excluirCondominio(1)).rejects.toThrow('Erro simulado no banco');
    });

    test('listarCondominios retorna os resultados', async () => {
        const dados = [{ id: 1, nome: 'Residencial' }];
        responder(null, dados);
        await expect(repository.listarCondominios()).resolves.toEqual(dados);
    });

    test('listarCondominios rejeita erro do banco', async () => {
        falharConsulta();
        await expect(repository.listarCondominios()).rejects.toThrow('Erro simulado no banco');
    });

    test.each([
        [[{ id: 1, nome: 'Residencial' }], { id: 1, nome: 'Residencial' }],
        [[], null]
    ])('buscarPorId retorna o primeiro resultado ou null', async (dados, esperado) => {
        responder(null, dados);
        await expect(repository.buscarPorId(1)).resolves.toEqual(esperado);
    });

    test('buscarPorId rejeita erro do banco', async () => {
        falharConsulta();
        await expect(repository.buscarPorId(1)).rejects.toThrow('Erro simulado no banco');
    });

    test('listarMoradores consulta todos os moradores sem filtro de bloco', async () => {
        const dados = [{ id: 2, nome: 'Morador' }];
        responder(null, dados);

        await expect(repository.listarMoradores(1)).resolves.toEqual(dados);

        const [sql, params] = connection.query.mock.calls[0];
        expect(sql).toContain("u.perfil = 'MORADOR'");
        expect(sql).not.toContain('AND (u.id_bloco = ? OR u.bloco = ?)');
        expect(params).toEqual([1]);
    });

    test('listarMoradores aplica filtro de bloco', async () => {
        responder(null, []);

        await repository.listarMoradores(1, 3);

        const [sql, params] = connection.query.mock.calls[0];
        expect(sql).toContain('AND (u.id_bloco = ? OR u.bloco = ?)');
        expect(params).toEqual([1, 3, '3']);
    });

    test('listarMoradores rejeita erro do banco', async () => {
        falharConsulta();
        await expect(repository.listarMoradores(1)).rejects.toThrow('Erro simulado no banco');
    });

    test.each([
        ['adicionarMoradorAoCondominio', [7, 1], [1, null, null, 7]],
        ['adicionarMoradorAoCondominio', [7, 1, 3, 'A12'], [1, 3, 'A12', 7]],
        ['definirMoradorBloco', [7, 1, 3], [1, 3, null, null, 7]],
        ['definirMoradorBloco', [7, 1, 3, 'Bloco A', 'A12'], [1, 3, 'Bloco A', 'A12', 7]]
    ])('%s envia os parâmetros esperados', async (metodo, argumentos, parametrosEsperados) => {
        responder(null, { affectedRows: 1 });

        await expect(repository[metodo](...argumentos)).resolves.toBe(true);

        expect(connection.query.mock.calls[0][1]).toEqual(parametrosEsperados);
    });

    test.each([
        'adicionarMoradorAoCondominio',
        'definirMoradorBloco',
        'recalcularNumeroMoradores',
        'atribuirSindicoCondominio'
    ])('%s retorna false quando nenhuma linha é afetada', async (metodo) => {
        responder(null, { affectedRows: 0 });

        const argumentos = {
            adicionarMoradorAoCondominio: [7, 1],
            definirMoradorBloco: [7, 1, 3],
            recalcularNumeroMoradores: [1],
            atribuirSindicoCondominio: [1, 7]
        }[metodo];

        await expect(repository[metodo](...argumentos)).resolves.toBe(false);
    });

    test.each([
        ['adicionarMoradorAoCondominio', [7, 1]],
        ['definirMoradorBloco', [7, 1, 3]],
        ['recalcularNumeroMoradores', [1]],
        ['atribuirSindicoCondominio', [1, 7]]
    ])('%s rejeita erro do banco', async (metodo, argumentos) => {
        falharConsulta();
        await expect(repository[metodo](...argumentos)).rejects.toThrow('Erro simulado no banco');
    });

    test('criarBloco retorna o ID criado', async () => {
        responder(null, { insertId: 8 });
        await expect(repository.criarBloco('Bloco A', 1)).resolves.toBe(8);
    });

    test('criarBloco rejeita erro do banco', async () => {
        falharConsulta();
        await expect(repository.criarBloco('Bloco A', 1)).rejects.toThrow('Erro simulado no banco');
    });

    test('listarBlocos retorna os resultados', async () => {
        const dados = [{ id: 8, nome: 'Bloco A' }];
        responder(null, dados);
        await expect(repository.listarBlocos(1)).resolves.toEqual(dados);
    });

    test('listarBlocos rejeita erro do banco', async () => {
        falharConsulta();
        await expect(repository.listarBlocos(1)).rejects.toThrow('Erro simulado no banco');
    });

    test('buscarBlocoPorId retorna o bloco ou null', async () => {
        responder(null, [{ id: 3, id_condominio: 1 }]);
        await expect(repository.buscarBlocoPorId(3)).resolves.toEqual({ id: 3, id_condominio: 1 });

        responder(null, []);
        await expect(repository.buscarBlocoPorId(99)).resolves.toBeNull();
    });

    test('buscarBlocoPorId rejeita erro do banco', async () => {
        falharConsulta();
        await expect(repository.buscarBlocoPorId(3)).rejects.toThrow('Erro simulado no banco');
    });

    test('atribuirGestores grava cada item numa transação e confirma no fim', async () => {
        connection.query
            .mockImplementationOnce((sql, params, callback) => callback(null, { affectedRows: 1, insertId: 15 }))
            .mockImplementationOnce((sql, params, callback) => callback(null, { affectedRows: 1, insertId: 16 }));

        await expect(
            repository.atribuirGestores(7, [
                { condominioId: 1, blocoId: 3 },
                { condominioId: 2, blocoId: null }
            ])
        ).resolves.toEqual([
            { id: 15, condominioId: 1, blocoId: 3, nova: true },
            { id: 16, condominioId: 2, blocoId: null, nova: true }
        ]);

        expect(connection.beginTransaction).toHaveBeenCalledTimes(1);
        expect(connection.commit).toHaveBeenCalledTimes(1);
        expect(connection.rollback).not.toHaveBeenCalled();
        expect(connection.query.mock.calls[0][1]).toEqual([7, 1, 3, 7, 1, 3]);
        expect(connection.query.mock.calls[1][1]).toEqual([7, 2, null, 7, 2, null]);
        expect(connection.query.mock.calls[0][0]).toContain('NOT EXISTS');
        expect(connection.query.mock.calls[0][0]).toContain('bloco_id <=> ?');
    });

    test('atribuirGestores ignora o que o usuário já gerencia', async () => {
        responder(null, { affectedRows: 0, insertId: 0 });

        await expect(
            repository.atribuirGestores(7, [{ condominioId: 1, blocoId: null }])
        ).resolves.toEqual([{ id: null, condominioId: 1, blocoId: null, nova: false }]);
    });

    test('atribuirGestores desfaz tudo se uma inserção falhar', async () => {
        connection.query
            .mockImplementationOnce((sql, params, callback) => callback(null, { affectedRows: 1, insertId: 15 }))
            .mockImplementationOnce((sql, params, callback) => callback(new Error('Erro simulado no banco')));

        await expect(
            repository.atribuirGestores(7, [
                { condominioId: 1, blocoId: null },
                { condominioId: 2, blocoId: null }
            ])
        ).rejects.toThrow('Erro simulado no banco');

        expect(connection.rollback).toHaveBeenCalledTimes(1);
        expect(connection.commit).not.toHaveBeenCalled();
    });

    test('atribuirGestores desfaz tudo se o commit falhar', async () => {
        responder(null, { affectedRows: 1, insertId: 15 });
        connection.commit.mockImplementationOnce((callback) => callback(new Error('Falha no commit')));

        await expect(
            repository.atribuirGestores(7, [{ condominioId: 1, blocoId: null }])
        ).rejects.toThrow('Falha no commit');

        expect(connection.rollback).toHaveBeenCalledTimes(1);
    });

    test('atribuirGestores rejeita se não conseguir abrir a transação', async () => {
        connection.beginTransaction.mockImplementationOnce((callback) => callback(new Error('Sem transação')));

        await expect(
            repository.atribuirGestores(7, [{ condominioId: 1, blocoId: null }])
        ).rejects.toThrow('Sem transação');

        expect(connection.query).not.toHaveBeenCalled();
    });

    test.each([
        [{ affectedRows: 1 }, true],
        [{ affectedRows: 0 }, false]
    ])('removerGestao informa se removeu a atribuição', async (resultado, esperado) => {
        responder(null, resultado);
        await expect(repository.removerGestao(7, 4)).resolves.toBe(esperado);
        expect(connection.query.mock.calls[0][1]).toEqual([4, 7]);
    });

    test('removerGestao rejeita erro do banco', async () => {
        falharConsulta();
        await expect(repository.removerGestao(7, 4)).rejects.toThrow('Erro simulado no banco');
    });

    test('listarGerenciamentosUsuario retorna os resultados', async () => {
        const dados = [{ id: 1, condominio_nome: 'Residencial' }];
        responder(null, dados);
        await expect(repository.listarGerenciamentosUsuario(7)).resolves.toEqual(dados);
    });

    test('listarGerenciamentosUsuario rejeita erro do banco', async () => {
        falharConsulta();
        await expect(repository.listarGerenciamentosUsuario(7)).rejects.toThrow('Erro simulado no banco');
    });
});