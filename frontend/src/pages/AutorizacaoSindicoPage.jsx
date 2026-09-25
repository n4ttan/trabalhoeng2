import { useEffect, useState } from 'react';

import {
    listarPedidosPendentes,
    aprovarPedidoSindico
} from '../services/autorizacaoSindicoApi';

import './PedidoSindicoPage.css';


function AutorizacaoSindicoPage() {

    const [pedidos, setPedidos] = useState([]);
    const [mensagem, setMensagem] = useState('');
    const [carregando, setCarregando] = useState(true);
    const [aprovandoId, setAprovandoId] = useState(null);


    async function carregarPedidos() {

        try {

            setCarregando(true);
            setMensagem('');

            const dados = await listarPedidosPendentes();

            setPedidos(dados);

        } catch (error) {

            setMensagem(error.message);

        } finally {

            setCarregando(false);
        }
    }


    useEffect(() => {

        carregarPedidos();

    }, []);


    async function autorizarPedido(pedidoId) {

        try {

            setAprovandoId(pedidoId);
            setMensagem('');

            const resultado =
                await aprovarPedidoSindico(pedidoId);

            setMensagem(
                resultado.mensagem ||
                'Pedido autorizado com sucesso!'
            );

            await carregarPedidos();

        } catch (error) {

            setMensagem(error.message);

        } finally {

            setAprovandoId(null);
        }
    }


    return (

        <div className="pedido-sindico-container">

            <div className="pedido-sindico-card">

                <div className="titulo-pagina">

                    <h1>
                        Autorização do Síndico
                    </h1>

                    <p>
                        Solicitações pendentes para se tornar síndico.
                    </p>

                </div>


                <section className="secao-sindico">

                    <h2>
                        Solicitações pendentes
                    </h2>


                    {carregando && (

                        <p>
                            Carregando solicitações...
                        </p>

                    )}


                    {!carregando &&
                        pedidos.length === 0 && (

                            <p>
                                Nenhuma solicitação pendente.
                            </p>

                        )
                    }


                    {pedidos.map((pedido) => (

                        <div
                            key={pedido.pedido_id}
                            className="pedido-pendente"
                        >

                            <p>
                                <strong>
                                    ID do usuário:
                                </strong>{' '}

                                {pedido.usuario_id}
                            </p>


                            <button
                                type="button"
                                className="botao-aprovar"

                                onClick={() =>
                                    autorizarPedido(
                                        pedido.pedido_id
                                    )
                                }

                                disabled={
                                    aprovandoId ===
                                    pedido.pedido_id
                                }
                            >

                                {
                                    aprovandoId ===
                                    pedido.pedido_id
                                        ? 'Autorizando...'
                                        : 'Autorizar'
                                }

                            </button>

                        </div>

                    ))}


                    {mensagem && (

                        <div className="mensagem">
                            {mensagem}
                        </div>

                    )}

                </section>

            </div>

        </div>
    );
}


export default AutorizacaoSindicoPage;