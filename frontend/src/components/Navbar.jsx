import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { obterPerfil } from '../services/authApi';
import './Navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [condominioAtivo, setCondominioAtivo] = useState(null);
  const perfil = obterPerfil();
  const ehSindico = perfil === 'SINDICO' || perfil === 'ADMIN';
  const ehMorador = perfil === 'MORADOR' || perfil === 'ADMIN';

  // Páginas onde a Navbar fica oculta
  const paginasSemNavbar = [
    '/',
    '/login',
    '/cadastro',
    '/cadastro-morador',
    '/morador/cadastro'
  ];

  useEffect(() => {
    const condoSalvo = localStorage.getItem('morada_condominio_ativo');
    if (condoSalvo) {
      try {
        setCondominioAtivo(JSON.parse(condoSalvo));
      } catch (e) {
        setCondominioAtivo(null);
      }
    } else {
      setCondominioAtivo(null);
    }
  }, [location.pathname]);

  if (paginasSemNavbar.includes(location.pathname)) {
    return null;
  }

  const estaNoPerfil = location.pathname === '/perfil';
  const estaNaListaDeCondominios = location.pathname === '/condominios';

  // Exibe as funcionalidades internas do condomínio apenas se:
  // 1. Tiver um condomínio ativo
  // 2. Não estiver na lista de seleção (/condominios)
  // 3. Não estiver no perfil (/perfil)
  const exibirBotoesInternos = condominioAtivo && !estaNaListaDeCondominios && !estaNoPerfil;

  // O botão 'Meus Condomínios' só aparece na lista de seleção ou na tela de Perfil
  const exibirBotaoMeusCondominios = estaNaListaDeCondominios || estaNoPerfil;

  const handleTrocarCondominio = () => {
    localStorage.removeItem('morada_condominio_ativo');
    setCondominioAtivo(null);
    navigate('/condominios');
  };

  return (
    <header className="app-navbar">
      <div className="navbar-left">
        <h1 className="navbar-logo" onClick={() => navigate('/condominios')}>
          🏢 Morada
        </h1>
        {exibirBotoesInternos && (
          <div className="condo-badge">
            <span className="condo-icon">📍</span>
            <span className="condo-name">{condominioAtivo.nome}</span>
            <button 
              className="btn-trocar-condo" 
              onClick={handleTrocarCondominio}
              title="Trocar condomínio selecionado"
            >
              Trocar
            </button>
          </div>
        )}
      </div>

      <nav className="navbar-links">
        {/* Só exibe 'Meus Condomínios' se estiver na tela de Seleção ou no Perfil */}
        {exibirBotaoMeusCondominios && (
          <button 
            className={`nav-item ${estaNaListaDeCondominios || estaNoPerfil ? 'active' : ''}`}
            onClick={() => navigate('/condominios')}
          >
            Meus Condomínios
          </button>
        )}

        {/* Exibe as abas internas do condomínio quando estiver navegando no condomínio */}
        {exibirBotoesInternos && (
          <>
            <button 
              className={`nav-item ${location.pathname === '/notificacoes' ? 'active' : ''}`}
              onClick={() => navigate('/notificacoes')}
            >
              Mural / Avisos
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
            {ehMorador && (
            <button
              className={`nav-item ${location.pathname === '/meus-boletos' ? 'active' : ''}`}
              onClick={() => navigate('/meus-boletos')}
            >
              Meus Boletos
            </button>
            )}
            {ehSindico && (
            <button
              className={`nav-item ${location.pathname === '/gestao-boletos' ? 'active' : ''}`}
              onClick={() => navigate('/gestao-boletos')}
            >
              Boletos
            </button>
            )}
            {ehSindico && (
            <button
              className={`nav-item ${location.pathname === '/painel-sindico' ? 'active' : ''}`}
              onClick={() => navigate('/painel-sindico')}
            >
              Painel Síndico
            </button>
            )}
          </>
        )}

        {/* Exibe o atalho do Perfil quando estiver dentro do condomínio ou na seleção */}
        {!estaNoPerfil && (
          <button 
            className={`nav-item ${location.pathname === '/perfil' ? 'active' : ''}`}
            onClick={() => navigate('/perfil')}
          >
            Meu Perfil
          </button>
        )}
      </nav>
    </header>
  );
}