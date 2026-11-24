const manutencaoService = require('../services/manutencaoService');

// Morador e síndico só acessam o próprio condomínio; admin acessa qualquer um.
function acessoPermitido(req, res) {
    const { perfil, id_condominio } = req.usuario;
    if (perfil !== 'ADMIN' && Number(id_condominio) !== Number(req.params.idCondominio)) {
        res.status(403).json({ erro: 'Acesso negado. Você só pode acessar o seu próprio condomínio.' });
        return false;
    }
    return true;
}

const manutencaoController = {
    async criar(req, res) {
        try {
            if (!acessoPermitido(req, res)) return;
            const { titulo, descricao, local, prioridade } = req.body;
            const id = await manutencaoService.abrir({
                id_condominio: Number(req.params.idCondominio),
                id_usuario: req.usuario.id,
                titulo,
                descricao,
                local,
                prioridade
            });
            return res.status(201).json({ mensagem: 'Chamado de manutenção aberto com sucesso!', id });
        } catch (error) {
            return res.status(error.status || 400).json({ erro: error.message });
        }
    },

    async listar(req, res) {
        try {
            if (!acessoPermitido(req, res)) return;
            const lista = await manutencaoService.listar(req.params.idCondominio, req.usuario);
            return res.status(200).json(lista);
        } catch (error) {
            return res.status(error.status || 500).json({ erro: error.message || 'Erro ao buscar manutenções.' });
        }
    },

    async atualizarStatus(req, res) {
        try {
            if (!acessoPermitido(req, res)) return;
            const resultado = await manutencaoService.atualizarStatus(
                req.params.id,
                req.params.idCondominio,
                req.body.status
            );
            return res.status(200).json(resultado);
        } catch (error) {
            return res.status(error.status || 400).json({ erro: error.message });
        }
    }
};

module.exports = manutencaoController;
