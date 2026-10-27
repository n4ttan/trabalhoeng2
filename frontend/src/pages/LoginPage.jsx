import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || data.mensagem || 'Falha ao autenticar.');
      }

      if (data.token) {
        localStorage.setItem('morada_token', data.token);
      }
      if (data.usuario) {
        localStorage.setItem('morada_usuario', JSON.stringify(data.usuario));
      }

      navigate('/notificacoes');
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="login-wrapper">
      <button className="btn-voltar-topo" onClick={() => navigate(-1)}>
        ← Voltar
      </button>

      <div className="login-card">
        <div className="login-icon">🏢</div>
        <span className="sistema-tag">SISTEMA DO CONDOMÍNIO</span>
        
        <h2 className="login-titulo">Bem-vindo de volta</h2>
        <p className="login-subtitulo">
          Entre na sua conta para acessar o Morada Residências.
        </p>

        {erro && <div className="login-alerta-erro">{erro}</div>}

        <form onSubmit={handleLogin} className="login-form">
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
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-entrar" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="login-footer">
          <span>Ainda não possui uma conta? </span>
          <button 
            type="button" 
            className="btn-link" 
            onClick={() => navigate('/cadastro')}
          >
            Criar minha conta
          </button>
        </div>
      </div>

      <footer className="login-rodape-texto">
        Morada Residências · Gestão condominial simplificada
      </footer>
    </div>
  );
}