const connection = require('../src/repositories/database');
const usuarioRepository = require('../src/repositories/usuarioRepository');

describe('usuarioRepository - integração', () => {
    let usuarioId;

    afterAll((done) => {
        if (!usuarioId) {
            connection.end(done);
            return;
        }

        connection.query(
            'DELETE FROM usuarios WHERE id = ?',
            [usuarioId],
            () => {
                connection.end();
                done();
            }
        );
    });

it('deve criar um usuário no banco de dados', async () => {
        const email = `teste.integracao.${Date.now()}@email.com`;

        usuarioId = await usuarioRepository.criarUsuario(
            'Usuário Teste Integração',
            email,
            'senha-hash-teste',
            'CANDIDATO'
        );

        expect(usuarioId).toBeDefined();
        expect(typeof usuarioId).toBe('number');

        const [usuarios] = await connection.promise().query(
            'SELECT * FROM usuarios WHERE id = ?',
            [usuarioId]
        );

        expect(usuarios).toHaveLength(1);
        expect(usuarios[0].nome).toBe('Usuário Teste Integração');
        expect(usuarios[0].email).toBe(email);
        expect(usuarios[0].senha).toBe('senha-hash-teste');
        expect(usuarios[0].perfil).toBe('CANDIDATO');
    });

it('deve criar um morador no banco de dados', async () => {
    const email = `morador.integracao.${Date.now()}@email.com`;

    const usuarioId = await usuarioRepository.criarMorador(
        'Morador Teste Integração',
        email,
        'senha-hash-teste',
        'MORADOR',
        '101'
    );

    expect(usuarioId).toBeDefined();
    expect(typeof usuarioId).toBe('number');

    const [usuarios] = await connection.promise().query(
        'SELECT * FROM usuarios WHERE id = ?',
        [usuarioId]
    );

    expect(usuarios).toHaveLength(1);
    expect(usuarios[0].nome).toBe('Morador Teste Integração');
    expect(usuarios[0].email).toBe(email);
    expect(usuarios[0].senha).toBe('senha-hash-teste');
    expect(usuarios[0].perfil).toBe('MORADOR');
    expect(usuarios[0].unidade).toBe('101');

    await connection.promise().query(
        'DELETE FROM usuarios WHERE id = ?',
        [usuarioId]
    );
});

it('deve excluir o usuário e os pedidos associados', async () => {
    const email = `exclusao.integracao.${Date.now()}@email.com`;

    const usuarioId = await usuarioRepository.criarUsuario(
        'Usuário Exclusão Integração',
        email,
        'senha-hash-teste',
        'CANDIDATO'
    );

    await connection.promise().query(
        'INSERT INTO pedidos_sindico (usuario_id) VALUES (?)',
        [usuarioId]
    );

    await usuarioRepository.excluirUsuarioEPedido(usuarioId);

    const [usuarios] = await connection.promise().query(
        'SELECT * FROM usuarios WHERE id = ?',
        [usuarioId]
    );

    const [pedidos] = await connection.promise().query(
        'SELECT * FROM pedidos_sindico WHERE usuario_id = ?',
        [usuarioId]
    );

    expect(usuarios).toHaveLength(0);
    expect(pedidos).toHaveLength(0);
});

it('deve salvar o token de validação do usuário', async () => {
    const email = `token.integracao.${Date.now()}@email.com`;

    const usuarioId = await usuarioRepository.criarUsuario(
        'Usuário Token Integração',
        email,
        'senha-hash-teste',
        'CANDIDATO'
    );

    const token = '123456';
    const expiraEm = new Date(Date.now() + 15 * 60 * 1000);

    const resultado = await usuarioRepository.salvarTokenValidacao(
        usuarioId,
        token,
        expiraEm
    );

    expect(resultado).toBe(1);

    const [usuarios] = await connection.promise().query(
        'SELECT token_validacao, token_expira_em, tentativas_validacao FROM usuarios WHERE id = ?',
        [usuarioId]
    );

    expect(usuarios).toHaveLength(1);
    expect(usuarios[0].token_validacao).toBe(token);
    expect(usuarios[0].token_expira_em).not.toBeNull();
    expect(usuarios[0].tentativas_validacao).toBe(0);

    await connection.promise().query(
        'DELETE FROM usuarios WHERE id = ?',
        [usuarioId]
    );
});

it('deve buscar um usuário pelo e-mail', async () => {
    const email = `busca.email.${Date.now()}@email.com`;

    const usuarioId = await usuarioRepository.criarUsuario(
        'Usuário Busca Email',
        email,
        'senha-hash-teste',
        'CANDIDATO'
    );

    const usuario = await usuarioRepository.buscarPorEmail(email);

    expect(usuario).toBeDefined();
    expect(usuario.id).toBe(usuarioId);
    expect(usuario.nome).toBe('Usuário Busca Email');
    expect(usuario.email).toBe(email);
    expect(usuario.perfil).toBe('CANDIDATO');

    await connection.promise().query(
        'DELETE FROM usuarios WHERE id = ?',
        [usuarioId]
    );
});

it('deve reservar uma tentativa de validação', async () => {
    const email = `tentativa.integracao.${Date.now()}@email.com`;

    const usuarioId = await usuarioRepository.criarUsuario(
        'Usuário Tentativa Integração',
        email,
        'senha-hash-teste',
        'CANDIDATO'
    );

    const resultado = await usuarioRepository.reservarTentativaValidacao(
        usuarioId,
        5
    );

    expect(resultado).toBe(true);

    const [usuarios] = await connection.promise().query(
        'SELECT tentativas_validacao, status_cadastro FROM usuarios WHERE id = ?',
        [usuarioId]
    );

    expect(usuarios).toHaveLength(1);
    expect(usuarios[0].tentativas_validacao).toBe(1);
    expect(usuarios[0].status_cadastro).toBe('AGUARDANDO_EMAIL');

    await connection.promise().query(
        'DELETE FROM usuarios WHERE id = ?',
        [usuarioId]
    );
});

it('não deve reservar uma tentativa quando o limite já foi atingido', async () => {
    const email = `limite.tentativa.${Date.now()}@email.com`;

    const usuarioId = await usuarioRepository.criarUsuario(
        'Usuário Limite Integração',
        email,
        'senha-hash-teste',
        'CANDIDATO'
    );

    await connection.promise().query(
        'UPDATE usuarios SET tentativas_validacao = 5 WHERE id = ?',
        [usuarioId]
    );

    const resultado = await usuarioRepository.reservarTentativaValidacao(
        usuarioId,
        5
    );

    expect(resultado).toBe(false);

    const [usuarios] = await connection.promise().query(
        'SELECT tentativas_validacao FROM usuarios WHERE id = ?',
        [usuarioId]
    );

    expect(usuarios).toHaveLength(1);
    expect(usuarios[0].tentativas_validacao).toBe(5);

    await connection.promise().query(
        'DELETE FROM usuarios WHERE id = ?',
        [usuarioId]
    );
});

it('deve confirmar o e-mail e mudar o status do usuário', async () => {
    const email = `confirmacao.integracao.${Date.now()}@email.com`;

    const usuarioId = await usuarioRepository.criarUsuario(
        'Usuário Confirmação Integração',
        email,
        'senha-hash-teste',
        'CANDIDATO'
    );

    await connection.promise().query(
        `UPDATE usuarios
         SET token_validacao = '123456',
             token_expira_em = DATE_ADD(NOW(), INTERVAL 15 MINUTE),
             tentativas_validacao = 2
         WHERE id = ?`,
        [usuarioId]
    );

    const resultado = await usuarioRepository.confirmarEmail(usuarioId);

    expect(resultado).toBe(1);

    const [usuarios] = await connection.promise().query(
        `SELECT status_cadastro, token_validacao, token_expira_em, tentativas_validacao
         FROM usuarios
         WHERE id = ?`,
        [usuarioId]
    );

    expect(usuarios).toHaveLength(1);
    expect(usuarios[0].status_cadastro).toBe('PENDENTE_APROVACAO');
    expect(usuarios[0].token_validacao).toBeNull();
    expect(usuarios[0].token_expira_em).toBeNull();
    expect(usuarios[0].tentativas_validacao).toBe(0);

    await connection.promise().query(
        'DELETE FROM usuarios WHERE id = ?',
        [usuarioId]
    );
});

it('deve listar moradores pendentes de aprovação', async () => {
    const email = `pendente.integracao.${Date.now()}@email.com`;

    const usuarioId = await usuarioRepository.criarMorador(
        'Morador Pendente Integração',
        email,
        'senha-hash-teste',
        'MORADOR',
        '202'
    );

    await connection.promise().query(
        `UPDATE usuarios
         SET status_cadastro = 'PENDENTE_APROVACAO'
         WHERE id = ?`,
        [usuarioId]
    );

    const moradores = await usuarioRepository.listarPendentes();

    const morador = moradores.find((usuario) => usuario.id === usuarioId);

    expect(morador).toBeDefined();
    expect(morador.nome).toBe('Morador Pendente Integração');
    expect(morador.email).toBe(email);
    expect(morador.unidade).toBe('202');
    expect(morador.status_cadastro).toBe('PENDENTE_APROVACAO');

    await connection.promise().query(
        'DELETE FROM usuarios WHERE id = ?',
        [usuarioId]
    );
});

it('deve aprovar um morador pendente', async () => {
    const email = `aprovar.integracao.${Date.now()}@email.com`;

    const usuarioId = await usuarioRepository.criarMorador(
        'Morador Aprovação Integração',
        email,
        'senha-hash-teste',
        'MORADOR',
        '303'
    );

    await connection.promise().query(
        `UPDATE usuarios
         SET status_cadastro = 'PENDENTE_APROVACAO'
         WHERE id = ?`,
        [usuarioId]
    );

    const resultado = await usuarioRepository.aprovarMorador(usuarioId);

    expect(resultado).toBe(true);

    const [usuarios] = await connection.promise().query(
        'SELECT status_cadastro FROM usuarios WHERE id = ?',
        [usuarioId]
    );

    expect(usuarios).toHaveLength(1);
    expect(usuarios[0].status_cadastro).toBe('APROVADO');

    await connection.promise().query(
        'DELETE FROM usuarios WHERE id = ?',
        [usuarioId]
    );
});

it('deve rejeitar um morador pendente', async () => {
    const email = `rejeitar.integracao.${Date.now()}@email.com`;

    const usuarioId = await usuarioRepository.criarMorador(
        'Morador Rejeição Integração',
        email,
        'senha-hash-teste',
        'MORADOR',
        '404'
    );

    await connection.promise().query(
        `UPDATE usuarios
         SET status_cadastro = 'PENDENTE_APROVACAO'
         WHERE id = ?`,
        [usuarioId]
    );

    const resultado = await usuarioRepository.rejeitarMorador(usuarioId);

    expect(resultado).toBe(true);

    const [usuarios] = await connection.promise().query(
        'SELECT status_cadastro FROM usuarios WHERE id = ?',
        [usuarioId]
    );

    expect(usuarios).toHaveLength(1);
    expect(usuarios[0].status_cadastro).toBe('REJEITADO');

    await connection.promise().query(
        'DELETE FROM usuarios WHERE id = ?',
        [usuarioId]
    );
});

//testando as excessões 
it('deve retornar um erro quando as informações do criarUsuário forem incorretas', async () => {

    await expect(
        usuarioRepository.criarUsuario(
            null,
            'null@gmail.com',
            'senha-teste',
            'FUNCIONARIO'
        )

    ).rejects.toThrow();

});

it('deve retornar um erro quando as informações do criarMorador forem incorretas', async () => {

    await expect(
        usuarioRepository.criarMorador(
            null,
            'null@gmail.com',
            'senha-teste',
            'FUNCIONARIO',
            null
        )

    ).rejects.toThrow();

});

it('deve retornar um erro quando o id do ExcluirUsuarioEPedido não existir', async () => {

    await expect(
        usuarioRepository.excluirUsuarioEPedido(
            'string'
        )

    ).rejects.toThrow();

});

it('deve retornar um erro quando a requisição do salvarTokenValidacao não for correto', async () => {

    await expect(
        usuarioRepository.salvarTokenValidacao(
            [1, 2],
            '123456',
            '2030-01-01 10:00:00'
        )

    ).rejects.toThrow();

});

it('deve retornar undefined quando o e-mail não existir no banco de dados', async () => {
    
    const usuario = await usuarioRepository.buscarPorEmail('email_fantasma@teste.com');
    
    expect(usuario).toBeUndefined();
});

it('deve retornar um erro ao buscar por e-mail devido a falha de sintaxe', async () => {

    await expect(
        usuarioRepository.buscarPorEmail(['email1', 'email2'])
    ).rejects.toThrow();
});

it('deve retornar um erro ao tentar reservar tentativa devido a erro de sintaxe', async () => {
    
    await expect(
        usuarioRepository.reservarTentativaValidacao([1, 2], 5)
    ).rejects.toThrow();
});

it('deve retornar um erro ao tentar confirmar email devido a erro de sintaxe', async () => {
    
    await expect(
        usuarioRepository.confirmarEmail([1, 2])
    ).rejects.toThrow();
});

it('deve retornar um erro ao listar pendentes simulando queda no banco', async () => {
   
    const spy = jest.spyOn(connection, 'query').mockImplementationOnce((sql, callback) => {
        callback(new Error('Simulação de falha no banco de dados'), null);
    });

    await expect(
        usuarioRepository.listarPendentes()
    ).rejects.toThrow();

    
    spy.mockRestore();
});



});