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
            data.erro ||
            'Erro ao solicitar permissão de síndico'
        );
    }

    return data;
}