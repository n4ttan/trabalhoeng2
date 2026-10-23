const notificacaoService = require('../services/notificacaoService');

async function listar(req, res) {
    try {
        const usuarioId = req.usuario.id;
        const notificacoes = await notificacaoService.listarPorUsuario(usuarioId);

        return res.status(200).json(notificacoes);
    } catch (erro) {
        console.error('Erro ao listar notificações:', erro);
        return res.status(500).json({
            mensagem: 'Erro ao listar notificações.'
        });
    }
}

async function marcarComoLida(req, res) {
    try {
        const notificacaoId = Number(req.params.id);
        const usuarioId = req.usuario.id;

        if (!Number.isInteger(notificacaoId) || notificacaoId <= 0) {
            return res.status(400).json({
                mensagem: 'ID de notificação inválido.'
            });
        }

        const atualizada = await notificacaoService.marcarComoLida(
            notificacaoId,
            usuarioId
        );

        if (!atualizada) {
            return res.status(404).json({
                mensagem: 'Notificação não encontrada ou já lida.'
            });
        }

        return res.status(200).json({
            mensagem: 'Notificação marcada como lida.'
        });
    } catch (erro) {
        console.error('Erro ao marcar notificação como lida:', erro);
        return res.status(500).json({
            mensagem: 'Erro ao marcar notificação como lida.'
        });
    }
}

async function publicar(req, res) {
    try {
        const notificacao = await notificacaoService.publicar(
            req.body,
            req.usuario
        );

        return res.status(201).json(notificacao);
    } catch (erro) {
        console.error('Erro ao publicar notificação:', erro);

        return res.status(erro.status || 500).json({
            mensagem: erro.status ? erro.message : 'Erro ao publicar notificação.'
        });
    }
}

module.exports = {
    listar,
    marcarComoLida,
    publicar
};