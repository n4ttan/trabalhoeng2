import { useState } from 'react';

import { aprovarPedidoSindico }
    from '../services/autorizacaoSindicoApi';

import './PedidoSindicoPage.css';

function AutorizacaoSindicoPage() {

    const [pedidoId, setPedidoId] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [aprovando, setAprovando] = useState(false);

    async function autorizarPedido(event) {

        event.preventDefault();

        if (!pedidoId) {
            setMensagem('Digite o ID do pedido.');
            return;
        }

        try {

            setAprovando(true);
            setMensagem('');

            const resultado =
                await aprovarPedidoSindico(pedidoId);

            setMensagem(
                resultado.mensagem ||
                'Pedido autorizado com sucesso!'
            );

            setPedidoId('');

        } catch (error) {

            setMensagem(error.message);

        } finally {

            setAprovando(false);
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
                        Autorize uma solicitação para
                        se tornar síndico.
                    </p>

                </div>

                <section className="secao-sindico">

                    <h2>
                        Autorizar solicitação
                    </h2>

                    <form
                        className="formulario-sindico"
                        onSubmit={autorizarPedido}
                    >

                        <label htmlFor="pedidoId">
                            ID do pedido
                        </label>

                        <input
                            id="pedidoId"
                            type="number"
                            min="1"
                            value={pedidoId}
                            onChange={(event) =>
                                setPedidoId(event.target.value)
                            }
                            placeholder="Digite o ID do pedido"
                        />

                        <button
                            type="submit"
                            className="botao-aprovar"
                            disabled={aprovando}
                        >

                            {aprovando
                                ? 'Autorizando...'
                                : 'Autorizar pedido'
                            }

                        </button>

                    </form>

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