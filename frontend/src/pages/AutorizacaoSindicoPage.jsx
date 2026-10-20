import {
    useState
} from 'react';

import {
    useNavigate
} from 'react-router-dom';

import {
    aprovarPedidoSindico
} from '../services/pedidoSindicoApi';

import './AutorizacaoSindicoPage.css';


function AutorizacaoSindicoPage() {

    const navigate = useNavigate();


    const [
        pedidoId,
        setPedidoId
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


    async function autorizarPedido(event) {

        event.preventDefault();

        setMensagem('');
        setErro('');


        if (!pedidoId) {

            setErro(
                'Informe o ID do pedido.'
            );

            return;

        }


        if (
            Number.isNaN(
                Number(pedidoId)
            ) ||
            Number(pedidoId) <= 0
        ) {

            setErro(
                'Informe um ID de pedido válido.'
            );

            return;

        }


        try {

            setCarregando(true);


            const data =
                await aprovarPedidoSindico(
                    pedidoId
                );


            setMensagem(
                data.mensagem ||
                'Pedido de síndico aprovado com sucesso!'
            );


            setPedidoId('');

        } catch (error) {

            setErro(
                error.message ||
                'Não foi possível aprovar o pedido.'
            );

        } finally {

            setCarregando(false);

        }

    }


    function voltar() {

        navigate('/');

    }


    return (

        <main className="autorizacao-page">

            <div className="autorizacao-container">
                <button type="button" className="autorizacao-voltar" onClick={voltar}>&#8592; Voltar</button>

<section className="autorizacao-card">


                    <div className="autorizacao-icone">
                        ✓
                    </div>


                    <span className="autorizacao-etiqueta">
                        ADMINISTRAÇÃO
                    </span>


                    <h1>
                        Autorizar síndico
                    </h1>


                    <p className="autorizacao-descricao">

                        Informe o ID do pedido de síndico
                        para aprovar a solicitação.

                    </p>



                    {erro && (

                        <div className="autorizacao-alerta erro">

                            ⚠ {erro}

                        </div>

                    )}



                    {mensagem && (

                        <div className="autorizacao-alerta sucesso">

                            ✓ {mensagem}

                        </div>

                    )}



                    <form
                        className="autorizacao-form"
                        onSubmit={autorizarPedido}
                    >

                        <div className="autorizacao-campo">

                            <label htmlFor="pedidoId">

                                ID do pedido

                            </label>


                            <input
                                id="pedidoId"
                                type="number"
                                min="1"
                                value={pedidoId}
                                onChange={(event) =>
                                    setPedidoId(
                                        event.target.value
                                    )
                                }
                                placeholder="Digite o ID do pedido"
                            />

                        </div>



                        <button
                            type="submit"
                            className="autorizacao-botao"
                            disabled={carregando}
                        >

                            {carregando
                                ? 'Aprovando...'
                                : 'Aprovar pedido'}

                        </button>

                    </form>



                    <div className="autorizacao-info">

                        <div className="autorizacao-info-item">

                            <strong>
                                1
                            </strong>

                            <div>

                                <b>
                                    Localize o pedido
                                </b>

                                <span>
                                    Utilize o ID da solicitação
                                    que precisa ser analisada.
                                </span>

                            </div>

                        </div>



                        <div className="autorizacao-info-item">

                            <strong>
                                2
                            </strong>

                            <div>

                                <b>
                                    Confirme a autorização
                                </b>

                                <span>
                                    O sistema processará a
                                    aprovação do pedido.
                                </span>

                            </div>

                        </div>



                        <div className="autorizacao-info-item">

                            <strong>
                                3
                            </strong>

                            <div>

                                <b>
                                    Permissão concedida
                                </b>

                                <span>
                                    O usuário poderá receber
                                    as permissões correspondentes.
                                </span>

                            </div>

                        </div>

                    </div>


                </section>



                <footer className="autorizacao-footer">

                    Morada Residências · Gestão
                    condominial simplificada

                </footer>


            </div>

        </main>

    );

}


export default AutorizacaoSindicoPage;