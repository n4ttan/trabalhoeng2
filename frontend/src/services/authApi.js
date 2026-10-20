const API_URL = 'http://localhost:3000';


export async function fazerLogin(email, senha) {

    const response = await fetch(
        `${API_URL}/login`,
        {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                email,
                senha
            })
        }
    );


    const data = await response.json();


    if (!response.ok) {

        throw new Error(
            data.erro ||
            data.mensagem ||
            'E-mail ou senha inválidos.'
        );

    }


    if (!data.token) {

        throw new Error(
            'O servidor não retornou o token de autenticação.'
        );

    }


    localStorage.setItem(
        'morada_token',
        data.token
    );


    return data;
}



export function obterToken() {

    return localStorage.getItem(
        'morada_token'
    );

}



export function estaLogado() {

    return Boolean(
        obterToken()
    );

}



export function obterUsuario() {

    const usuario =
        localStorage.getItem(
            'morada_usuario'
        );


    if (!usuario) {

        return null;

    }


    try {

        return JSON.parse(usuario);

    } catch {

        return null;

    }

}



export function logout() {

    localStorage.removeItem(
        'morada_token'
    );

    localStorage.removeItem(
        'morada_usuario'
    );

    localStorage.removeItem(
        'morada_mensagem'
    );

}