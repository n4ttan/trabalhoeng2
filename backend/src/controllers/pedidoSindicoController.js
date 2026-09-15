const pedidoSindicoService = require('../services/pedidoSindicoService');

// Controla a criação e aprovação de pedidos de síndico, delegando a lógica para o serviço correspondente.
async function criarPedidoSindico(req, res) {
    try {
        const { usuarioId } = req.body;

        const pedidoId = await pedidoSindicoService.criarPedidoSindico(usuarioId);

        res.status(201).json({
            mensagem: 'Pedido de cadastro de síndico criado com sucesso',
            pedidoId: pedidoId
        });
    } catch (error) {
        console.error('Erro ao criar pedido de síndico:', error);

        res.status(500).json({
            erro: 'Erro ao criar pedido de síndico'
        });
    }
}

// Controla a aprovação de pedidos de síndico, delegando a lógica para o serviço correspondente.
async function aprovarPedidoSindico(req, res) {
    try {
        const { pedidoId } = req.params;

        const resultado = await pedidoSindicoService.aprovarPedidoSindico(pedidoId);

        if (resultado === false) {
            res.status(404).json({
                erro: 'Pedido não encontrado ou não está pendente'
            });
            return;
        }

        res.json({
            mensagem: 'Pedido aprovado e usuário promovido a síndico'
        });
    } catch (error) {
        console.error('Erro ao aprovar pedido de síndico:', error);

        res.status(500).json({
            erro: 'Erro ao aprovar pedido de síndico'
        });
    }
}

module.exports = {
    criarPedidoSindico,
    aprovarPedidoSindico
};