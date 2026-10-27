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
            'Erro ao realizar operação.'
        );

    }


    return data;

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


/*
 * BUSCAR PERFIL DO USUÁRIO LOGADO
 */
export async function buscarPerfilUsuario() {

    return await requisicao('/usuarios/me');

}