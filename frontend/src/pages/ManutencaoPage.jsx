import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { obterManutencoes, criarManutencao, atualizarStatusManutencao } from '../services/manutencaoApi';
import { obterPerfil } from '../services/authApi';
import './ManutencaoPage.css';

const STATUS = [
  { valor: 'ABERTO', rotulo: 'Aberto' },
  { valor: 'EM_ANDAMENTO', rotulo: 'Em andamento' },
  { valor: 'CONCLUIDO', rotulo: 'Concluído' }
];
const PRIORIDADES = [
  { valor: 'BAIXA', rotulo: 'Baixa' },
  { valor: 'MEDIA', rotulo: 'Média' },
  { valor: 'ALTA', rotulo: 'Alta' }
];
const rotulo = (lista, valor) => lista.find((i) => i.valor === valor)?.rotulo || valor;
const dataBR = (iso) => new Date(iso).toLocaleDateString('pt-BR');

export default function ManutencaoPage() {
  const navigate = useNavigate();
  const [chamados, setChamados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });
  const [form, setForm] = useState({ titulo: '', descricao: '', local: '', prioridade: 'MEDIA' });

  const perfil = obterPerfil();
  const ehSindicoOuAdmin = perfil === 'SINDICO' || perfil === 'ADMIN';

  const condoSalvo = localStorage.getItem('morada_condominio_ativo');
  const condominioAtivo = condoSalvo ? JSON.parse(condoSalvo) : null;

  const carregar = async () => {
    if (!condominioAtivo?.id) {
      setCarregando(false);
      return;
    }
    try {
      setCarregando(true);
      const data = await obterManutencoes(condominioAtivo.id);
      setChamados(Array.isArray(data) ? data : []);
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.message || 'Erro ao carregar chamados.' });
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [condominioAtivo?.id]);

  const alterar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem({ tipo: '', texto: '' });
    try {
      setProcessando(true);
      await criarManutencao(condominioAtivo.id, form);
      setForm({ titulo: '', descricao: '', local: '', prioridade: 'MEDIA' });
      setMensagem({ tipo: 'sucesso', texto: 'Chamado aberto com sucesso!' });
      await carregar();
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.message || 'Erro ao abrir chamado.' });
    } finally {
      setProcessando(false);
    }
  };

  const handleStatus = async (id, status) => {
    setMensagem({ tipo: '', texto: '' });
    try {
      await atualizarStatusManutencao(condominioAtivo.id, id, status);
      await carregar();
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.message || 'Erro ao atualizar status.' });
    }
  };

  if (!condominioAtivo?.id) {
    return (
      <div className="manutencao-page">
        <div className="manutencao-container">
          <h1>Manutenção</h1>
          <p>Selecione um condomínio para abrir ou acompanhar chamados.</p>
          <button type="button" onClick={() => navigate('/condominios')}>Escolher condomínio</button>
        </div>
      </div>
    );
  }

  return (
    <div className="manutencao-page">
      <div className="manutencao-container">
        <h1>Manutenção no Condomínio</h1>
        <p>{ehSindicoOuAdmin ? 'Todos os chamados do condomínio.' : 'Acompanhe os seus chamados.'}</p>

        {mensagem.texto && (
          <div className={`manutencao-alerta ${mensagem.tipo}`}>{mensagem.texto}</div>
        )}

        <form className="manutencao-form" onSubmit={handleSubmit}>
          <h2>Abrir chamado</h2>
          <input placeholder="Título" value={form.titulo} onChange={alterar('titulo')} maxLength={150} required />
          <input placeholder="Local / área comum" value={form.local} onChange={alterar('local')} maxLength={150} required />
          <textarea placeholder="Descrição" value={form.descricao} onChange={alterar('descricao')} required />
          <select value={form.prioridade} onChange={alterar('prioridade')}>
            {PRIORIDADES.map((p) => <option key={p.valor} value={p.valor}>{p.rotulo}</option>)}
          </select>
          <button type="submit" disabled={processando}>{processando ? 'Enviando...' : 'Abrir chamado'}</button>
        </form>

        {carregando ? (
          <p>Carregando...</p>
        ) : chamados.length === 0 ? (
          <p>Nenhum chamado encontrado.</p>
        ) : (
          <div className="manutencao-lista">
            {chamados.map((c) => (
              <div key={c.id} className="manutencao-card">
                <div className="manutencao-card-topo">
                  <strong>{c.titulo}</strong>
                  <span className={`manutencao-status ${c.status}`}>{rotulo(STATUS, c.status)}</span>
                </div>
                <p>{c.descricao}</p>
                <small>
                  {c.local} · Prioridade {rotulo(PRIORIDADES, c.prioridade)} · {dataBR(c.criado_em)}
                  {ehSindicoOuAdmin && ` · ${c.usuario_nome}`}
                </small>
                {ehSindicoOuAdmin && (
                  <select value={c.status} onChange={(e) => handleStatus(c.id, e.target.value)}>
                    {STATUS.map((s) => <option key={s.valor} value={s.valor}>{s.rotulo}</option>)}
                  </select>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
