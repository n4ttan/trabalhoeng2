import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
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

      // Condomínio ativo de outra sessão não vale para este login: escolher de novo.
      localStorage.removeItem('morada_condominio_ativo');
      navigate('/condominios');
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
            <div className="senha-campo">
              <input
                id="senha"
                type={mostrarSenha ? 'text' : 'password'}
                placeholder="Digite sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn-olho"
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={mostrarSenha}
                onClick={() => setMostrarSenha(!mostrarSenha)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {mostrarSenha ? (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                      <path d="M1 1l22 22" />
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
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