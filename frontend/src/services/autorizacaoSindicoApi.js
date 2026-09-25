const API_URL = 'http://localhost:3000';

export async function aprovarPedidoSindico(pedidoId) {

    const response = await fetch(
        `${API_URL}/pedidos-sindico/${pedidoId}/aprovar`,
        {
            method: 'PATCH'
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.erro ||
            'Erro ao autorizar pedido de síndico'
        );
    }

    return data;
}