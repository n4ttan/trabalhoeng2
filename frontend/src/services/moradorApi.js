const API_URL = 'http://localhost:3000';

// Envia um POST em JSON e devolve o corpo; lança Error com a mensagem do backend quando falha.
async function post(caminho, corpo, mensagemPadrao) {

    const response = await fetch(
        `${API_URL}${caminho}`,
        {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify(corpo)
        }
    );

    let data;

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        const erro = new Error(
            data.erro ||
            data.mensagem ||
            mensagemPadrao
        );

        erro.status = response.status;
        erro.codigo = data.codigo;

        throw erro;
    }

    return data;
}

export function cadastrarMorador(nome, email, senha, unidade) {
    return post(
        '/usuarios/moradores',
        { nome, email, senha, unidade },
        'Não foi possível realizar o cadastro.'
    );
}

export function validarEmail(email, codigo) {
    return post(
        '/usuarios/validar-email',
        { email, codigo },
        'Não foi possível validar o e-mail.'
    );
}

export function reenviarCodigo(email) {
    return post(
        '/usuarios/reenviar-codigo',
        { email },
        'Não foi possível reenviar o código.'
    );
}
