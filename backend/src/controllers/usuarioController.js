const usuarioService = require('../services/usuarioService');

// Controla o cadastro de usuário e devolve o ID gerado no banco.
async function criarUsuario(req, res) {
    try {
        const { nome, email, senha, perfil } = req.body;

        const usuarioId = await usuarioService.criarUsuario(
            nome,
            email,
            senha,
            perfil
        );

        res.status(201).json({
            mensagem: 'Usuário criado com sucesso',
            usuarioId: usuarioId
        });
    } catch (error) {
        console.error('Erro ao criar usuário:', error);

        res.status(500).json({
            erro: 'Erro ao criar usuário'
        });
    }
}

// Remove um usuário informado pela URL e informa quando ele não existe.
async function excluirUsuarioEPedido(req, res) {
    try {
        const { usuarioId } = req.params;

        const resultado = await usuarioService.excluirUsuarioEPedido(usuarioId);

        if (resultado === 0) {
            res.status(404).json({
                erro: 'Usuário não encontrado'
            });
            return;
        }

        res.json({
            mensagem: 'Usuário e pedidos associados excluídos com sucesso'
        });
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);

        res.status(500).json({
            erro: 'Erro ao excluir usuário'
        });
    }
}

module.exports = {
    criarUsuario,
    excluirUsuarioEPedido
};