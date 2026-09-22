import { useState } from 'react';
import { Link } from 'react-router-dom';

import { criarUsuario } from '../services/usuarioApi';

import './CadastroMoradorPage.css';

function CadastroMoradorPage() {

    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');

    const [mensagem, setMensagem] = useState('');
    const [erro, setErro] = useState('');
    const [carregando, setCarregando] = useState(false);

    async function cadastrarMorador(event) {
        event.preventDefault();

        setMensagem('');
        setErro('');

        if (!nome || !email || !senha || !confirmarSenha) {
            setErro('Preencha todos os campos.');
            return;
        }

        if (senha !== confirmarSenha) {
            setErro('As senhas não são iguais.');
            return;
        }

        if (senha.length < 6) {
            setErro('A senha deve possuir pelo menos 6 caracteres.');
            return;
        }

        try {
            setCarregando(true);

            const resultado = await criarUsuario(
                nome,
                email,
                senha
            );

            setMensagem(
                resultado.mensagem ||
                'Cadastro realizado com sucesso!'
            );

            setNome('');
            setEmail('');
            setSenha('');
            setConfirmarSenha('');

        } catch (error) {

            setErro(error.message);

        } finally {

            setCarregando(false);

        }
    }

    return (
        <main className="cadastro-morador-container">

            <div className="cadastro-morador-card">

                <div className="cabecalho-cadastro">

                    <h1>Cadastro de Morador</h1>

                    <p>
                        Crie sua conta para acessar o sistema do condomínio.
                    </p>

                </div>

                <form
                    className="formulario-cadastro"
                    onSubmit={cadastrarMorador}
                >

                    <div className="campo">

                        <label htmlFor="nome">
                            Nome completo
                        </label>

                        <input
                            id="nome"
                            type="text"
                            value={nome}
                            onChange={(event) =>
                                setNome(event.target.value)
                            }
                            placeholder="Digite seu nome completo"
                        />

                    </div>


                    <div className="campo">

                        <label htmlFor="email">
                            E-mail
                        </label>

                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                            placeholder="Digite seu e-mail"
                        />

                    </div>


                    <div className="campo">

                        <label htmlFor="senha">
                            Senha
                        </label>

                        <input
                            id="senha"
                            type="password"
                            value={senha}
                            onChange={(event) =>
                                setSenha(event.target.value)
                            }
                            placeholder="Digite sua senha"
                        />

                    </div>


                    <div className="campo">

                        <label htmlFor="confirmarSenha">
                            Confirmar senha
                        </label>

                        <input
                            id="confirmarSenha"
                            type="password"
                            value={confirmarSenha}
                            onChange={(event) =>
                                setConfirmarSenha(event.target.value)
                            }
                            placeholder="Digite novamente sua senha"
                        />

                    </div>


                    {erro && (
                        <div className="mensagem erro">
                            {erro}
                        </div>
                    )}


                    {mensagem && (
                        <div className="mensagem sucesso">
                            {mensagem}
                        </div>
                    )}


                    <button
                        type="submit"
                        disabled={carregando}
                    >
                        {carregando
                            ? 'Cadastrando...'
                            : 'Cadastrar morador'}
                    </button>

                </form>


                <div className="voltar-home">

                    <Link to="/">
                        Voltar para a página inicial
                    </Link>

                </div>

            </div>

        </main>
    );
}

export default CadastroMoradorPage;