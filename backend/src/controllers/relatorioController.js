const relatorioService = require('../services/relatorioService');

const relatorioController = {
    async obter(req, res) {
        try {
            const relatorio = await relatorioService.obterRelatorio(req.params.idCondominio, req.usuario);
            return res.status(200).json(relatorio);
        } catch (error) {
            if (error.status) {
                return res.status(error.status).json({ erro: error.message });
            }
            console.error('Erro ao gerar relatório.', error);
            return res.status(500).json({ erro: 'Erro ao gerar relatório.' });
        }
    }
};

module.exports = relatorioController;
