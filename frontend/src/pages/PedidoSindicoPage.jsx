import { useState } from 'react';

import {
    criarPedidoSindico,
    aprovarPedidoSindico
} from '../services/pedidoSindicoApi';

import './PedidoSindicoPage.css';


function PedidoSindicoPage() {

    const [usuarioId, setUsuarioId] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [carregando, setCarregando] = useState(false);

    const [pedidoId, setPedidoId] = useState('');
    const [mensagemAprovacao, setMensagemAprovacao] = useState('');
    const [aprovando, setAprovando] = useState(false);


    async function enviarPedido(event) {
        event.preventDefault();

        if (!usuarioId) {
            setMensagem('Digite o ID do usuário.');
            return;
        }

        try {
            setCarregando(true);
            setMensagem('');

            const resultado = await criarPedidoSindico(usuarioId);

            setMensagem(
                resultado.mensagem ||
                'Pedido de síndico enviado com sucesso!'
            );

            setUsuarioId('');

        } catch (error) {
            setMensagem(error.message);

        } finally {
            setCarregando(false);
        }
    }


    async function aprovarPedido(event) {
        event.preventDefault();

        if (!pedidoId) {
            setMensagemAprovacao('Digite o ID do pedido.');
            return;
        }

        try {
            setAprovando(true);
            setMensagemAprovacao('');

            const resultado = await aprovarPedidoSindico(pedidoId);

            setMensagemAprovacao(
                resultado.mensagem ||
                'Pedido aprovado com sucesso!'
            );

            setPedidoId('');

        } catch (error) {
            setMensagemAprovacao(error.message);

        } finally {
            setAprovando(false);
        }
    }


    return (
        <div className="pedido-sindico-container">

            <div className="pedido-sindico-card">

                <div className="titulo-pagina">
                    <h1>Gestão de Síndico</h1>

                    <p>
                        Gerencie as solicitações de cadastro
                        de síndico do condomínio.
                    </p>
                </div>


                <section className="secao-sindico">

                    <h2>Solicitar cadastro como síndico</h2>

                    <p>
                        Informe o ID do usuário para solicitar
                        o cadastro como síndico.
                    </p>

                    <form
                        className="formulario-sindico"
                        onSubmit={enviarPedido}
                    >

                        <label htmlFor="usuarioId">
                            ID do usuário
                        </label>

                        <input
                            id="usuarioId"
                            type="number"
                            min="1"
                            value={usuarioId}
                            onChange={(event) =>
                                setUsuarioId(event.target.value)
                            }
                            placeholder="Digite o ID do usuário"
                        />

                        <button
                            type="submit"
                            disabled={carregando}
                        >
                            {
                                carregando
                                    ? 'Enviando...'
                                    : 'Solicitar cadastro'
                            }
                        </button>

                    </form>

                    {mensagem && (
                        <div className="mensagem">
                            {mensagem}
                        </div>
                    )}

                </section>


                <hr className="divisor" />


                <section className="secao-sindico">

                    <h2>Aprovar pedido de síndico</h2>

                    <p>
                        Informe o ID do pedido que será aprovado.
                    </p>

                    <form
                        className="formulario-sindico"
                        onSubmit={aprovarPedido}
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
                            className="botao-aprovar"
                            type="submit"
                            disabled={aprovando}
                        >
                            {
                                aprovando
                                    ? 'Aprovando...'
                                    : 'Aprovar pedido'
                            }
                        </button>

                    </form>

                    {mensagemAprovacao && (
                        <div className="mensagem">
                            {mensagemAprovacao}
                        </div>
                    )}

                </section>

            </div>

        </div>
    );
}


export default PedidoSindicoPage;