const API_URL = 'http://localhost:3000';


function obterToken() {

    return localStorage.getItem(
        'morada_token'
    );

}


async function requisicao(
    url,
    options = {}
) {

    const token =
        obterToken();


    const response =
        await fetch(
            `${API_URL}${url}`,
            {
                ...options,

                headers: {
                    'Content-Type':
                        'application/json',

                    ...(options.headers || {}),

                    ...(token
                        ? {
                            Authorization:
                                `Bearer ${token}`
                        }
                        : {})
                }
            }
        );


    let data;

    try {

        data =
            await response.json();

    } catch {

        data = {};

    }


    if (!response.ok) {

        throw new Error(
            data.erro ||
            data.mensagem ||
            'Não foi possível realizar a operação.'
        );

    }


    return data;

}


/*
 * CRIAR PEDIDO DE SÍNDICO
 */
export async function criarPedidoSindico(
    usuario_id
) {

    return await requisicao(
        '/pedidos-sindico',
        {
            method: 'POST',

            body: JSON.stringify({
                usuario_id:
                    Number(usuario_id),

                deferido: false
            })
        }
    );

}


/*
 * APROVAR PEDIDO DE SÍNDICO
 */
export async function aprovarPedidoSindico(
    pedidoId
) {

    return await requisicao(
        `/pedidos-sindico/${pedidoId}/aprovar`,
        {
            method: 'PATCH'
        }
    );

}