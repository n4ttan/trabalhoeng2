const multaService = require('../services/multaService');

function responderErro(res, error, mensagemPadrao) {
    if (error.status) {
        return res.status(error.status).json({ erro: error.message });
    }
    console.error(mensagemPadrao, error);
    return res.status(500).json({ erro: mensagemPadrao });
}

module.exports = {
    async criar(req, res) {
        try {
            const multa = await multaService.criar(Number(req.params.idCondominio), req.body);
            return res.status(201).json({ mensagem: 'Multa registrada com sucesso.', multa });
        } catch (error) {
            return responderErro(res, error, 'Erro ao registrar multa.');
        }
    },

    async listar(req, res) {
        try {
            return res.json(await multaService.listarPorCondominio(Number(req.params.idCondominio)));
        } catch (error) {
            return responderErro(res, error, 'Erro ao listar multas.');
        }
    },

    async listarMinhas(req, res) {
        try {
            return res.json(await multaService.listarMinhas(Number(req.params.idCondominio), req.usuario));
        } catch (error) {
            return responderErro(res, error, 'Erro ao listar suas multas.');
        }
    },

    async atualizarStatus(req, res) {
        try {
            const multa = await multaService.atualizarStatus(
                Number(req.params.idCondominio),
                Number(req.params.id),
                req.body.status
            );
            return res.json({ mensagem: 'Status da multa atualizado.', multa });
        } catch (error) {
            return responderErro(res, error, 'Erro ao atualizar multa.');
        }
    }
};
