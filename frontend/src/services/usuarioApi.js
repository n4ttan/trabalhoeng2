const API_URL = 'http://localhost:3000';

export async function criarUsuario(nome, email, senha) {

    const response = await fetch(
        `${API_URL}/usuarios`,
        {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                nome,
                email,
                senha,
                perfil: 'CANDIDATO'
            })
        }
    );

    let data;

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        throw new Error(
            data.erro ||
            'Erro ao cadastrar usuário.'
        );
    }

    return data;
}