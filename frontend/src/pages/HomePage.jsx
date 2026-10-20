import { useState } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
    const [menuAberto, setMenuAberto] = useState(false);

    const fecharMenu = () => setMenuAberto(false);

    return (
        <main className="home">

            <button
                type="button"
                className={`sidebar-toggle ${menuAberto ? 'is-open' : ''}`}
                aria-label={menuAberto ? 'Fechar menu de atalhos' : 'Abrir menu de atalhos'}
                aria-expanded={menuAberto}
                onClick={() => setMenuAberto(!menuAberto)}
            >
                <span></span><span></span><span></span>
            </button>

            {menuAberto && (
                <button
                    type="button"
                    className="sidebar-backdrop"
                    aria-label="Fechar menu"
                    onClick={fecharMenu}
                />
            )}

            <aside className={`quick-sidebar ${menuAberto ? 'is-open' : ''}`} aria-label="Atalhos">
                <div className="sidebar-heading">
                    <div>
                        <span className="sidebar-eyebrow">ACESSO RÁPIDO</span>
                        <strong>Escolha seu perfil</strong>
                    </div>
                    <button type="button" className="sidebar-close" onClick={fecharMenu} aria-label="Fechar menu">×</button>
                </div>

                <nav className="sidebar-links">
                    <Link to="/cadastro-morador" className="sidebar-link" onClick={fecharMenu}>
                        <span className="sidebar-link-icon">⌂</span>
                        <span><strong>Cadastro de morador</strong><small>Cadastro e acesso do morador</small></span>
                        <span className="sidebar-chevron">›</span>
                    </Link>
                    <Link to="/permissao-sindico" className="sidebar-link" onClick={fecharMenu}>
                        <span className="sidebar-link-icon">▣</span>
                        <span><strong>Cadastro de síndico</strong><small>Gestão e responsabilidades</small></span>
                        <span className="sidebar-chevron">›</span>
                    </Link>
                    <Link to="/login" className="sidebar-link" onClick={fecharMenu}>
                        <span className="sidebar-link-icon">⚙</span>
                        <span><strong>Cadastro de administrador</strong><small>Acesso administrativo</small></span>
                        <span className="sidebar-chevron">›</span>
                    </Link>
                    <div className="sidebar-divider" />
                    <button type="button" className="sidebar-link sidebar-exit" onClick={fecharMenu}>
                        <span className="sidebar-link-icon">↪</span>
                        <span><strong>Sair</strong><small>Fechar menu de atalhos</small></span>
                        <span className="sidebar-chevron">›</span>
                    </button>
                </nav>
            </aside>

            <header className="home-header">

                <div className="home-logo">
                    <div className="home-logo-icon">
                        <img src="/morada-logo.png" alt="Logo Morada" />
                    </div>

                    <div>
                        <strong>Morada residências</strong>
                    </div>
                </div>

                <Link
                    to="/login"
                    className="home-login"
                >
                    Entrar
                </Link>

            </header>

            <section className="hero">

                <div className="hero-content">

                    <span className="hero-tag">
                        SISTEMA DO CONDOMÍNIO
                    </span>

                    <h1>
                        Tudo para o seu
                        <strong> condomínio</strong>
                        <br />
                        em um só lugar.
                    </h1>

                    <p>
                        Gerencie seu acesso, acompanhe sua
                        residência e tenha uma experiência
                        mais simples dentro do condomínio.
                    </p>

                    <div className="hero-actions">

                        <Link
                            to="/cadastro-morador"
                            className="btn-primary"
                        >
                            Criar minha conta
                        </Link>

                        <Link
                            to="/login"
                            className="btn-secondary"
                        >
                            Já tenho uma conta
                        </Link>

                    </div>

                </div>

                <div className="hero-visual">
                    <img src="/morada-logo.png" alt="Logo Morada Residencias" />
                </div>

            </section>

            <section className="home-features">

                <div className="feature">

                    <div className="feature-icon">
                        👤
                    </div>

                    <div>
                        <h3>
                            Cadastro simples
                        </h3>

                        <p>
                            Faça seu cadastro e valide seu
                            e-mail rapidamente.
                        </p>
                    </div>

                </div>

                <div className="feature">

                    <div className="feature-icon">
                        ✉
                    </div>

                    <div>
                        <h3>
                            Validação segura
                        </h3>

                        <p>
                            Confirme sua identidade através
                            do código enviado para seu e-mail.
                        </p>
                    </div>

                </div>

                <div className="feature">

                    <div className="feature-icon">
                        🛡
                    </div>

                    <div>
                        <h3>
                            Gestão do condomínio
                        </h3>

                        <p>
                            Síndicos podem acompanhar e
                            administrar os cadastros.
                        </p>
                    </div>

                </div>

            </section>

            <footer className="home-footer">
                <span>
                    © Morada Residências
                </span>

                <span>
                    Sistema de gestão condominial
                </span>
            </footer>

        </main>
    );
}

export default HomePage;