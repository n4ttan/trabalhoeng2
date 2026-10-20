const API_URL = 'http://localhost:3000';


async function requisicao(
    url,
    options = {}
) {

    const token =
        localStorage.getItem(
            'morada_token'
        );


    const response = await fetch(
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


    let data = {};

    try {

        data = await response.json();

    } catch {

        data = {};

    }


    if (!response.ok) {

        const error = new Error(
            data.erro ||
            data.mensagem ||
            'Não foi possível realizar a operação.'
        );
        error.codigo = data.codigo;
        throw error;

    }


    return data;

}



/*
 * Criar morador
 */
export async function criarMorador(
    dados
) {

    return await requisicao(
        '/usuarios',
        {
            method: 'POST',

            body: JSON.stringify(
                dados
            )
        }
    );

}

export async function cadastrarMorador(dados) {
    return await requisicao(
        '/usuarios/moradores',
        {
            method: 'POST',
            body: JSON.stringify(dados)
        }
    );
}

export async function validarEmail(email, codigo) {
    return await requisicao(
        '/usuarios/validar-email',
        {
            method: 'POST',
            body: JSON.stringify({ email, codigo })
        }
    );
}

export async function reenviarCodigo(email) {
    return await requisicao(
        '/usuarios/reenviar-codigo',
        {
            method: 'POST',
            body: JSON.stringify({ email })
        }
    );
}



/*
 * Buscar/validar cadastro
 */
export async function buscarMensagem() {

    return await requisicao(
        '/mensagem'
    );

}
