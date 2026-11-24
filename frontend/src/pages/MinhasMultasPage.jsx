import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarMinhasMultas } from '../services/multaApi';
import './MultasPage.css';

const brl = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dataBR = (iso) => String(iso).slice(0, 10).split('-').reverse().join('/');

export default function MinhasMultasPage() {
  const navigate = useNavigate();
  const condoSalvo = localStorage.getItem('morada_condominio_ativo');
  const condominio = condoSalvo ? JSON.parse(condoSalvo) : null;

  const [multas, setMultas] = useState([]);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!condominio) {
      navigate('/condominios');
      return;
    }
    listarMinhasMultas(condominio.id)
      .then((d) => setMultas(Array.isArray(d) ? d : []))
      .catch((err) => setErro(err.message || 'Não foi possível carregar suas multas.'))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <div className="multas-page">
      <h2>Minhas multas</h2>
      {erro && <p className="multas-erro" role="alert">{erro}</p>}
      {carregando && <p>Carregando...</p>}
      {!carregando && !erro && multas.length === 0 && <p>Você não possui multas.</p>}

      {multas.map((m) => (
        <div className="multa-card" key={m.id}>
          <div>
            <strong>{brl(m.valor)}</strong> em {dataBR(m.data_multa)}
            <div>{m.motivo}</div>
          </div>
          <span className={`multa-status ${m.status.toLowerCase()}`}>{m.status}</span>
        </div>
      ))}
    </div>
  );
}
