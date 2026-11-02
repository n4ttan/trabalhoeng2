import React, { useEffect, useState, useRef } from 'react';
import './PerfilMoradorPage.css';

export default function PerfilMoradorPage() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('morada_usuario');
    
    if (usuarioSalvo) {
      try {
        setUsuario(JSON.parse(usuarioSalvo));
      } catch {
        setUsuario(null);
      }
    } else {
      setUsuario({
        nome: 'Morador Registado',
        email: 'morador@condominio.com',
        unidade: 'Bloco A - Ap 101',
        status: 'APROVADO',
        fotoUrl: null
      });
    }
    setLoading(false);
  }, []);

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Foto = reader.result;
        setUsuario((prevUsuario) => {
          const usuarioAtualizado = { ...prevUsuario, fotoUrl: base64Foto };
          localStorage.setItem('morada_usuario', JSON.stringify(usuarioAtualizado));
          return usuarioAtualizado;
        });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleAbrirSeletor = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (loading) return <div className="perfil-container"><p>A carregar perfil...</p></div>;

  const isPendente = usuario?.status === 'PENDENTE_APROVACAO' || usuario?.status === 'PENDENTE';

  return (
    <div className="perfil-container">
      <div className="perfil-header">
        <h2>Meu Perfil</h2>
      </div>

      <div className="perfil-card">
        {/* Seção da Foto de Perfil */}
        <div className="perfil-avatar-section">
          <div className="avatar-wrapper">
            {usuario?.fotoUrl ? (
              <img src={usuario.fotoUrl} alt="Foto de Perfil" className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">👤</div>
            )}
          </div>

          <input 
            type="file" 
            ref={fileInputRef}
            accept="image/*" 
            onChange={handleFotoChange} 
            style={{ display: 'none' }} 
          />

          <button 
            type="button" 
            className="btn-alterar-foto-texto" 
            onClick={handleAbrirSeletor}
          >
            Alterar foto
          </button>
        </div>

        {/* Informações do Morador */}
        <div className="perfil-info">
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
      </div>

      {isPendente && (
        <div className="status-alerta">
          <strong>Aviso:</strong> O seu e-mail foi validado com sucesso! A sua conta agora está a aguardar aprovação final do síndico.
        </div>
      )}
    </div>
  );
}