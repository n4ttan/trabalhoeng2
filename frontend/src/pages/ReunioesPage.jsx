import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarReunioesCondominio, criarReuniaoCondominio, deletarReuniaoCondominio } from '../services/reuniaoApi';
import { obterPerfil } from '../services/authApi';
import './ReunioesPage.css';

export default function ReunioesPage() {
  const [reunioes, setReunioes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [exibirForm, setExibirForm] = useState(false);
  const [processando, setProcessando] = useState(false);

  // Form states
  const [titulo, setTitulo] = useState('');
  const [pauta, setPauta] = useState('');
  const [dataHora, setDataHora] = useState('');
  const [localLink, setLocalLink] = useState('');

  const navigate = useNavigate();
  const perfil = obterPerfil();
  const ehSindicoOuAdmin = perfil === 'SINDICO' || perfil === 'ADMIN';

  const condoSalvo = localStorage.getItem('morada_condominio_ativo');
  const condominioAtivo = condoSalvo ? JSON.parse(condoSalvo) : null;

  useEffect(() => {
    if (!condominioAtivo) {
      navigate('/condominios');
      return;
    }
    carregarReunioes();
  }, [condominioAtivo?.id]);

  async function carregarReunioes() {
    try {
      setLoading(true);
      const dados = await listarReunioesCondominio(condominioAtivo.id);
      setReunioes(Array.isArray(dados) ? dados : []);
    } catch (err) {
      setErro(err.message || 'Erro ao carregar reuniões marcadas.');
    } finally {
      setLoading(false);
    }
  }

  const handleCriarReuniao = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    try {
      setProcessando(true);
      await criarReuniaoCondominio(condominioAtivo.id, {
        titulo,
        pauta,
        data_hora: dataHora,
        local_link: localLink
      });
      setSucesso('Reunião agendada com sucesso!');
      setTitulo('');
      setPauta('');
      setDataHora('');
      setLocalLink('');
      setExibirForm(false);
      await carregarReunioes();
    } catch (err) {
      setErro(err.message || 'Erro ao agendar reunião.');
    } finally {
      setProcessando(false);
    }
  };

  const handleCancelarReuniao = async (reuniaoId) => {
    if (!window.confirm('Tem certeza que deseja cancelar esta reunião?')) {
      return;
    }

    setErro('');
    setSucesso('');

    try {
      setProcessando(true);
      await deletarReuniaoCondominio(condominioAtivo.id, reuniaoId);
      setSucesso('Reunião cancelada com sucesso!');
      await carregarReunioes();
    } catch (err) {
      setErro(err.message || 'Erro ao cancelar reunião.');
    } finally {
      setProcessando(false);
    }
  };

  if (!condominioAtivo) return null;

  return (
    <div className="reunioes-container">
      <div className="reunioes-header">
        <div>
          <h2>📅 Reuniões Marcadas — {condominioAtivo.nome}</h2>
          <p>Assembleias e encontros agendados para os moradores.</p>
        </div>
        {ehSindicoOuAdmin && (
          <button 
            className="btn-nova-reuniao" 
            onClick={() => setExibirForm(!exibirForm)}
          >
            {exibirForm ? 'Fechar Formulário' : '+ Agendar Reunião'}
          </button>
        )}
      </div>

      {erro && <div className="alerta-erro">⚠️ {erro}</div>}
      {sucesso && <div className="alerta-sucesso" style={{ backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontWeight: 'bold' }}>✓ {sucesso}</div>}

      {exibirForm && (
        <form className="form-reuniao" onSubmit={handleCriarReuniao}>
          <h3>Agendar Nova Reunião</h3>
          <div className="form-group">
            <label>Título da Reunião / Assembleia</label>
            <input 
              type="text" 
              required 
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Assembleia Geral Ordinária" 
            />
          </div>
          <div className="form-group">
            <label>Data e Hora</label>
            <input 
              type="datetime-local" 
              required 
              value={dataHora}
              onChange={(e) => setDataHora(e.target.value)} 
            />
          </div>
          <div className="form-group">
            <label>Local ou Link de Transmissão</label>
            <input 
              type="text" 
              value={localLink}
              onChange={(e) => setLocalLink(e.target.value)}
              placeholder="Ex: Salão de Festas ou Link do Google Meet" 
            />
          </div>
          <div className="form-group">
            <label>Pauta / Descrição</label>
            <textarea 
              rows="3" 
              value={pauta}
              onChange={(e) => setPauta(e.target.value)}
              placeholder="Assuntos a serem debatidos..." 
            />
          </div>
          <button type="submit" className="btn-salvar-reuniao" disabled={processando}>
            {processando ? 'Agendando...' : 'Salvar e Notificar Moradores'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="loading-txt">A carregar reuniões...</p>
      ) : (
        <div className="lista-reunioes">
          {reunioes.length === 0 ? (
            <div className="sem-reunioes">
              <p>Nenhuma reunião agendada no momento para este condomínio.</p>
            </div>
          ) : (
            reunioes.map((item) => (
              <div key={item.id} className="card-reuniao" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div className="card-reuniao-data">
                    <span className="icon-calendar">📅</span>
                    <span>{new Date(item.data_hora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                  <div className="card-reuniao-conteudo">
                    <h4>{item.titulo}</h4>
                    <p><strong>Pauta:</strong> {item.pauta || 'Sem pauta informada.'}</p>
                    {item.local_link && (
                      <p className="local-tag">📍 <strong>Local/Link:</strong> {item.local_link}</p>
                    )}
                  </div>
                </div>
                {ehSindicoOuAdmin && (
                  <button
                    type="button"
                    onClick={() => handleCancelarReuniao(item.id)}
                    disabled={processando}
                    style={{
                      backgroundColor: '#fff1f2',
                      border: '1px solid #fecdd3',
                      color: '#e11d48',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      marginLeft: '14px',
                      whiteSpace: 'nowrap'
                    }}
                    title="Cancelar esta reunião"
                  >
                    🗑️ Cancelar Reunião
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}