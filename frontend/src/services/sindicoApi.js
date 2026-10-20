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
 * LISTAR MORADORES PENDENTES
 */
export async function listarPendentes() {

    return await requisicao(
        '/usuarios/pendentes'
    );

}


/*
 * APROVAR MORADOR
 */
export async function aprovarMorador(
    usuarioId
) {

    return await requisicao(
        `/usuarios/${usuarioId}/aprovar`,
        {
            method: 'PATCH'
        }
    );

}


/*
 * REJEITAR MORADOR
 */
export async function rejeitarMorador(
    usuarioId
) {

    return await requisicao(
        `/usuarios/${usuarioId}/rejeitar`,
        {
            method: 'PATCH'
        }
    );

}


/*
 * EXCLUIR USUÁRIO
 */
export async function excluirUsuario(
    usuarioId
) {

    return await requisicao(
        `/usuarios/${usuarioId}`,
        {
            method: 'DELETE'
        }
    );

}