import React from 'react';
import './Footer.css';

export default function Footer() {
  const adminEmail = 'galdinosindico@gmail.com';
  const adminSuporteEmail = 'admin@moradaresidencias.com.br';

  return (
    <footer className="app-footer">
      <div className="footer-container">
        {/* Coluna 1: Sobre o Sistema */}
        <div className="footer-coluna footer-sobre">
          <div className="footer-logo">
            <span className="footer-logo-icon">🏢</span>
            <span className="footer-logo-texto">Morada Residências</span>
          </div>
          <p className="footer-descricao">
            Plataforma integrada de governança e convivência condominial.
            Conectamos moradores, síndicos e administradoras para uma gestão
            transparente, financeira e colaborativa.
          </p>
          <div className="footer-status-pill">
            <span className="status-dot"></span>
            <span>Sistema Operacional • v2.4</span>
          </div>
        </div>

        {/* Coluna 2: Funcionalidades Principais */}
        <div className="footer-coluna">
          <h4 className="footer-titulo">Módulos do Sistema</h4>
          <ul className="footer-links">
            <li><span>• Painel Financeiro & Boletos</span></li>
            <li><span>• Reservas de Espaços Comuns</span></li>
            <li><span>• Mural de Avisos & Notificações</span></li>
            <li><span>• Gestão de Moradores & Blocos</span></li>
            <li><span>• Reuniões & Assembleias Virtuais</span></li>
          </ul>
        </div>

        {/* Coluna 3: Contato e Suporte do Administrador */}
        <div className="footer-coluna footer-contato">
          <h4 className="footer-titulo">Contato da Administração</h4>
          <p className="footer-contato-texto">
            Dúvidas, solicitações de acesso ou suporte técnico? Entre em contato diretamente com o administrador geral da plataforma:
          </p>
          
          <div className="footer-contato-box">
            <div className="contato-item">
              <span className="contato-icone">✉️</span>
              <div className="contato-info">
                <span className="contato-label">E-mail do Administrador:</span>
                <a 
                  href={`mailto:${adminEmail}`} 
                  className="contato-email-link"
                  title="Enviar mensagem para o administrador"
                >
                  {adminEmail}
                </a>
              </div>
            </div>

            <div className="contato-item">
              <span className="contato-icone">🛡️</span>
              <div className="contato-info">
                <span className="contato-label">Canal de Suporte Corporativo:</span>
                <a 
                  href={`mailto:${adminSuporteEmail}`} 
                  className="contato-email-link"
                  title="Suporte da plataforma"
                >
                  {adminSuporteEmail}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Faixa inferior de direitos e termos */}
      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p>© {new Date().getFullYear()} Morada Residências — Todos os direitos reservados.</p>
          <div className="footer-badges">
            <span className="footer-badge">Isolamento Multilocatário Ativo</span>
            <span className="footer-badge">Criptografia Ponta a Ponta</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
