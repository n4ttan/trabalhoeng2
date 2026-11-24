import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { obterPerfil, obterUsuario, logout, estaLogado } from '../services/authApi';
import './Navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [aberto, setAberto] = useState(false);
  const [condominioAtivo, setCondominioAtivo] = useState(null);
  const [usuario, setUsuario] = useState(null);

  const perfil = obterPerfil();
  const logado = estaLogado();

  const ehAdmin = perfil === 'ADMIN';
  const ehSindico = perfil === 'SINDICO' || ehAdmin;
  const ehMorador = perfil === 'MORADOR' || ehAdmin;

  // Páginas públicas onde a navegação não deve aparecer
  const paginasSemNavbar = [
    '/',
    '/login',
    '/cadastro',
    '/cadastro-morador',
    '/morador/cadastro'
  ];

  useEffect(() => {
    // Carrega condomínio ativo
    const condoSalvo = localStorage.getItem('morada_condominio_ativo');
    if (condoSalvo) {
      try {
        setCondominioAtivo(JSON.parse(condoSalvo));
      } catch {
        setCondominioAtivo(null);
      }
    } else {
      setCondominioAtivo(null);
    }

    // Carrega dados do usuário
    const usuarioSalvo = obterUsuario();
    if (usuarioSalvo) {
      setUsuario(usuarioSalvo);
    }

    // Fecha a sidebar ao mudar de página
    setAberto(false);
  }, [location.pathname]);

  if (!logado || paginasSemNavbar.includes(location.pathname)) {
    return null;
  }

  const handleNavegar = (caminho) => {
    navigate(caminho);
    setAberto(false);
  };

  const handleTrocarCondominio = () => {
    localStorage.removeItem('morada_condominio_ativo');
    setCondominioAtivo(null);
    navigate('/condominios');
    setAberto(false);
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem('morada_condominio_ativo');
    navigate('/login');
    setAberto(false);
  };

  const isRotaAtiva = (caminho) => location.pathname === caminho;

  return (
    <>
      {/* Barra Superior Fixa (Topbar) */}
      <header className="app-topbar">
        <div className="topbar-left">
          <button 
            type="button"
            className="btn-hamburguer"
            onClick={() => setAberto(!aberto)}
            title="Abrir/Fechar menu lateral"
            aria-label="Abrir menu lateral"
          >
            <span className="hamburguer-icon">{aberto ? '✕' : '☰'}</span>
            <span className="hamburguer-label">Menu</span>
          </button>

          <div className="topbar-logo" onClick={() => handleNavegar('/condominios')}>
            <span className="logo-icon">🏢</span>
            <span className="logo-texto">Morada</span>
            <small className="logo-sub">Residências</small>
          </div>
        </div>

        <div className="topbar-center">
          {condominioAtivo ? (
            <div className="topbar-condo-badge" title="Condomínio selecionado">
              <span className="badge-pin">📍</span>
              <span className="badge-nome">{condominioAtivo.nome}</span>
              <button 
                type="button"
                className="btn-badge-trocar" 
                onClick={handleTrocarCondominio}
                title="Trocar condomínio"
              >
                Trocar
              </button>
            </div>
          ) : (
            <button 
              type="button" 
              className="topbar-condo-badge alerta-selecao"
              onClick={() => handleNavegar('/condominios')}
            >
              ⚠️ Selecione um Condomínio
            </button>
          )}
        </div>

        <div className="topbar-right">
          <div className="usuario-badge" onClick={() => handleNavegar('/perfil')} title="Ver meu perfil">
            <span className="usuario-avatar-circulo">
              {usuario?.nome ? usuario.nome.charAt(0).toUpperCase() : '👤'}
            </span>
            <div className="usuario-detalhes-header">
              <span className="usuario-nome-header">{usuario?.nome?.split(' ')[0] || 'Usuário'}</span>
              <span className={`usuario-perfil-tag tag-${perfil?.toLowerCase()}`}>{perfil || 'MORADOR'}</span>
            </div>
          </div>

          <button 
            type="button"
            className="btn-topbar-logout"
            onClick={handleLogout}
            title="Sair da conta"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Fundo escuro semi-transparente ao abrir menu */}
      {aberto && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setAberto(false)}
          title="Clique para fechar"
        />
      )}

      {/* Barra Lateral Retrátil (Sidebar) */}
      <aside className={`sidebar-lateral ${aberto ? 'aberto' : 'fechado'}`}>
        <div className="sidebar-cabecalho">
          <div className="sidebar-marca">
            <span className="sidebar-marca-icon">🏢</span>
            <div>
              <h2 className="sidebar-marca-titulo">Morada</h2>
              <span className="sidebar-marca-sub">Gestão Condominial</span>
            </div>
          </div>
          <button 
            type="button"
            className="btn-fechar-sidebar"
            onClick={() => setAberto(false)}
            aria-label="Fechar menu lateral"
          >
            ✕
          </button>
        </div>

        {/* Card do condomínio atual na barra */}
        <div className="sidebar-condo-card">
          <span className="sidebar-condo-rotulo">Condomínio Atual</span>
          {condominioAtivo ? (
            <div className="sidebar-condo-info">
              <strong>{condominioAtivo.nome}</strong>
              <button 
                type="button" 
                className="btn-sidebar-trocar"
                onClick={handleTrocarCondominio}
              >
                Alternar Condomínio
              </button>
            </div>
          ) : (
            <button 
              type="button" 
              className="btn-sidebar-selecionar"
              onClick={() => handleNavegar('/condominios')}
            >
              Escolher Condomínio
            </button>
          )}
        </div>

        {/* Lista de Navegação por Sessões Constantes */}
        <nav className="sidebar-menu">
          {/* Seção Geral */}
          <div className="sidebar-secao">
            <span className="sidebar-secao-titulo">GERAL</span>
            
            <button 
              type="button"
              className={`sidebar-item ${isRotaAtiva('/condominios') ? 'ativo' : ''}`}
              onClick={() => handleNavegar('/condominios')}
            >
              <span className="item-icon">🏢</span>
              <span>Meus Condomínios</span>
            </button>

            <button 
              type="button"
              className={`sidebar-item ${isRotaAtiva('/notificacoes') ? 'ativo' : ''}`}
              onClick={() => handleNavegar('/notificacoes')}
            >
              <span className="item-icon">📢</span>
              <span>Mural de Avisos</span>
            </button>

            <button 
              type="button"
              className={`sidebar-item ${isRotaAtiva('/perfil') ? 'ativo' : ''}`}
              onClick={() => handleNavegar('/perfil')}
            >
              <span className="item-icon">👤</span>
              <span>Meu Perfil</span>
            </button>
          </div>

          {/* Seção Áreas Comuns & Eventos */}
          <div className="sidebar-secao">
            <span className="sidebar-secao-titulo">ÁREAS & EVENTOS</span>

            <button 
              type="button"
              className={`sidebar-item ${isRotaAtiva('/reunioes') ? 'ativo' : ''}`}
              onClick={() => handleNavegar('/reunioes')}
            >
              <span className="item-icon">📅</span>
              <span>Reuniões</span>
            </button>

            <button
              type="button"
              className={`sidebar-item ${isRotaAtiva('/ocorrencias') ? 'ativo' : ''}`}
              onClick={() => handleNavegar('/ocorrencias')}
            >
              <span className="item-icon">📢</span>
              <span>Ocorrências</span>
            </button>

            <button 
              type="button"
              className={`sidebar-item ${isRotaAtiva('/reservas-salao') ? 'ativo' : ''}`}
              onClick={() => handleNavegar('/reservas-salao')}
            >
              <span className="item-icon">🎉</span>
              <span>Salão de Festas</span>
            </button>

            <button 
              type="button"
              className={`sidebar-item ${isRotaAtiva('/reservas-churrasqueira') ? 'ativo' : ''}`}
              onClick={() => handleNavegar('/reservas-churrasqueira')}
            >
              <span className="item-icon">🍖</span>
              <span>Churrasqueira</span>
            </button>
          </div>

          {/* Seção Financeira */}
          <div className="sidebar-secao">
            <span className="sidebar-secao-titulo">FINANCEIRO</span>

            {ehMorador && (
              <button 
                type="button"
                className={`sidebar-item ${isRotaAtiva('/meus-boletos') ? 'ativo' : ''}`}
                onClick={() => handleNavegar('/meus-boletos')}
              >
                <span className="item-icon">📄</span>
                <span>Meus Boletos</span>
              </button>
            )}

            {ehMorador && (
              <button
                type="button"
                className={`sidebar-item ${isRotaAtiva('/minhas-multas') ? 'ativo' : ''}`}
                onClick={() => handleNavegar('/minhas-multas')}
              >
                <span className="item-icon">⚠️</span>
                <span>Minhas Multas</span>
              </button>
            )}

            {ehSindico && (
              <button
                type="button"
                className={`sidebar-item ${isRotaAtiva('/gestao-multas') ? 'ativo' : ''}`}
                onClick={() => handleNavegar('/gestao-multas')}
              >
                <span className="item-icon">⚠️</span>
                <span>Multas</span>
              </button>
            )}

            {ehSindico && (
              <button
                type="button"
                className={`sidebar-item ${isRotaAtiva('/gestao-boletos') ? 'ativo' : ''}`}
                onClick={() => handleNavegar('/gestao-boletos')}
              >
                <span className="item-icon">🧾</span>
                <span>Gestão de Boletos</span>
              </button>
            )}

            {ehSindico && (
              <button 
                type="button"
                className={`sidebar-item ${isRotaAtiva('/painel-financeiro') ? 'ativo' : ''}`}
                onClick={() => handleNavegar('/painel-financeiro')}
              >
                <span className="item-icon">📊</span>
                <span>Painel Financeiro</span>
              </button>
            )}

            {ehSindico && (
              <button
                type="button"
                className={`sidebar-item ${isRotaAtiva('/relatorios') ? 'ativo' : ''}`}
                onClick={() => handleNavegar('/relatorios')}
              >
                <span className="item-icon">📈</span>
                <span>Relatórios</span>
              </button>
            )}
          </div>

          {/* Seção Gestão e Síndico */}
          {ehSindico && (
            <div className="sidebar-secao">
              <span className="sidebar-secao-titulo">GESTÃO DO CONDOMÍNIO</span>

              <button 
                type="button"
                className={`sidebar-item ${isRotaAtiva('/moradores') ? 'ativo' : ''}`}
                onClick={() => handleNavegar('/moradores')}
              >
                <span className="item-icon">👥</span>
                <span>Moradores & Blocos</span>
              </button>

              <button 
                type="button"
                className={`sidebar-item ${isRotaAtiva('/painel-sindico') ? 'ativo' : ''}`}
                onClick={() => handleNavegar('/painel-sindico')}
              >
                <span className="item-icon">🛡️</span>
                <span>Painel do Síndico</span>
              </button>
            </div>
          )}

          {/* Seção Exclusiva de Administração Global */}
          {ehAdmin && (
            <div className="sidebar-secao">
              <span className="sidebar-secao-titulo">ADMINISTRAÇÃO GERAL</span>

              <button 
                type="button"
                className={`sidebar-item ${isRotaAtiva('/gerenciamento') ? 'ativo' : ''}`}
                onClick={() => handleNavegar('/gerenciamento')}
              >
                <span className="item-icon">🔑</span>
                <span>Atribuir Gerenciamento</span>
              </button>

              <button 
                type="button"
                className={`sidebar-item ${isRotaAtiva('/autorizacao-sindico') ? 'ativo' : ''}`}
                onClick={() => handleNavegar('/autorizacao-sindico')}
              >
                <span className="item-icon">✍️</span>
                <span>Autorizar Síndicos</span>
              </button>
            </div>
          )}

          {/* Candidatura (visível apenas para Morador que não é Síndico nem Admin) */}
          {!ehSindico && (
            <div className="sidebar-secao">
              <span className="sidebar-secao-titulo">OPORTUNIDADES</span>
              <button 
                type="button"
                className={`sidebar-item ${isRotaAtiva('/permissao-sindico') ? 'ativo' : ''}`}
                onClick={() => handleNavegar('/permissao-sindico')}
              >
                <span className="item-icon">📝</span>
                <span>Candidatar a Síndico</span>
              </button>
            </div>
          )}
        </nav>

        {/* Rodapé da Sidebar */}
        <div className="sidebar-rodape">
          <div className="sidebar-usuario-info">
            <span className="sidebar-avatar">
              {usuario?.nome ? usuario.nome.charAt(0).toUpperCase() : '👤'}
            </span>
            <div className="sidebar-usuario-textos">
              <span className="sidebar-usuario-nome">{usuario?.nome || 'Usuário Conectado'}</span>
              <span className="sidebar-usuario-email">{usuario?.email || 'morador@morada.com'}</span>
            </div>
          </div>

          <button 
            type="button"
            className="btn-sidebar-sair"
            onClick={handleLogout}
          >
            Encerrar Sessão
          </button>
        </div>
      </aside>
    </>
  );
}
