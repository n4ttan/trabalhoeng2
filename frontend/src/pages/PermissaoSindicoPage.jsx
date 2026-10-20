import {
    useState
} from 'react';

import {
    useNavigate
} from 'react-router-dom';

import {
    criarPedidoSindico
} from '../services/pedidoSindicoApi';

import './PermissaoSindicoPage.css';


function PermissaoSindicoPage() {

    const navigate = useNavigate();


    const [
        usuarioId,
        setUsuarioId
    ] = useState('');


    const [
        carregando,
        setCarregando
    ] = useState(false);


    const [
        mensagem,
        setMensagem
    ] = useState('');


    const [
        erro,
        setErro
    ] = useState('');


    async function enviarPedido(event) {

        event.preventDefault();

        setMensagem('');
        setErro('');


        if (!usuarioId) {

            setErro(
                'Informe o ID do usuário.'
            );

            return;

        }


        if (
            Number.isNaN(
                Number(usuarioId)
            ) ||
            Number(usuarioId) <= 0
        ) {

            setErro(
                'Informe um ID de usuário válido.'
            );

            return;

        }


        try {

            setCarregando(true);


            const data =
                await criarPedidoSindico(
                    usuarioId
                );


            setMensagem(
                data.mensagem ||
                'Pedido de síndico enviado com sucesso!'
            );


            setUsuarioId('');

        } catch (error) {

            setErro(
                error.message ||
                'Não foi possível enviar o pedido.'
            );

        } finally {

            setCarregando(false);

        }

    }


    function voltar() {

        navigate('/');

    }


    return (

        <main className="permissao-page">

            <div className="permissao-container">


                <header className="permissao-header">

                    <button
                        type="button"
                        className="permissao-voltar"
                        onClick={voltar}
                    >
                        ← Voltar
                    </button>


                    <div className="permissao-logo">

                        <span>
                            Morada
                        </span>

                        <small>
                            Residências
                        </small>

                    </div>

                </header>



                <section className="permissao-card">


                    <div className="permissao-icone">
                        🏠
                    </div>


                    <span className="permissao-etiqueta">
                        SOLICITAÇÃO DE ACESSO
                    </span>


                    <h1>
                        Solicitar permissão de síndico
                    </h1>


                    <p className="permissao-descricao">

                        Envie uma solicitação para que
                        sua conta possa receber permissões
                        de síndico no sistema.

                    </p>



                    {erro && (

                        <div className="permissao-alerta erro">

                            ⚠ {erro}

                        </div>

                    )}



                    {mensagem && (

                        <div className="permissao-alerta sucesso">

                            ✓ {mensagem}

                        </div>

                    )}



                    <form
                        className="permissao-form"
                        onSubmit={enviarPedido}
                    >

                        <div className="permissao-campo">

                            <label htmlFor="usuarioId">

                                ID do usuário

                            </label>


                            <input
                                id="usuarioId"
                                type="number"
                                min="1"
                                value={usuarioId}
                                onChange={(event) =>
                                    setUsuarioId(
                                        event.target.value
                                    )
                                }
                                placeholder="Digite o ID do usuário"
                            />

                        </div>



                        <button
                            type="submit"
                            className="permissao-botao"
                            disabled={carregando}
                        >

                            {carregando
                                ? 'Enviando...'
                                : 'Enviar solicitação'}

                        </button>

                    </form>



                    <div className="permissao-info">

                        <div className="permissao-info-item">

                            <strong>
                                1
                            </strong>

                            <div>

                                <b>
                                    Envie a solicitação
                                </b>

                                <span>
                                    Informe o ID da conta que
                                    deseja solicitar a permissão.
                                </span>

                            </div>

                        </div>



                        <div className="permissao-info-item">

                            <strong>
                                2
                            </strong>

                            <div>

                                <b>
                                    Aguarde a análise
                                </b>

                                <span>
                                    O pedido será analisado
                                    pelo responsável.
                                </span>

                            </div>

                        </div>



                        <div className="permissao-info-item">

                            <strong>
                                3
                            </strong>

                            <div>

                                <b>
                                    Acesso liberado
                                </b>

                                <span>
                                    Após a aprovação, sua conta
                                    poderá utilizar as funções
                                    de síndico.
                                </span>

                            </div>

                        </div>

                    </div>


                </section>



                <footer className="permissao-footer">

                    Morada Residências · Gestão
                    condominial simplificada

                </footer>


            </div>

        </main>

    );

}


export default PermissaoSindicoPage;