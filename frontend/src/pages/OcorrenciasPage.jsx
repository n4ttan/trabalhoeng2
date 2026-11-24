import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  registrarOcorrencia,
  listarMinhasOcorrencias,
  listarOcorrenciasCondominio,
  atualizarOcorrencia
} from '../services/ocorrenciaApi';
import { obterPerfil } from '../services/authApi';
import './OcorrenciasPage.css';

const CATEGORIAS = ['BARULHO', 'VAZAMENTO', 'SEGURANCA', 'LIMPEZA', 'OUTROS'];
const STATUS = ['REGISTRADA', 'EM_ANALISE', 'RESOLVIDA'];

export default function OcorrenciasPage() {
  const [ocorrencias, setOcorrencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [processando, setProcessando] = useState(false);
  const [form, setForm] = useState({ titulo: '', descricao: '', categoria: 'BARULHO', data_ocorrencia: '' });
  // Edição do síndico por id: { status, resposta }
  const [edicoes, setEdicoes] = useState({});

  const navigate = useNavigate();
  const perfil = obterPerfil();
  const ehSindico = perfil === 'SINDICO' || perfil === 'ADMIN';

  const condoSalvo = localStorage.getItem('morada_condominio_ativo');
  const condominioAtivo = condoSalvo ? JSON.parse(condoSalvo) : null;

  useEffect(() => {
    if (!condominioAtivo) {
      navigate('/condominios');
      return;
    }
    carregar();
  }, [condominioAtivo?.id]);

  async function carregar() {
    try {
      setLoading(true);
      const dados = ehSindico
        ? await listarOcorrenciasCondominio(condominioAtivo.id)
        : await listarMinhasOcorrencias(condominioAtivo.id);
      setOcorrencias(Array.isArray(dados) ? dados : []);
    } catch (err) {
      setErro(err.message || 'Erro ao carregar ocorrências.');
    } finally {
      setLoading(false);
    }
  }

  const handleRegistrar = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    try {
      setProcessando(true);
      await registrarOcorrencia(condominioAtivo.id, form);
      setSucesso('Ocorrência registrada com sucesso!');
      setForm({ titulo: '', descricao: '', categoria: 'BARULHO', data_ocorrencia: '' });
      await carregar();
    } catch (err) {
      setErro(err.message || 'Erro ao registrar ocorrência.');
    } finally {
      setProcessando(false);
    }
  };

  const handleSalvar = async (o) => {
    const edicao = edicoes[o.id] || {};
    setErro('');
    setSucesso('');
    try {
      setProcessando(true);
      await atualizarOcorrencia(condominioAtivo.id, o.id, {
        status: edicao.status ?? o.status,
        resposta: edicao.resposta ?? o.resposta ?? ''
      });
      setSucesso('Ocorrência atualizada com sucesso!');
      setEdicoes((prev) => ({ ...prev, [o.id]: undefined }));
      await carregar();
    } catch (err) {
      setErro(err.message || 'Erro ao atualizar ocorrência.');
    } finally {
      setProcessando(false);
    }
  };

  const editar = (id, campo, valor) =>
    setEdicoes((prev) => ({ ...prev, [id]: { ...prev[id], [campo]: valor } }));

  const formatarData = (d) => (d ? String(d).slice(0, 10).split('-').reverse().join('/') : '');

  return (
    <div className="ocorrencias-container">
      <h1>Ocorrências</h1>

      {erro && <div className="ocorrencias-alerta erro">{erro}</div>}
      {sucesso && <div className="ocorrencias-alerta sucesso">{sucesso}</div>}

      {!ehSindico && (
        <form className="ocorrencias-form" onSubmit={handleRegistrar}>
          <h2>Registrar ocorrência</h2>
          <input
            type="text"
            placeholder="Título"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            required
          />
          <select
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
          >
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            type="date"
            value={form.data_ocorrencia}
            onChange={(e) => setForm({ ...form, data_ocorrencia: e.target.value })}
            required
          />
          <textarea
            placeholder="Descrição"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            required
          />
          <button type="submit" disabled={processando}>Registrar</button>
        </form>
      )}

      <h2>{ehSindico ? 'Ocorrências do condomínio' : 'Minhas ocorrências'}</h2>
      {loading ? (
        <p>Carregando...</p>
      ) : ocorrencias.length === 0 ? (
        <p>Nenhuma ocorrência encontrada.</p>
      ) : (
        <ul className="ocorrencias-lista">
          {ocorrencias.map((o) => (
            <li key={o.id} className="ocorrencia-card">
              <strong>{o.titulo}</strong>
              <span> · {o.categoria} · {formatarData(o.data_ocorrencia)} · {o.status}</span>
              {ehSindico && o.nome_morador && <div>Morador: {o.nome_morador}</div>}
              <p>{o.descricao}</p>
              {!ehSindico && o.resposta && <p className="ocorrencia-resposta">Resposta: {o.resposta}</p>}
              {ehSindico && (
                <div className="ocorrencia-acoes">
                  <select
                    value={edicoes[o.id]?.status ?? o.status}
                    onChange={(e) => editar(o.id, 'status', e.target.value)}
                  >
                    {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <textarea
                    placeholder="Resposta / observação"
                    value={edicoes[o.id]?.resposta ?? o.resposta ?? ''}
                    onChange={(e) => editar(o.id, 'resposta', e.target.value)}
                  />
                  <button type="button" disabled={processando} onClick={() => handleSalvar(o)}>Salvar</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
