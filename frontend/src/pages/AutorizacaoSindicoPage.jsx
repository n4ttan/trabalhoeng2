import {
    useState
} from 'react';

import {
    useNavigate
} from 'react-router-dom';

import {
    aprovarPedidoSindico,
    reprovarPedidoSindico
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


    async function processarPedido(acao) {
        setMensagem('');
        setErro('');

        if (!pedidoId) {
            setErro('Informe o ID do pedido.');
            return;
        }

        const idNum = Number(pedidoId);
        if (Number.isNaN(idNum) || idNum <= 0) {
            setErro('Informe um ID de pedido válido (número positivo).');
            return;
        }

        try {
            setCarregando(acao);

            if (acao === 'aprovar') {
                const data = await aprovarPedidoSindico(idNum);
                setMensagem(data.mensagem || 'Pedido de síndico aprovado com sucesso!');
            } else if (acao === 'reprovar') {
                const data = await reprovarPedidoSindico(idNum);
                setMensagem(data.mensagem || 'Pedido de síndico reprovado com sucesso!');
            }

            setPedidoId('');
        } catch (error) {
            setErro(error.message || `Não foi possível ${acao === 'aprovar' ? 'aprovar' : 'reprovar'} o pedido.`);
        } finally {
            setCarregando(false);
        }
    }


    function voltar() {
        navigate('/');
    }


    return (
        <main className="autorizacao-sindico-page">
            <div className="autorizacao-container">

                <header className="autorizacao-header">
                    <button
                        type="button"
                        className="botao-voltar-autorizacao"
                        onClick={voltar}
                    >
                        ← Voltar
                    </button>

                    <div className="autorizacao-logo">
                        <span>Morada</span>
                        <small>Residências</small>
                    </div>
                </header>

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
                        Informe o ID do pedido de candidatura para aprovar ou reprovar a solicitação de síndico.
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
                        onSubmit={(e) => {
                            e.preventDefault();
                            processarPedido('aprovar');
                        }}
                    >
                        <div className="campo-autorizacao">
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
                                placeholder="Digite o ID do pedido (ex: 1)"
                            />
                            <span className="campo-ajuda-autorizacao">
                                Identificador único do pedido de candidatura registrado no sistema.
                            </span>
                        </div>

                        <div className="botoes-autorizacao-acoes">
                            <button
                                type="submit"
                                className="botao-autorizar"
                                disabled={Boolean(carregando)}
                            >
                                {carregando === 'aprovar'
                                    ? 'Aprovando...'
                                    : 'Aprovar pedido'}
                            </button>

                            <button
                                type="button"
                                className="botao-reprovar-autorizacao"
                                disabled={Boolean(carregando)}
                                onClick={() => processarPedido('reprovar')}
                            >
                                {carregando === 'reprovar'
                                    ? 'Reprovando...'
                                    : 'Reprovar pedido'}
                            </button>
                        </div>
                    </form>

                    <div className="autorizacao-info">
                        <div className="info-autorizacao">
                            <span>1</span>
                            <div>
                                <strong>Localize o pedido</strong>
                                <p>Utilize o ID da solicitação que precisa ser analisada pela administração.</p>
                            </div>
                        </div>

                        <div className="info-autorizacao">
                            <span>2</span>
                            <div>
                                <strong>Confirme a autorização ou recusa</strong>
                                <p>O sistema promoverá o usuário a síndico ou registrará a recusa conforme sua escolha.</p>
                            </div>
                        </div>

                        <div className="info-autorizacao">
                            <span>3</span>
                            <div>
                                <strong>Permissão atualizada</strong>
                                <p>Em caso de aprovação, o morador assume o gerenciamento do condomínio indicado.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <footer className="autorizacao-footer">
                    Morada Residências · Gestão condominial simplificada
                </footer>
            </div>
        </main>
    );
}

export default AutorizacaoSindicoPage;
