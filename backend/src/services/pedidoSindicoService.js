const pedidoSindicoRepository = require('../repositories/pedidoSindicoRepository');

// Orquestra a regra de negócio para criação do pedido.
async function criarPedidoSindico(usuario_id, deferido) {
    return pedidoSindicoRepository.criarPedidoSindico(usuario_id, deferido);
}

// Encapsula a regra de negócio de aprovação de pedido.
// A camada de serviço centraliza a lógica antes de chamar o repositório.
async function aprovarPedidoSindico(pedidoId) {
    return pedidoSindicoRepository.aprovarPedidoSindico(pedidoId);
}

module.exports = {
    criarPedidoSindico,
    aprovarPedidoSindico
};