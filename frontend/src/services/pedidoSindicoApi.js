const API_URL = 'http://localhost:3000';

export async function criarPedidoSindico(usuario_id) {
    const response = await fetch(
        `${API_URL}/pedidos-sindico`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                usuario_id: Number(usuario_id),
                deferido: false
            })
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.erro || 'Erro ao criar pedido de síndico'
        );
    }

    return data;
}

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
            data.erro || 'Erro ao aprovar pedido de síndico'
        );
    }

    return data;
}