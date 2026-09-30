import { useEffect, useState } from 'react';
import './CadastroMoradorValidacaoPage.css';

import {
    cadastrarMorador,
    validarEmail,
    reenviarCodigo
} from '../services/moradorApi';

function CadastroMoradorValidacaoPage() {
    const [etapa, setEtapa] = useState('cadastro');

    const [form, setForm] = useState({
        nome: '',
        email: '',
        unidade: '',
        senha: '',
        confirmarSenha: ''
    });

    const [codigo, setCodigo] = useState('');
    const [erro, setErro] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [carregando, setCarregando] = useState(false);

    // true depois de 5 tentativas incorretas; só um novo código libera a validação.
    const [bloqueado, setBloqueado] = useState(false);

    // Segundos restantes até o botão de reenvio ser liberado de novo.
    const [espera, setEspera] = useState(0);

    useEffect(() => {
        if (espera <= 0) {
            return undefined;
        }

        const temporizador = setTimeout(() => {
            setEspera((restante) => restante - 1);
        }, 1000);

        return () => clearTimeout(temporizador);
    }, [espera]);

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((anterior) => ({
            ...anterior,
            [name]: value
        }));
    }

    function limparMensagens() {
        setErro('');
        setMensagem('');
    }

    async function handleCadastro(event) {
        event.preventDefault();

        limparMensagens();

        if (
            !form.nome.trim() ||
            !form.email.trim() ||
            !form.unidade.trim() ||
            !form.senha ||
            !form.confirmarSenha
        ) {
            setErro('Preencha todos os campos.');
            return;
        }

        if (form.senha.length < 6) {
            setErro('A senha deve possuir pelo menos 6 caracteres.');
            return;
        }

        if (form.senha !== form.confirmarSenha) {
            setErro('As senhas não coincidem.');
            return;
        }

        try {
            setCarregando(true);

            const data = await cadastrarMorador(
                form.nome.trim(),
                form.email.trim(),
                form.senha,
                form.unidade.trim()
            );

            setMensagem(
                data.mensagem ||
                    'Cadastro realizado. Verifique seu e-mail.'
            );

            setBloqueado(false);
            setEspera(60);
            setEtapa('validacao');
        } catch (error) {
            setErro(error.message);
        } finally {
            setCarregando(false);
        }
    }

    function handleCodigo(event) {
        const valor = event.target.value
            .replace(/\D/g, '')
            .slice(0, 6);

        setCodigo(valor);
    }

    async function handleValidacao(event) {
        event.preventDefault();

        limparMensagens();

        if (codigo.length !== 6) {
            setErro('Informe o código de 6 dígitos.');
            return;
        }

        try {
            setCarregando(true);

            const data = await validarEmail(
                form.email.trim(),
                codigo
            );

            setMensagem(
                data.mensagem ||
                    'E-mail validado com sucesso.'
            );

            setEtapa('sucesso');
        } catch (error) {
            if (error.codigo === 'CODIGO_BLOQUEADO') {
                setBloqueado(true);
                setCodigo('');
                setErro(
                    'Muitas tentativas incorretas. Solicite um novo código.'
                );
            } else {
                setErro(error.message);
            }
        } finally {
            setCarregando(false);
        }
    }

    async function handleReenviar() {
        limparMensagens();

        try {
            setCarregando(true);

            const data = await reenviarCodigo(form.email.trim());

            setBloqueado(false);
            setCodigo('');
            setEspera(60);
            setMensagem(
                data.mensagem ||
                    'Enviamos um novo código para o seu e-mail.'
            );
        } catch (error) {
            setErro(error.message);
        } finally {
            setCarregando(false);
        }
    }

    function voltarCadastro() {
        setEtapa('cadastro');
        setCodigo('');
        setBloqueado(false);
        setEspera(0);
        limparMensagens();
    }

    return (
        <main className="morador-validacao">
            <section className="card-cadastro">

                {etapa === 'cadastro' && (
                    <>
                        <header className="cabecalho">
                            <div className="icone-principal">
                                🏢
                            </div>

                            <span className="nome-sistema">
                                Sistema do Condomínio
                            </span>

                            <h1>Cadastro de morador</h1>

                            <p>
                                Preencha seus dados para solicitar
                                acesso ao sistema do condomínio.
                            </p>
                        </header>

                        <form
                            className="formulario"
                            onSubmit={handleCadastro}
                        >
                            <div className="campo">
                                <label htmlFor="nome">
                                    Nome completo
                                </label>

                                <input
                                    id="nome"
                                    name="nome"
                                    type="text"
                                    placeholder="Digite seu nome completo"
                                    value={form.nome}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="campo">
                                <label htmlFor="email">
                                    E-mail
                                </label>

                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="seuemail@exemplo.com"
                                    value={form.email}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="campo">
                                <label htmlFor="unidade">
                                    Unidade / Apartamento
                                </label>

                                <input
                                    id="unidade"
                                    name="unidade"
                                    type="text"
                                    placeholder="Ex: Bloco A - Apto 101"
                                    value={form.unidade}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="linha-senhas">
                                <div className="campo">
                                    <label htmlFor="senha">
                                        Senha
                                    </label>

                                    <input
                                        id="senha"
                                        name="senha"
                                        type="password"
                                        placeholder="Mínimo 6 caracteres"
                                        value={form.senha}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="campo">
                                    <label htmlFor="confirmarSenha">
                                        Confirmar senha
                                    </label>

                                    <input
                                        id="confirmarSenha"
                                        name="confirmarSenha"
                                        type="password"
                                        placeholder="Digite novamente"
                                        value={form.confirmarSenha}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {erro && (
                                <div className="alerta alerta-erro">
                                    {erro}
                                </div>
                            )}

                            <button
                                className="botao-principal"
                                type="submit"
                                disabled={carregando}
                            >
                                {carregando
                                    ? 'Cadastrando...'
                                    : 'Cadastrar morador'}
                            </button>

                            <p className="aviso-formulario">
                                Após o cadastro, você deverá validar
                                seu e-mail antes da aprovação do síndico.
                            </p>
                        </form>
                    </>
                )}

                {etapa === 'validacao' && (
                    <>
                        <header className="cabecalho">
                            <div className="icone-principal">
                                ✉️
                            </div>

                            <span className="nome-sistema">
                                Validação de e-mail
                            </span>

                            <h1>Confira seu e-mail</h1>

                            <p>
                                Digite o código de 6 dígitos enviado para:
                            </p>

                            <strong className="email-destaque">
                                {form.email}
                            </strong>
                        </header>

                        {mensagem && (
                            <div className="alerta alerta-sucesso">
                                {mensagem}
                            </div>
                        )}

                        <form
                            className="formulario"
                            onSubmit={handleValidacao}
                        >
                            <div className="campo">
                                <label htmlFor="codigo">
                                    Código de validação
                                </label>

                                <input
                                    id="codigo"
                                    className="input-codigo"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    placeholder="000000"
                                    value={codigo}
                                    onChange={handleCodigo}
                                    autoFocus
                                />

                                <span className="ajuda-campo">
                                    O código possui 6 dígitos e
                                    expira em 15 minutos.
                                </span>
                            </div>

                            {erro && (
                                <div className="alerta alerta-erro">
                                    {erro}
                                </div>
                            )}

                            <button
                                className="botao-principal"
                                type="submit"
                                disabled={carregando || bloqueado}
                            >
                                {carregando
                                    ? 'Validando...'
                                    : 'Validar e-mail'}
                            </button>

                            <button
                                className="botao-secundario"
                                type="button"
                                onClick={handleReenviar}
                                disabled={carregando || espera > 0}
                            >
                                {espera > 0
                                    ? `Reenviar em ${espera}s`
                                    : 'Reenviar código'}
                            </button>

                            <button
                                className="botao-secundario"
                                type="button"
                                onClick={voltarCadastro}
                            >
                                Voltar para o cadastro
                            </button>
                        </form>
                    </>
                )}

                {etapa === 'sucesso' && (
                    <div className="tela-sucesso">
                        <div className="icone-sucesso">
                            ✓
                        </div>

                        <span className="nome-sistema">
                            Cadastro realizado
                        </span>

                        <h1>E-mail validado!</h1>

                        <p className="descricao-sucesso">
                            Seu e-mail foi validado com sucesso.
                        </p>

                        <div className="alerta alerta-sucesso">
                            {mensagem}
                        </div>

                        <div className="status-cadastro">
                            <span>Status do cadastro</span>

                            <strong>
                                Pendente de aprovação
                            </strong>
                        </div>

                        <p className="texto-final">
                            Seu cadastro será analisado pelo síndico.
                            Após a aprovação, seu acesso ao sistema
                            poderá ser liberado.
                        </p>
                    </div>
                )}

            </section>
        </main>
    );
}

export default CadastroMoradorValidacaoPage;
