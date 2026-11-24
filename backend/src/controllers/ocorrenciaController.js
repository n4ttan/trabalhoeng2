const ocorrenciaService = require('../services/ocorrenciaService');

function responderErro(res, error, padrao) {
    return res.status(error.statusCode || 500).json({ erro: error.message || padrao });
}

module.exports = {
    async registrar(req, res) {
        try {
            const { titulo, descricao, categoria, data_ocorrencia } = req.body;
            const ocorrencia = await ocorrenciaService.registrar({
                id_condominio: Number(req.params.idCondominio),
                id_usuario: req.usuario.id,
                titulo,
                descricao,
                categoria,
                data_ocorrencia
            });
            return res.status(201).json(ocorrencia);
        } catch (error) {
            return responderErro(res, error, 'Erro ao registrar ocorrência.');
        }
    },

    async listar(req, res) {
        try {
            return res.json(await ocorrenciaService.listarPorCondominio(req.params.idCondominio));
        } catch (error) {
            return responderErro(res, error, 'Erro ao listar ocorrências.');
        }
    },

    async listarMinhas(req, res) {
        try {
            return res.json(await ocorrenciaService.listarMinhas(req.params.idCondominio, req.usuario.id));
        } catch (error) {
            return responderErro(res, error, 'Erro ao listar suas ocorrências.');
        }
    },

    async atualizar(req, res) {
        try {
            const { idCondominio, id } = req.params;
            const { status, resposta } = req.body;
            return res.json(await ocorrenciaService.atualizar(idCondominio, id, { status, resposta }));
        } catch (error) {
            return responderErro(res, error, 'Erro ao atualizar ocorrência.');
        }
    }
};
