import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    listarPendentes,
    aprovarMorador,
    rejeitarMorador,
    excluirUsuario
} from '../services/sindicoApi';

import {
    aprovarPedidoSindico
} from '../services/pedidoSindicoApi';

import './PainelSindicoPage.css';


function PainelSindicoPage() {

    const navigate = useNavigate();

    const [moradores, setMoradores] =
        useState([]);

    const [pedidoId, setPedidoId] =
        useState('');

    const [carregando, setCarregando] =
        useState(true);

    const [processando, setProcessando] =
        useState(false);

    const [mensagem, setMensagem] =
        useState('');

    const [erro, setErro] =
        useState('');


    useEffect(() => {

        const token =
            localStorage.getItem(
                'morada_token'
            );


        if (!token) {

            navigate('/login');

            return;

        }


        carregarPendentes();

    }, [navigate]);


    async function carregarPendentes() {

        try {

            setCarregando(true);

            setErro('');


            const resultado =
                await listarPendentes();


            if (
                Array.isArray(resultado)
            ) {

                setMoradores(
                    resultado
                );

            } else if (
                Array.isArray(
                    resultado.usuarios
                )
            ) {

                setMoradores(
                    resultado.usuarios
                );

            } else if (
                Array.isArray(
                    resultado.data
                )
            ) {

                setMoradores(
                    resultado.data
                );

            } else {

                setMoradores([]);

            }

        } catch (error) {

            setErro(
                error.message ||
                'Não foi possível carregar os moradores.'
            );

        } finally {

            setCarregando(false);

        }

    }


    async function aprovar(id) {

        const confirmar =
            window.confirm(
                'Deseja realmente aprovar este morador?'
            );


        if (!confirmar) {

            return;

        }


        try {

            setProcessando(true);

            setMensagem('');

            setErro('');


            const resultado =
                await aprovarMorador(
                    id
                );


            setMensagem(
                resultado.mensagem ||
                'Morador aprovado com sucesso!'
            );


            await carregarPendentes();

        } catch (error) {

            setErro(
                error.message ||
                'Não foi possível aprovar o morador.'
            );

        } finally {

            setProcessando(false);

        }

    }


    async function rejeitar(id) {

        const confirmar =
            window.confirm(
                'Deseja realmente rejeitar este morador?'
            );


        if (!confirmar) {

            return;

        }


        try {

            setProcessando(true);

            setMensagem('');

            setErro('');


            const resultado =
                await rejeitarMorador(
                    id
                );


            setMensagem(
                resultado.mensagem ||
                'Morador rejeitado com sucesso!'
            );


            await carregarPendentes();

        } catch (error) {

            setErro(
                error.message ||
                'Não foi possível rejeitar o morador.'
            );

        } finally {

            setProcessando(false);

        }

    }


    async function excluir(id) {

        const confirmar =
            window.confirm(
                'ATENÇÃO!\n\nDeseja realmente excluir este usuário e os pedidos associados?'
            );


        if (!confirmar) {

            return;

        }


        try {

            setProcessando(true);

            setMensagem('');

            setErro('');


            const resultado =
                await excluirUsuario(
                    id
                );


            setMensagem(
                resultado.mensagem ||
                'Usuário excluído com sucesso!'
            );


            await carregarPendentes();

        } catch (error) {

            setErro(
                error.message ||
                'Não foi possível excluir o usuário.'
            );

        } finally {

            setProcessando(false);

        }

    }


    async function autorizarPedido(
        event
    ) {

        event.preventDefault();


        setMensagem('');

        setErro('');


        if (!pedidoId) {

            setErro(
                'Digite o ID do pedido de síndico.'
            );

            return;

        }


        try {

            setProcessando(true);


            const resultado =
                await aprovarPedidoSindico(
                    pedidoId
                );


            setMensagem(
                resultado.mensagem ||
                'Pedido de síndico aprovado com sucesso!'
            );


            setPedidoId('');

        } catch (error) {

            setErro(
                error.message ||
                'Não foi possível aprovar o pedido.'
            );

        } finally {

            setProcessando(false);

        }

    }


    function sair() {

        localStorage.removeItem(
            'morada_token'
        );

        localStorage.removeItem(
            'morada_usuario'
        );


        navigate('/login');

    }


    return (

        <main className="painel-sindico">


            {/* HEADER */}

            <header className="painel-header">

                <div className="painel-marca">

                    <span className="painel-logo">
                        Morada
                    </span>

                    <span className="painel-logo-sub">
                        Residências
                    </span>

                </div>


                <button
                    className="botao-sair"
                    onClick={sair}
                >
                    Sair
                </button>

            </header>


            {/* CONTEÚDO */}

            <section className="painel-conteudo">


                {/* TÍTULO */}

                <div className="painel-titulo">

                    <div>

                        <span className="etiqueta">
                            ÁREA ADMINISTRATIVA
                        </span>

                        <h1>
                            Painel do Síndico
                        </h1>

                        <p>
                            Gerencie moradores e solicitações
                            do condomínio.
                        </p>

                    </div>


                    <button
                        className="botao-atualizar"
                        onClick={
                            carregarPendentes
                        }
                        disabled={
                            carregando
                        }
                    >
                        ↻ Atualizar
                    </button>

                </div>


                {/* MENSAGENS */}

                {mensagem && (

                    <div className="alerta sucesso">

                        ✓ {mensagem}

                    </div>

                )}


                {erro && (

                    <div className="alerta erro">

                        ⚠ {erro}

                    </div>

                )}


                {/* ESTATÍSTICAS */}

                <section className="estatisticas">

                    <div className="estatistica-card">

                        <span className="estatistica-icone">
                            👥
                        </span>

                        <div>

                            <strong>
                                {
                                    moradores.length
                                }
                            </strong>

                            <span>
                                Pendentes
                            </span>

                        </div>

                    </div>


                    <div className="estatistica-card">

                        <span className="estatistica-icone">
                            ✓
                        </span>

                        <div>

                            <strong>
                                Síndico
                            </strong>

                            <span>
                                Área administrativa
                            </span>

                        </div>

                    </div>

                </section>


                {/* MORADORES */}

                <section className="painel-card">

                    <div className="card-cabecalho">

                        <div>

                            <span className="mini-etiqueta">
                                APROVAÇÕES
                            </span>

                            <h2>
                                Moradores pendentes
                            </h2>

                            <p>
                                Usuários aguardando aprovação
                                para entrar no condomínio.
                            </p>

                        </div>

                    </div>


                    {carregando ? (

                        <div className="estado-vazio">

                            <div className="carregando">

                                <span></span>
                                <span></span>
                                <span></span>

                            </div>

                            <p>
                                Carregando moradores...
                            </p>

                        </div>

                    ) : moradores.length === 0 ? (

                        <div className="estado-vazio">

                            <span className="vazio-icone">
                                ✓
                            </span>

                            <strong>
                                Tudo em dia!
                            </strong>

                            <p>
                                Não existem moradores
                                aguardando aprovação.
                            </p>

                        </div>

                    ) : (

                        <div className="tabela-wrapper">

                            <table>

                                <thead>

                                    <tr>

                                        <th>
                                            ID
                                        </th>

                                        <th>
                                            Nome
                                        </th>

                                        <th>
                                            E-mail
                                        </th>

                                        <th>
                                            Perfil
                                        </th>

                                        <th>
                                            Ações
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {
                                        moradores.map(
                                            (morador) => (

                                                <tr
                                                    key={
                                                        morador.id
                                                    }
                                                >

                                                    <td>

                                                        <span className="id-morador">

                                                            #
                                                            {
                                                                morador.id
                                                            }

                                                        </span>

                                                    </td>


                                                    <td>

                                                        <strong>

                                                            {
                                                                morador.nome ||
                                                                'Sem nome'
                                                            }

                                                        </strong>

                                                    </td>


                                                    <td>

                                                        {
                                                            morador.email ||
                                                            'Sem e-mail'
                                                        }

                                                    </td>


                                                    <td>

                                                        <span className="badge">

                                                            {
                                                                morador.perfil ||
                                                                'MORADOR'
                                                            }

                                                        </span>

                                                    </td>


                                                    <td>

                                                        <div className="acoes">

                                                            <button
                                                                className="botao-aprovar"
                                                                disabled={
                                                                    processando
                                                                }
                                                                onClick={
                                                                    () =>
                                                                        aprovar(
                                                                            morador.id
                                                                        )
                                                                }
                                                            >
                                                                Aprovar
                                                            </button>


                                                            <button
                                                                className="botao-rejeitar"
                                                                disabled={
                                                                    processando
                                                                }
                                                                onClick={
                                                                    () =>
                                                                        rejeitar(
                                                                            morador.id
                                                                        )
                                                                }
                                                            >
                                                                Rejeitar
                                                            </button>


                                                            <button
                                                                className="botao-excluir"
                                                                disabled={
                                                                    processando
                                                                }
                                                                onClick={
                                                                    () =>
                                                                        excluir(
                                                                            morador.id
                                                                        )
                                                                }
                                                            >
                                                                Excluir
                                                            </button>

                                                        </div>

                                                    </td>

                                                </tr>

                                            )
                                        )
                                    }

                                </tbody>

                            </table>

                        </div>

                    )}

                </section>


                {/* PEDIDO DE SÍNDICO */}

                <section className="painel-card">

                    <div className="card-cabecalho">

                        <div>

                            <span className="mini-etiqueta">
                                ADMINISTRAÇÃO
                            </span>

                            <h2>
                                Solicitação de síndico
                            </h2>

                            <p>
                                Informe o ID do pedido para
                                autorizar uma solicitação.
                            </p>

                        </div>

                    </div>


                    <form
                        className="form-pedido"
                        onSubmit={
                            autorizarPedido
                        }
                    >

                        <div>

                            <label htmlFor="pedidoId">

                                ID do pedido

                            </label>


                            <input
                                id="pedidoId"
                                type="number"
                                min="1"
                                value={
                                    pedidoId
                                }
                                onChange={
                                    (event) =>
                                        setPedidoId(
                                            event.target.value
                                        )
                                }
                                placeholder="Ex.: 12"
                            />

                        </div>


                        <button
                            type="submit"
                            disabled={
                                processando
                            }
                        >

                            {
                                processando
                                    ? 'Processando...'
                                    : 'Aprovar pedido'
                            }

                        </button>

                    </form>

                </section>


            </section>

        </main>

    );

}


export default PainelSindicoPage;