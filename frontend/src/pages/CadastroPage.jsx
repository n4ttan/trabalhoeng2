import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CadastroPage.css';

export default function CadastroPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [unidade, setUnidade] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);

  const navigate = useNavigate();

  const handleCadastro = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    setCarregando(true);

    try {
      const response = await fetch('http://localhost:3000/usuarios/moradores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome,
          email,
          senha,
          unidade
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || data.mensagem || 'Erro ao realizar cadastro.');
      }

      setSucesso('Cadastro realizado com sucesso! Verifique seu e-mail para validar a conta.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="cadastro-wrapper">
      <button className="btn-voltar-topo" onClick={() => navigate('/login')}>
        ← Voltar ao Login
      </button>

      <div className="cadastro-card">
        <div className="cadastro-icon">🏢</div>
        <span className="sistema-tag">SISTEMA DO CONDOMÍNIO</span>

        <h2 className="cadastro-titulo">Cadastro de morador</h2>
        <p className="cadastro-subtitulo">
          Preencha seus dados para solicitar acesso ao sistema do condomínio.
        </p>

        {erro && <div className="alerta-erro">{erro}</div>}
        {sucesso && <div className="alerta-sucesso">{sucesso}</div>}

        <form onSubmit={handleCadastro} className="cadastro-form">
          <div className="form-group">
            <label htmlFor="nome">Nome completo</label>
            <input
              id="nome"
              type="text"
              placeholder="Digite seu nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="unidade">Unidade / Apartamento</label>
            <input
              id="unidade"
              type="text"
              placeholder="Ex: Bloco A - Apto 101"
              value={unidade}
              onChange={(e) => setUnidade(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label htmlFor="senha">Senha</label>
              <input
                id="senha"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>

            <div className="form-group flex-1">
              <label htmlFor="confirmarSenha">Confirmar senha</label>
              <input
                id="confirmarSenha"
                type="password"
                placeholder="Digite novamente"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-cadastrar" disabled={carregando}>
            {carregando ? 'Cadastrando...' : 'Cadastrar morador'}
          </button>
        </form>
      </div>
    </div>
  );
}