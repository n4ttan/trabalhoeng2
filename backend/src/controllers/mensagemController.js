const mensagemService = require('../services/mensagemService');

async function obterMensagem(req, res) {
    try {
        const mensagem = await mensagemService.obterMensagem();
        res.json(mensagem);
    } catch (error) {
        console.error('Erro ao buscar mensagem:', error);
        res.status(500).json({
            erro: 'Erro ao buscar mensagem'
        });
    }
}

module.exports = {
    obterMensagem
};