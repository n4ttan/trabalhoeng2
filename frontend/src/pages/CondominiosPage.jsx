import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarCondominios } from '../services/condominioApi';
import './CondominiosPage.css';

export default function CondominiosPage() {
  const [condominios, setCondominios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

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

  const handleSelecionarCondominio = (condo) => {
    localStorage.setItem('morada_condominio_ativo', JSON.stringify(condo));
    navigate('/notificacoes');
  };

  if (loading) return <div className="condominios-container"><p>A carregar condomínios...</p></div>;

  return (
    <div className="condominios-container">
      <div className="condominios-header">
        <h2>Selecione o Condomínio</h2>
        <p>Escolha um condomínio para visualizar os avisos e informações.</p>
      </div>

      {erro && <div className="alerta-erro">{erro}</div>}

      <div className="grid-condominios">
        {condominios.length === 0 ? (
          <p>Nenhum condomínio registado no sistema.</p>
        ) : (
          condominios.map((condo) => (
            <div key={condo.id} className="card-condominio">
              <div className="card-condo-header">
                <span className="card-icon">🏢</span>
                <h3>{condo.nome}</h3>
              </div>
              <div className="card-condo-body">
                <p><strong>Número de Moradores:</strong> {condo.numero_moradores ?? 0}</p>
              </div>
              <button 
                className="btn-acessar-condo"
                onClick={() => handleSelecionarCondominio(condo)}
              >
                Acessar Condomínio →
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}