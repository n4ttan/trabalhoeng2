const visitanteService = require('../services/visitanteService');

const responderErro = (res, error, padrao) =>
    res.status(error.status || padrao).json({ erro: error.message, mensagem: error.message });

const visitanteController = {
    async autorizar(req, res) {
        try {
            const { nome_visitante, documento, data_prevista, validade_ate } = req.body;
            const id = await visitanteService.autorizar({
                id_condominio: Number(req.params.idCondominio),
                id_usuario: req.usuario.id,
                nome_visitante,
                documento,
                data_prevista,
                validade_ate
            });
            return res.status(201).json({ mensagem: 'Visitante pré-autorizado com sucesso!', id });
        } catch (error) {
            return responderErro(res, error, 400);
        }
    },

    async listarMeus(req, res) {
        try {
            const lista = await visitanteService.listarDoMorador(Number(req.params.idCondominio), req.usuario.id);
            return res.status(200).json(lista);
        } catch (error) {
            return responderErro(res, error, 500);
        }
    },

    async listar(req, res) {
        try {
            const lista = await visitanteService.listarDoCondominio(Number(req.params.idCondominio));
            return res.status(200).json(lista);
        } catch (error) {
            return responderErro(res, error, 500);
        }
    },

    async cancelar(req, res) {
        try {
            const r = await visitanteService.cancelar(req.params.id, Number(req.params.idCondominio), req.usuario);
            return res.status(200).json(r);
        } catch (error) {
            return responderErro(res, error, 400);
        }
    },

    async registrarEntrada(req, res) {
        try {
            const r = await visitanteService.registrarEntrada(req.params.id, Number(req.params.idCondominio));
            return res.status(200).json(r);
        } catch (error) {
            return responderErro(res, error, 400);
        }
    },

    async registrarSaida(req, res) {
        try {
            const r = await visitanteService.registrarSaida(req.params.id, Number(req.params.idCondominio));
            return res.status(200).json(r);
        } catch (error) {
            return responderErro(res, error, 400);
        }
    }
};

module.exports = visitanteController;
