const connection = require('../src/repositories/database');
const pedidoSindicoRepository = require('../src/repositories/pedidoSindicoRepository');

describe('pedidoSindicoRepository - integração', () => {
    afterAll((done) => {
        connection.end(done);
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
            false
        );

        expect(pedidoId).toBeDefined();
        expect(typeof pedidoId).toBe('number');

        const [pedidos] = await connection.promise().query(
            'SELECT * FROM pedidos_sindico WHERE id = ?',
            [pedidoId]
        );

        expect(pedidos).toHaveLength(1);
        expect(pedidos[0].usuario_id).toBe(usuarioId);
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
        false
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
        'SELECT perfil FROM usuarios WHERE id = ?',
        [usuarioId]
    );

    expect(pedidos).toHaveLength(1);
    expect(pedidos[0].deferido).toBe(1);

    expect(usuarios).toHaveLength(1);
    expect(usuarios[0].perfil).toBe('SINDICO');

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

});