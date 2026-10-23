const notificacaoRepository = require('../repositories/notificacaoRepository');
const connection = require('../repositories/database');
const { getIO } = require('../socket');
const db = connection.promise();

// Lista todas as notificações do usuário autenticado, incluindo o status de leitura.
async function listarPorUsuario(usuarioId) {
    return notificacaoRepository.listarPorUsuario(usuarioId);
}

// Marca uma notificação como lida para o usuário autenticado.
async function marcarComoLida(notificacaoId, usuarioId) {
    return notificacaoRepository.marcarComoLida(
        notificacaoId,
        usuarioId
    );
}

// Publica uma nova notificação, validando os dados e o perfil do usuário.
async function publicar(dados, usuario) {
    const {
        titulo,
        mensagem,
        tipo = 'AVISO',
        escopo,
        condominio_id
    } = dados;

    if (
        typeof titulo !== 'string' ||
        !titulo.trim() ||
        titulo.length > 150 ||
        typeof mensagem !== 'string' ||
        !mensagem.trim()
    ) {
        const erro = new Error('Título ou mensagem inválidos.');
        erro.status = 400;
        throw erro;
    }

    if (!['AVISO', 'MANUTENCAO', 'URGENTE'].includes(tipo)) {
        const erro = new Error('Tipo de notificação inválido.');
        erro.status = 400;
        throw erro;
    }

    let destinatarios;

    if (escopo === 'PLATAFORMA') {
        if (usuario.perfil !== 'ADMIN') {
            const erro = new Error(
                'Apenas administradores podem publicar avisos da plataforma.'
            );
            erro.status = 403;
            throw erro;
        }

        destinatarios =
            await notificacaoRepository.buscarTodosUsuarios();

    } else if (escopo === 'CONDOMINIO') {
        const idCondominio = Number(condominio_id);

        if (
            !Number.isInteger(idCondominio) ||
            idCondominio <= 0
        ) {
            const erro = new Error('Condomínio inválido.');
            erro.status = 400;
            throw erro;
        }

        if (
            usuario.perfil !== 'ADMIN' &&
            usuario.perfil !== 'SINDICO'
        ) {
            const erro = new Error(
                'Sem permissão para publicar avisos de condomínio.'
            );
            erro.status = 403;
            throw erro;
        }

        if (usuario.perfil === 'SINDICO') {
            const [vinculos] = await db.query(
                `SELECT c.id
                 FROM condominios c
                 LEFT JOIN gestores_condominios g
                    ON g.condominio_id = c.id
                    AND g.usuario_id = ?
                    AND g.bloco_id IS NULL
                 WHERE c.id = ?
                   AND (
                       c.sindico_responsavel = ?
                       OR g.usuario_id IS NOT NULL
                   )
                 LIMIT 1`,
                [usuario.id, idCondominio, usuario.id]
            );

            if (vinculos.length === 0) {
                const erro = new Error(
                    'Você não gerencia este condomínio.'
                );
                erro.status = 403;
                throw erro;
            }
        }

        destinatarios =
            await notificacaoRepository
                .buscarDestinatariosCondominio(idCondominio);

    } else {
        const erro = new Error('Escopo inválido.');
        erro.status = 400;
        throw erro;
    }

    // Salva a notificação e seus destinatários no banco.
    const notificacao = await notificacaoRepository.criar(
        {
            titulo: titulo.trim(),
            mensagem: mensagem.trim(),
            tipo,
            escopo,
            condominio_id:
                escopo === 'CONDOMINIO'
                    ? Number(condominio_id)
                    : null,
            criado_por: usuario.id
        },
        destinatarios
    );

    // Emite o evento somente depois de salvar com sucesso.
    const io = getIO();

    if (io) {
        for (const usuarioId of destinatarios) {
            io.to(`usuario:${usuarioId}`).emit(
                'nova_notificacao',
                {
                    id: notificacao.id,
                    titulo: notificacao.titulo,
                    mensagem: notificacao.mensagem,
                    tipo: notificacao.tipo,
                    escopo: notificacao.escopo,
                    condominio_id: notificacao.condominio_id,
                    criado_por: notificacao.criado_por
                }
            );
        }
    }

    return notificacao;
}

module.exports = {
    listarPorUsuario,
    marcarComoLida,
    publicar
};