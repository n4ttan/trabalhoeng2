import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarCondominios } from '../services/condominioApi';
import { obterUsuario, obterPerfil } from '../services/authApi';
import './CondominiosPage.css';

export default function CondominiosPage() {
  const [condominios, setCondominios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  const usuario = obterUsuario();
  const perfil = obterPerfil();

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        const dados = await listarCondominios();
        setCondominios(Array.isArray(dados) ? dados : []);
      } catch (err) {
        setErro(err.message || 'Erro ao carregar lista de condomínios.');
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  const podeAcessarCondominio = (condo) => {
    if (perfil === 'ADMIN') return true;
    if (perfil === 'MORADOR') {
      return Number(condo.id) === Number(usuario?.id_condominio);
    }
    if (perfil === 'SINDICO') {
      return (
        Number(condo.id) === Number(usuario?.id_condominio) ||
        Number(condo.sindico_responsavel) === Number(usuario?.id)
      );
    }
    return true;
  };

  const handleSelecionarCondominio = (condo) => {
    if (!podeAcessarCondominio(condo)) {
      setErro(
        `Acesso negado: Você não possui autorização para acessar o condomínio "${condo.nome}". Como síndico, você só pode gerenciar o condomínio ao qual está vinculado.`
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setErro('');
    localStorage.setItem('morada_condominio_ativo', JSON.stringify(condo));
    navigate('/notificacoes');
  };

  if (loading) return <div className="condominios-container"><p>A carregar condomínios...</p></div>;

  return (
    <div className="condominios-container">
      <div className="acoes-topo">
        <button className="btn-voltar-home" onClick={() => navigate('/')}>
          ← Voltar para a Home
        </button>
      </div>

      <div className="condominios-header">
        <h2>Selecione o Condomínio</h2>
        <p>Escolha o seu condomínio para visualizar os comunicados e recursos de gestão.</p>
      </div>

      {erro && (
        <div className="alerta-erro" role="alert">
          <span className="alerta-icone">⚠️</span>
          <span>{erro}</span>
        </div>
      )}

      <div className="grid-condominios">
        {condominios.length === 0 ? (
          <p className="sem-registos">Nenhum condomínio registado no sistema.</p>
        ) : (
          condominios.map((condo) => {
            const autorizado = podeAcessarCondominio(condo);

            return (
              <div 
                key={condo.id} 
                className={`card-condominio ${!autorizado ? 'card-bloqueado' : ''}`}
              >
                <div className="card-condo-header">
                  <span className="card-icon">{autorizado ? '🏢' : '🔒'}</span>
                  <div>
                    <h3>{condo.nome}</h3>
                    {!autorizado && (
                      <span className="badge-nao-autorizado">Não autorizado</span>
                    )}
                    {autorizado && (perfil === 'SINDICO' || perfil === 'ADMIN') && (
                      <span className="badge-gestao-autorizada">Seu Condomínio</span>
                    )}
                  </div>
                </div>

                <div className="card-condo-body">
                  <p><strong>Número de Moradores:</strong> {condo.numero_moradores ?? 0}</p>
                  {condo.sindico_nome && (
                    <p><strong>Síndico Responsável:</strong> {condo.sindico_nome}</p>
                  )}
                  {!autorizado && (
                    <p className="texto-aviso-bloqueio">
                      Você não é o síndico gestor desta unidade.
                    </p>
                  )}
                </div>

                <button 
                  type="button"
                  className={`btn-acessar-condo ${!autorizado ? 'btn-bloqueado' : ''}`}
                  onClick={() => handleSelecionarCondominio(condo)}
                  title={!autorizado ? 'Acesso negado para o seu perfil' : 'Acessar Condomínio'}
                >
                  {autorizado ? 'Acessar Condomínio →' : '🚫 Acesso Não Permitido'}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
