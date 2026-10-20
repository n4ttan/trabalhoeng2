const connection = require('../src/repositories/database');
const pedidoSindicoRepository = require('../src/repositories/pedidoSindicoRepository');

describe('pedidoSindicoRepository - integração', () => {
    let condominioTesteId;

    beforeAll(async () => {
        const [cond] = await connection.promise().query(
            'INSERT INTO condominios (nome, numero_moradores) VALUES (?, 0)',
            ['Condomínio Teste Integração Pedido']
        );
        condominioTesteId = cond.insertId;
    });

    afterAll(async () => {
        if (condominioTesteId) {
            await connection.promise().query(
                'DELETE FROM condominios WHERE id = ?',
                [condominioTesteId]
            );
        }
        await new Promise((resolve) => connection.end(resolve));
    });

    it('deve criar um pedido de cadastro de síndico', async () => {
        const email = `pedido.integracao.${Date.now()}@email.com`;

        const [usuario] = await connection.promise().query(
            `INSERT INTO usuarios (nome, email, senha, perfil)
             VALUES (?, ?, ?, ?)`,
            [
                'Usuário Pedido Integração',
                email,
                'senha-hash-teste',
                'CANDIDATO'
            ]
        );

        const usuarioId = usuario.insertId;

        const pedidoId = await pedidoSindicoRepository.criarPedidoSindico(
            usuarioId,
            condominioTesteId
        );

        expect(pedidoId).toBeDefined();
        expect(typeof pedidoId).toBe('number');

        const [pedidos] = await connection.promise().query(
            'SELECT * FROM pedidos_sindico WHERE id = ?',
            [pedidoId]
        );

        expect(pedidos).toHaveLength(1);
        expect(pedidos[0].usuario_id).toBe(usuarioId);
        expect(pedidos[0].condominio_id).toBe(condominioTesteId);
        expect(pedidos[0].deferido).toBe(0);

        await connection.promise().query(
            'DELETE FROM pedidos_sindico WHERE id = ?',
            [pedidoId]
        );

        await connection.promise().query(
            'DELETE FROM usuarios WHERE id = ?',
            [usuarioId]
        );
    });

    it('deve aprovar o pedido e promover o usuário a síndico', async () => {
        const email = `aprovar.pedido.integracao.${Date.now()}@email.com`;

        const [usuario] = await connection.promise().query(
            `INSERT INTO usuarios (nome, email, senha, perfil)
             VALUES (?, ?, ?, ?)`,
            [
                'Candidato Aprovação Integração',
                email,
                'senha-hash-teste',
                'CANDIDATO'
            ]
        );

        const usuarioId = usuario.insertId;

        const pedidoId = await pedidoSindicoRepository.criarPedidoSindico(
            usuarioId,
            condominioTesteId
        );

        const resultado = await pedidoSindicoRepository.aprovarPedidoSindico(
            pedidoId
        );

        expect(resultado).toBe(true);

        const [pedidos] = await connection.promise().query(
            'SELECT deferido FROM pedidos_sindico WHERE id = ?',
            [pedidoId]
        );

        const [usuarios] = await connection.promise().query(
            'SELECT perfil, id_condominio FROM usuarios WHERE id = ?',
            [usuarioId]
        );

        expect(pedidos).toHaveLength(1);
        expect(pedidos[0].deferido).toBe(1);

        expect(usuarios).toHaveLength(1);
        expect(usuarios[0].perfil).toBe('SINDICO');
        expect(usuarios[0].id_condominio).toBe(condominioTesteId);

        await connection.promise().query(
            'DELETE FROM pedidos_sindico WHERE id = ?',
            [pedidoId]
        );

        await connection.promise().query(
            'DELETE FROM usuarios WHERE id = ?',
            [usuarioId]
        );
    });

    it('deve retornar false quando o pedido não existir', async () => {
        const resultado = await pedidoSindicoRepository.aprovarPedidoSindico(
            999999
        );

        expect(resultado).toBe(false);
    });

    it('deve reprovar o pedido de cadastro de síndico', async () => {
        const email = `reprovar.pedido.integracao.${Date.now()}@email.com`;

        const [usuario] = await connection.promise().query(
            `INSERT INTO usuarios (nome, email, senha, perfil)
             VALUES (?, ?, ?, ?)`,
            [
                'Candidato Reprovação Integração',
                email,
                'senha-hash-teste',
                'CANDIDATO'
            ]
        );

        const usuarioId = usuario.insertId;

        const pedidoId = await pedidoSindicoRepository.criarPedidoSindico(
            usuarioId,
            condominioTesteId
        );

        const resultado = await pedidoSindicoRepository.reprovarPedidoSindico(
            pedidoId
        );

        expect(resultado).toBe(true);

        const [pedidos] = await connection.promise().query(
            'SELECT deferido FROM pedidos_sindico WHERE id = ?',
            [pedidoId]
        );

        expect(pedidos).toHaveLength(1);
        expect(pedidos[0].deferido).toBe(0);

        await connection.promise().query(
            'DELETE FROM pedidos_sindico WHERE id = ?',
            [pedidoId]
        );

        await connection.promise().query(
            'DELETE FROM usuarios WHERE id = ?',
            [usuarioId]
        );
    });

    it('deve retornar false quando o pedido a reprovar não existir', async () => {
        const resultado = await pedidoSindicoRepository.reprovarPedidoSindico(
            999999
        );

        expect(resultado).toBe(false);
    });

    it('deve fazer rollback e retornar erro se o beginTransaction falhar', async () => {
        const spy = jest.spyOn(connection, 'beginTransaction')
            .mockImplementationOnce((callback) => {
                callback(new Error('Falha no beginTransaction'));
            });

        await expect(
            pedidoSindicoRepository.aprovarPedidoSindico(1)
        ).rejects.toThrow('Falha no beginTransaction');

        spy.mockRestore();
    });

    it('deve fazer rollback e retornar erro se a busca do pedido falhar', async () => {
        const spy = jest.spyOn(connection, 'query')
            .mockImplementationOnce((sql, params, callback) => {
                const cb = typeof params === 'function' ? params : callback;
                cb(new Error('Falha na busca do pedido'));
            });

        await expect(
            pedidoSindicoRepository.aprovarPedidoSindico(1)
        ).rejects.toThrow('Falha na busca do pedido');

        spy.mockRestore();
    });

    it('deve fazer rollback e retornar erro se o commit final falhar', async () => {
        const spyQuery = jest.spyOn(connection, 'query').mockImplementation((sql, params, callback) => {
            const cb = typeof params === 'function' ? params : callback;
            if (typeof sql === 'string' && sql.includes('SELECT usuario_id, condominio_id')) {
                cb(null, [{ usuario_id: 1, condominio_id: 1 }]);
                return;
            }
            cb(null, { affectedRows: 1 });
        });

        const spyCommit = jest.spyOn(connection, 'commit').mockImplementationOnce((callback) => {
            callback(new Error('Falha no commit'));
        });

        await expect(
            pedidoSindicoRepository.aprovarPedidoSindico(1)
        ).rejects.toThrow('Falha no commit');

        spyQuery.mockRestore();
        spyCommit.mockRestore();
    });
});
