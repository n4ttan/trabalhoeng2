const connection = require('./database');
const db = connection.promise();
let filaCriacao = Promise.resolve();

// Função para criar uma nova notificação e associar destinatários
async function criar(dados, destinatarios) {
    const operacao = filaCriacao.then(async () => {
        const conn = db;

        try {
            await conn.beginTransaction();
            
            const [resultado] = await conn.query(
                `INSERT INTO notificacoes
                    (titulo, mensagem, tipo, escopo, condominio_id, criado_por)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    dados.titulo,
                    dados.mensagem,
                    dados.tipo,
                    dados.escopo,
                    dados.condominio_id ?? null,
                    dados.criado_por
                ]
            );

            const notificacaoId = resultado.insertId;

            if (destinatarios.length > 0) {
                const valores = destinatarios.map((usuarioId) => [
                    notificacaoId,
                    usuarioId
                ]);

                await conn.query(
                    `INSERT INTO notificacao_destinatarios
                        (notificacao_id, usuario_id)
                     VALUES ?`,
                    [valores]
                );
            }

            await conn.commit();

            return {
                id: notificacaoId,
                ...dados,
                destinatarios: destinatarios.length
            };
        } catch (erro) {
            try {
                await conn.rollback();
            } catch (erroRollback) {
                console.error('Erro ao desfazer transação:', erroRollback);
            }

            throw erro;
        }
    });

    filaCriacao = operacao.catch(() => {});
    return operacao;
}

// Função para listar notificações de um usuário específico
async function listarPorUsuario(usuarioId) {
    const [linhas] = await db.query(
        `SELECT
            n.id,
            n.titulo,
            n.mensagem,
            n.tipo,
            n.escopo,
            n.condominio_id,
            n.criado_por,
            n.criado_em,
            d.lida_em,
            (d.lida_em IS NOT NULL) AS lida
         FROM notificacoes n
         INNER JOIN notificacao_destinatarios d
            ON d.notificacao_id = n.id
         WHERE d.usuario_id = ?
         ORDER BY n.criado_em DESC, n.id DESC`,
        [usuarioId]
    );

    return linhas;
}

// Marca uma notificação como lida para um usuário específico
async function marcarComoLida(notificacaoId, usuarioId) {
    const [resultado] = await db.query(
        `UPDATE notificacao_destinatarios
         SET lida_em = CURRENT_TIMESTAMP
         WHERE notificacao_id = ?
           AND usuario_id = ?
           AND lida_em IS NULL`,
        [notificacaoId, usuarioId]
    );

    return resultado.affectedRows > 0;
}

// Função para buscar destinatários de um condomínio específico
async function buscarDestinatariosCondominio(condominioId) {
    const [linhas] = await db.query(
        `SELECT DISTINCT u.id
         FROM usuarios u
         WHERE u.id_condominio = ?
           AND u.perfil = 'MORADOR'
           AND u.status_cadastro = 'APROVADO'`,
        [condominioId]
    );

    return linhas.map((linha) => linha.id);
}

// Função para buscar todos os usuários do sistema
async function buscarTodosUsuarios() {
    const [linhas] = await db.query(
        'SELECT id FROM usuarios'
    );

    return linhas.map((linha) => linha.id);
}

module.exports = {
    criar,
    listarPorUsuario,
    marcarComoLida,
    buscarDestinatariosCondominio,
    buscarTodosUsuarios
};
