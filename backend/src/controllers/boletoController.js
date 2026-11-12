const boletoService = require('../services/boletoService');

function responderErro(res, error, mensagemPadrao) {
    if (error.status) {
        return res.status(error.status).json({ erro: error.message, codigo: error.codigo });
    }
    console.error(mensagemPadrao, error);
    return res.status(500).json({ erro: mensagemPadrao });
}

const boletoController = {
    async criar(req, res) {
        try {
            const id_condominio = Number(req.params.idCondominio);
            const { id_usuario, mes_referencia, valor, data_vencimento } = req.body;

            const boleto = await boletoService.criarBoleto(
                {
                    id_condominio,
                    id_usuario,
                    mes_referencia,
                    valor,
                    data_vencimento
                },
                req.usuario
            );

            return res.status(201).json({
                mensagem: 'Boleto criado com sucesso.',
                boleto
            });
        } catch (error) {
            return responderErro(res, error, 'Erro ao criar boleto.');
        }
    },

    async gerarEmLote(req, res) {
        try {
            const id_condominio = Number(req.params.idCondominio);
            const { mes_referencia, valor, data_vencimento } = req.body;

            const resultado = await boletoService.gerarBoletosEmLote(
                {
                    id_condominio,
                    mes_referencia,
                    valor,
                    data_vencimento
                },
                req.usuario
            );

            return res.status(201).json(resultado);
        } catch (error) {
            return responderErro(res, error, 'Erro ao gerar boletos em lote.');
        }
    },

    async obterSegundaVia(req, res) {
        try {
            const idBoleto = Number(req.params.id);
            const resultado = await boletoService.obterSegundaVia(idBoleto, req.usuario);
            return res.status(200).json(resultado);
        } catch (error) {
            return responderErro(res, error, 'Erro ao obter segunda via do boleto.');
        }
    },

    async pagar(req, res) {
        try {
            const idBoleto = Number(req.params.id);
            const resultado = await boletoService.pagarBoleto(idBoleto, req.body, req.usuario);
            return res.status(200).json(resultado);
        } catch (error) {
            return responderErro(res, error, 'Erro ao processar pagamento do boleto.');
        }
    },

    async listarMeusBoletos(req, res) {
        try {
            const id_condominio = Number(req.params.idCondominio);
            const boletos = await boletoService.listarMeusBoletos(id_condominio, req.usuario);
            return res.status(200).json(boletos);
        } catch (error) {
            return responderErro(res, error, 'Erro ao listar seus boletos.');
        }
    },

    async listar(req, res) {
        try {
            const id_condominio = Number(req.params.idCondominio);
            const filtros = {
                status: req.query.status,
                usuario_id: req.query.usuarioId,
                mes_referencia: req.query.mesReferencia
            };
            const boletos = await boletoService.listarBoletosCondominio(id_condominio, filtros, req.usuario);
            return res.status(200).json(boletos);
        } catch (error) {
            return responderErro(res, error, 'Erro ao listar boletos do condomínio.');
        }
    },

    async obterEstadoPagamentos(req, res) {
        try {
            const id_condominio = Number(req.params.idCondominio);
            const relatorio = await boletoService.obterEstadoPagamentos(id_condominio, req.usuario);
            return res.status(200).json(relatorio);
        } catch (error) {
            return responderErro(res, error, 'Erro ao obter estado de pagamentos do condomínio.');
        }
    },

    async notificarInadimplentes(req, res) {
        try {
            const id_condominio = Number(req.params.idCondominio);
            const resultado = await boletoService.notificarInadimplentes(id_condominio, req.body, req.usuario);
            return res.status(200).json(resultado);
        } catch (error) {
            return responderErro(res, error, 'Erro ao notificar moradores com pendências.');
        }
    }
};

module.exports = boletoController;
