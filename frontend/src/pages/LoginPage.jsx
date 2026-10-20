import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import './LoginPage.css';


const API_URL = 'http://localhost:3000';


function LoginPage() {

    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');

    const [carregando, setCarregando] =
        useState(false);

    const [erro, setErro] =
        useState('');


    async function fazerLogin(event) {

        event.preventDefault();

        setErro('');


        if (!email || !senha) {

            setErro(
                'Preencha o e-mail e a senha.'
            );

            return;

        }


        try {

            setCarregando(true);


            const response = await fetch(
                `${API_URL}/login`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({
                        email,
                        senha
                    })
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.erro ||
                    data.mensagem ||
                    'E-mail ou senha inválidos.'
                );

            }


            /*
             * O backend retorna o token
             * após o login.
             */
            if (!data.token) {

                throw new Error(
                    'O servidor não retornou um token de autenticação.'
                );

            }


            localStorage.setItem(
                'morada_token',
                data.token
            );


            /*
             * Guardamos também algumas
             * informações disponíveis na resposta.
             */
            localStorage.setItem(
                'morada_mensagem',
                data.mensagem ||
                'Login realizado com sucesso!'
            );


            /*
             * Decodifica o payload do JWT
             * para descobrir o perfil do usuário,
             * caso o backend tenha colocado essa
             * informação no token.
             */
            let usuario = null;


            try {

                const partes =
                    data.token.split('.');


                if (partes.length === 3) {

                    const payload =
                        JSON.parse(
                            atob(
                                partes[1]
                                    .replace(/-/g, '+')
                                    .replace(/_/g, '/')
                            )
                        );


                    usuario = payload;

                }

            } catch {

                usuario = null;

            }


            if (usuario) {

                localStorage.setItem(
                    'morada_usuario',
                    JSON.stringify(usuario)
                );

            }


            /*
             * Se o token informar que o usuário
             * é síndico, enviamos para o painel.
             */
            const perfil =
                usuario?.perfil ||
                usuario?.tipo ||
                usuario?.role;


            if (
                perfil === 'SINDICO' ||
                perfil === 'sindico' ||
                perfil === 'Sindico'
            ) {

                navigate(
                    '/painel-sindico'
                );

                return;

            }


            /*
             * Usuário comum volta para a Home.
             */
            navigate('/');


        } catch (error) {

            setErro(
                error.message ||
                'Não foi possível realizar o login.'
            );

        } finally {

            setCarregando(false);

        }

    }


    function voltar() {

        navigate('/');

    }


    return (
        <main className="login-page">
            <section className="login-card">
                <h1>Entrar</h1>
                <p className="login-descricao">Entre na sua conta para acessar o sistema do condomínio.</p>
                {erro && <div className="login-alerta">{erro}</div>}
                <form className="login-form" onSubmit={fazerLogin}>
                    <div className="login-campo"><label htmlFor="email">E-mail</label><input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="seu@email.com" autoComplete="email" /></div>
                    <div className="login-campo"><label htmlFor="senha">Senha</label><input id="senha" type="password" value={senha} onChange={(event) => setSenha(event.target.value)} placeholder="Digite sua senha" autoComplete="current-password" /></div>
                    <button type="submit" className="login-botao" disabled={carregando}>{carregando ? 'Entrando...' : 'Entrar'}</button>
                </form>
                <div className="login-cadastro"><span>Ainda não possui uma conta?</span><button type="button" onClick={() => navigate('/cadastro-morador')}>Criar minha conta</button></div>
                <div className="login-voltar"><button type="button" onClick={voltar}>Voltar para a página inicial</button></div>
            </section>
        </main>
    );
}

export default LoginPage;