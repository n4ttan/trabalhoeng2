// Testes unitários para o repositório de condomínios, garantindo que as operações de criação, exclusão, 
// listagem e atualização funcionem corretamente, incluindo tratamento de erros do banco de dados.
jest.mock('../src/repositories/database', () => ({
    query: jest.fn()
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

    test('atribuirGestor retorna o ID criado', async () => {
        responder(null, { insertId: 15 });
        await expect(repository.atribuirGestor(7, 1, 3)).resolves.toBe(15);
        expect(connection.query.mock.calls[0][1]).toEqual([7, 1, 3]);
    });

    test('atribuirGestor permite bloco nulo', async () => {
        responder(null, { insertId: 16 });
        await repository.atribuirGestor(7, 1);
        expect(connection.query.mock.calls[0][1]).toEqual([7, 1, null]);
    });

    test('atribuirGestor rejeita erro do banco', async () => {
        falharConsulta();
        await expect(repository.atribuirGestor(7, 1)).rejects.toThrow('Erro simulado no banco');
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