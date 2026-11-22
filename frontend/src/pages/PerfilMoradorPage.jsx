import React, { useEffect, useState, useRef } from 'react';
import { buscarPerfilUsuario } from '../services/usuarioApi';
import './PerfilMoradorPage.css';

export default function PerfilMoradorPage() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    let ativo = true;

    async function carregarPerfil() {
      setLoading(true);
      setErro('');
      try {
        const dados = await buscarPerfilUsuario();
        if (!ativo) return;

        const fotoSalva = localStorage.getItem(`morada_foto_${dados.id}`);
        const usuarioCompleto = {
          ...dados,
          fotoUrl: fotoSalva || dados.fotoUrl || null
        };

        setUsuario(usuarioCompleto);
        localStorage.setItem('morada_usuario', JSON.stringify(usuarioCompleto));
      } catch (err) {
        if (!ativo) return;
        console.error('Erro ao buscar perfil do usuário:', err);

        // Fallback para cache local se disponível
        const usuarioSalvo = localStorage.getItem('morada_usuario');
        if (usuarioSalvo) {
          try {
            setUsuario(JSON.parse(usuarioSalvo));
          } catch {
            setErro(err.message || 'Erro ao carregar dados do perfil.');
          }
        } else {
          setErro(err.message || 'Erro ao carregar dados do perfil.');
        }
      } finally {
        if (ativo) {
          setLoading(false);
        }
      }
    }

    carregarPerfil();

    return () => {
      ativo = false;
    };
  }, []);

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Foto = reader.result;
        setUsuario((prevUsuario) => {
          const usuarioAtualizado = { ...prevUsuario, fotoUrl: base64Foto };
          if (prevUsuario?.id) {
            localStorage.setItem(`morada_foto_${prevUsuario.id}`, base64Foto);
          }
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

  if (loading) {
    return (
      <div className="perfil-container">
        <p>Carregando perfil...</p>
      </div>
    );
  }

  const statusCadastro = usuario?.status_cadastro || usuario?.status;
  const isPendente = statusCadastro === 'PENDENTE_APROVACAO' || statusCadastro === 'PENDENTE' || statusCadastro === 'AGUARDANDO_EMAIL';
  const isAprovado = statusCadastro === 'APROVADO';

  return (
    <div className="perfil-container">
      <div className="perfil-header">
        <h2>Meu Perfil</h2>
      </div>

      {erro && (
        <div className="status-alerta" style={{ backgroundColor: '#fff0ef', color: '#a33f3a', border: '1px solid #f0cfcc', marginBottom: '20px' }}>
          <strong>Atenção:</strong> {erro}
        </div>
      )}

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
            <span>{usuario?.nome || 'Não informado'}</span>
          </div>

          <div className="info-group">
            <span className="info-label">E-mail:</span>
            <span>{usuario?.email || 'Não informado'}</span>
          </div>

          {usuario?.condominio_nome && (
            <div className="info-group">
              <span className="info-label">Condomínio:</span>
              <span>{usuario.condominio_nome}</span>
            </div>
          )}

          <div className="info-group">
            <span className="info-label">Unidade:</span>
            <span>
              {usuario?.bloco_nome || usuario?.bloco
                ? `${usuario.bloco_nome || usuario.bloco} - Unidade ${usuario?.unidade || 'N/A'}`
                : (usuario?.unidade || 'Não informada')}
            </span>
          </div>

          <div className="info-group">
            <span className="info-label">Perfil:</span>
            <span style={{ fontWeight: 600, color: '#315b43' }}>{usuario?.perfil || 'MORADOR'}</span>
          </div>

          <div className="info-group">
            <span className="info-label">Status da Conta:</span>
            <span className={`status-badge ${isPendente ? 'pendente' : (isAprovado ? 'aprovado' : '')}`}>
              {statusCadastro === 'AGUARDANDO_EMAIL' && 'Aguardando Validação de E-mail'}
              {statusCadastro === 'PENDENTE_APROVACAO' && 'Aguardando Aprovação do Síndico'}
              {statusCadastro === 'APROVADO' && 'Aprovado'}
              {statusCadastro === 'REJEITADO' && 'Rejeitado'}
              {!['AGUARDANDO_EMAIL', 'PENDENTE_APROVACAO', 'APROVADO', 'REJEITADO'].includes(statusCadastro) && (statusCadastro || 'Ativo')}
            </span>
          </div>
        </div>
      </div>

      {statusCadastro === 'PENDENTE_APROVACAO' && (
        <div className="status-alerta">
          <strong>Aviso:</strong> O seu e-mail foi validado com sucesso! A sua conta agora está aguardando aprovação final do síndico.
        </div>
      )}

      {statusCadastro === 'AGUARDANDO_EMAIL' && (
        <div className="status-alerta" style={{ backgroundColor: '#fff3cd', color: '#856404', border: '1px solid #ffeeba' }}>
          <strong>Aviso:</strong> Seu cadastro ainda precisa da confirmação do código enviado para o seu e-mail.
        </div>
      )}
    </div>
  );
}
