import React, { useEffect, useState } from 'react';
import './PerfilMoradorPage.css';

export default function PerfilMoradorPage() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tenta recuperar dados do utilizador armazenados no localStorage após o login
    const usuarioSalvo = localStorage.getItem('morada_usuario');
    
    if (usuarioSalvo) {
      try {
        setUsuario(JSON.parse(usuarioSalvo));
      } catch {
        setUsuario(null);
      }
    } else {
      // Caso não haja utilizador na sessão, exibe dados padrão para visualização da tela
      setUsuario({
        nome: 'Morador Registado',
        email: 'morador@condominio.com',
        unidade: 'Bloco A - Ap 101',
        status: 'APROVADO'
      });
    }
    setLoading(false);
  }, []);

  if (loading) return <div className="perfil-container"><p>A carregar perfil...</p></div>;

  const isPendente = usuario?.status === 'PENDENTE_APROVACAO' || usuario?.status === 'PENDENTE';

  return (
    <div className="perfil-container">
      <div className="perfil-header">
        <h2>Meu Perfil</h2>
      </div>

      <div className="perfil-card">
        <div className="info-group">
          <span className="info-label">Nome:</span>
          <span>{usuario?.nome}</span>
        </div>

        <div className="info-group">
          <span className="info-label">E-mail:</span>
          <span>{usuario?.email}</span>
        </div>

        <div className="info-group">
          <span className="info-label">Unidade:</span>
          <span>{usuario?.unidade || 'Não informada'}</span>
        </div>

        <div className="info-group">
          <span className="info-label">Status da Conta:</span>
          <span className={`status-badge ${isPendente ? 'pendente' : 'aprovado'}`}>
            {isPendente ? 'Aguardando Aprovação' : 'Aprovado'}
          </span>
        </div>
      </div>

      {isPendente && (
        <div className="status-alerta">
          <strong>Aviso:</strong> O seu e-mail foi validado com sucesso! A sua conta agora está a aguardar aprovação final do síndico.
        </div>
      )}
    </div>
  );
}