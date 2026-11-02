import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Páginas onde a Navbar DEVE ficar oculta (Home pública, Login, Cadastros)
  const paginasSemNavbar = [
    '/',
    '/login',
    '/cadastro',
    '/cadastro-morador',
    '/morador/cadastro'
  ];

  // Se a rota atual estiver na lista acima, não renderiza a Navbar
  if (paginasSemNavbar.includes(location.pathname)) {
    return null;
  }

  // Recupera o condomínio ativo do localStorage
  const condoSalvo = localStorage.getItem('morada_condominio_ativo');
  const condominioAtivo = condoSalvo ? JSON.parse(condoSalvo) : null;

  return (
    <header className="app-navbar">
      <div className="navbar-left">
        <h1 className="navbar-logo" onClick={() => navigate('/condominios')}>
          🏢 Morada
        </h1>
        {condominioAtivo && (
          <div className="condo-badge">
            <span className="condo-icon">📍</span>
            <span className="condo-name">{condominioAtivo.nome}</span>
            <button 
              className="btn-trocar-condo" 
              onClick={() => navigate('/condominios')}
              title="Trocar condomínio selecionado"
            >
              Trocar
            </button>
          </div>
        )}
      </div>

      <nav className="navbar-links">
        <button 
          className={`nav-item ${location.pathname === '/condominios' ? 'active' : ''}`}
          onClick={() => navigate('/condominios')}
        >
          Meus Condomínios
        </button>
        <button 
          className={`nav-item ${location.pathname === '/notificacoes' ? 'active' : ''}`}
          onClick={() => navigate('/notificacoes')}
        >
          Mural / Avisos
        </button>
        <button 
          className={`nav-item ${location.pathname === '/painel-sindico' ? 'active' : ''}`}
          onClick={() => navigate('/painel-sindico')}
        >
          Painel Síndico
        </button>
        <button 
          className={`nav-item ${location.pathname === '/perfil' ? 'active' : ''}`}
          onClick={() => navigate('/perfil')}
        >
          Meu Perfil
        </button>
        <button
          className={`nav-item ${location.pathname === '/reunioes' ? 'active' : ''}`}
          onClick={() => navigate('/reunioes')}
        >
          Reuniões
        </button>
        <button
          className={`nav-item ${location.pathname === '/reservas-churrasqueira' ? 'active' : ''}`}
          onClick={() => navigate('/reservas-churrasqueira')}
        >
          Churrasqueira
        </button>
      </nav>
    </header>
  );
}