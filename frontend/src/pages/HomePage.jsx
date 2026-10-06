import { Link } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
    return (
        <main className="home">

            <header className="home-header">

                <div className="home-logo">
                    <div className="home-logo-icon">
                        🏠
                    </div>

                    <div>
                        <strong>Morada</strong>
                        <span>Residências</span>
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
                            to="/morador/cadastro"
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

                    <div className="hero-card hero-card-main">

                        <div className="hero-card-top">
                            <span>Morada</span>

                            <span className="hero-status">
                                ● Ativo
                            </span>
                        </div>

                        <div className="hero-house">
                            🏢
                        </div>

                        <h3>
                            Sua residência,
                            <br />
                            conectada.
                        </h3>

                        <p>
                            Acompanhe tudo de forma simples.
                        </p>

                    </div>

                    <div className="floating-card floating-card-top">
                        <span className="floating-icon">
                            ✓
                        </span>

                        <div>
                            <strong>
                                Acesso seguro
                            </strong>

                            <small>
                                Seu cadastro protegido
                            </small>
                        </div>
                    </div>

                    <div className="floating-card floating-card-bottom">
                        <span className="floating-icon">
                            👤
                        </span>

                        <div>
                            <strong>
                                Moradores
                            </strong>

                            <small>
                                Administração simplificada
                            </small>
                        </div>
                    </div>

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