import { useState } from 'react';

import { criarPedidoSindico }
    from '../services/permissaoSindicoApi';

import './PedidoSindicoPage.css';

function PermissaoSindicoPage() {

    const [usuarioId, setUsuarioId] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [carregando, setCarregando] = useState(false);

    async function enviarPedido(event) {

        event.preventDefault();

        if (!usuarioId) {
            setMensagem('Digite o ID do usuário.');
            return;
        }

        try {

            setCarregando(true);
            setMensagem('');

            const resultado =
                await criarPedidoSindico(usuarioId);

            setMensagem(
                resultado.mensagem ||
                'Pedido enviado com sucesso!'
            );

            setUsuarioId('');

        } catch (error) {

            setMensagem(error.message);

        } finally {

            setCarregando(false);

        }
    }

    return (
        <div className="pedido-sindico-container">

            <div className="pedido-sindico-card">

                <div className="titulo-pagina">

                    <h1>Permissão do Síndico</h1>

                    <p>
                        Solicite permissão para se tornar
                        síndico do condomínio.
                    </p>

                </div>

                <section className="secao-sindico">

                    <h2>Solicitar permissão</h2>

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

                            {carregando
                                ? 'Enviando...'
                                : 'Solicitar permissão'
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

export default PermissaoSindicoPage;