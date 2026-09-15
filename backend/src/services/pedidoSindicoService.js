const pedidoSindicoRepository = require('../repositories/pedidoSindicoRepository');

// Orquestra a regra de negócio para criação do pedido.
async function criarPedidoSindico(usuarioId) {
    return pedidoSindicoRepository.criarPedidoSindico(usuarioId);
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