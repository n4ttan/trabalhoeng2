import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarBoletosCondominio, listarMoradoresCondominio, criarBoleto } from '../services/boletoSindicoApi';
import './GestaoBoletosPage.css';

const brl = (v) =>
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Datas do MySQL chegam como ISO; usar só a parte da data evita deslocar o dia pelo fuso.
const dataBR = (iso) => String(iso).slice(0, 10).split('-').reverse().join('/');

function situacao(boleto) {
  if (boleto.status === 'PAGO') return { chave: 'pago', texto: 'Pago' };
  if (boleto.status === 'CANCELADO') return { chave: 'cancelado', texto: 'Cancelado' };
  if (boleto.status === 'ATRASADO') return { chave: 'atrasado', texto: 'Em atraso' };
  const hoje = new Date().toISOString().slice(0, 10);
  if (String(boleto.data_vencimento).slice(0, 10) < hoje) {
    return { chave: 'atrasado', texto: 'Em atraso' };
  }
  return { chave: 'aberto', texto: 'Em aberto' };
}

const FILTROS_STATUS = [
  ['', 'Todos'],
  ['aberto', 'Em aberto'],
  ['atrasado', 'Em atraso'],
  ['pago', 'Pagos'],
  ['cancelado', 'Cancelados']
];

export default function GestaoBoletosPage() {
  const [boletos, setBoletos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [status, setStatus] = useState('');
  const [mes, setMes] = useState('');
  const [busca, setBusca] = useState('');

  // Geração de boletos
  const [gerando, setGerando] = useState(false); // painel aberto
  const [moradores, setMoradores] = useState([]);
  const [form, setForm] = useState({ id_usuario: '', mes_referencia: '', valor: '', data_vencimento: '' });
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState({ tipo: '', texto: '' });

  const navigate = useNavigate();
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
      setCarregando(true);
      setErro('');
      const dados = await listarBoletosCondominio(condominioAtivo.id);
      setBoletos(Array.isArray(dados) ? dados : []);
    } catch (err) {
      setErro(err.message || 'Não foi possível carregar os boletos do condomínio.');
    } finally {
      setCarregando(false);
    }
  }

  async function abrirGeracao() {
    setAviso({ tipo: '', texto: '' });
    setGerando(!gerando);
    if (moradores.length === 0) {
      try {
        const lista = await listarMoradoresCondominio(condominioAtivo.id);
        setMoradores(Array.isArray(lista) ? lista : []);
      } catch (err) {
        setAviso({ tipo: 'erro', texto: err.message || 'Não foi possível carregar os moradores.' });
      }
    }
  }

  const campo = (nome) => (e) => setForm({ ...form, [nome]: e.target.value });

  async function enviarIndividual(e) {
    e.preventDefault();
    setEnviando(true);
    setAviso({ tipo: '', texto: '' });
    try {
      await criarBoleto(condominioAtivo.id, { ...form, id_usuario: Number(form.id_usuario) });
      const nome = moradores.find((m) => String(m.id) === form.id_usuario)?.nome;
      setAviso({ tipo: 'sucesso', texto: `Boleto de ${form.mes_referencia} criado para ${nome || 'o morador'}.` });
      setForm({ ...form, id_usuario: '' });
      carregar();
    } catch (err) {
      setAviso({ tipo: 'erro', texto: err.message || 'Não foi possível criar o boleto.' });
    } finally {
      setEnviando(false);
    }
  }

  if (!condominioAtivo) return null;

  const termo = busca.trim().toLowerCase();
  const visiveis = boletos.filter(
    (b) =>
      (!status || situacao(b).chave === status) &&
      (!mes || b.mes_referencia === mes) &&
      (!termo || String(b.usuario_nome).toLowerCase().includes(termo))
  );
  const totalVisiveis = visiveis.reduce((soma, b) => soma + Number(b.valor), 0);
  const filtrando = status || mes || termo;

  return (
    <main className="gb-page">
      <header className="gb-header">
        <h2>Boletos do condomínio</h2>
        <p>{condominioAtivo.nome}</p>
      </header>

      <section className="gb-gerar">
        <button type="button" className="gb-btn" aria-expanded={gerando} onClick={abrirGeracao}>
          {gerando ? 'Fechar' : 'Gerar boleto'}
        </button>

        {gerando && (
          <div className="gb-gerar-painel">
            {aviso.texto && (
              <p className={`gb-aviso gb-aviso--${aviso.tipo}`} role={aviso.tipo === 'erro' ? 'alert' : 'status'}>
                {aviso.texto}
              </p>
            )}
            <form className="gb-form" onSubmit={enviarIndividual}>
              <label className="gb-form-cheio">
                Morador
                <select required value={form.id_usuario} onChange={campo('id_usuario')}>
                  <option value="">Escolha um morador</option>
                  {moradores.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome}{m.unidade ? ` — ${[m.bloco_nome || m.bloco, m.unidade].filter(Boolean).join(' ')}` : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Mês de referência
                <input type="month" required value={form.mes_referencia} onChange={campo('mes_referencia')} />
              </label>
              <label>
                Vencimento
                <input type="date" required value={form.data_vencimento} onChange={campo('data_vencimento')} />
              </label>
              <label>
                Valor (R$)
                <input type="number" required min="0.01" step="0.01" inputMode="decimal" value={form.valor} onChange={campo('valor')} />
              </label>
              <button type="submit" className="gb-btn" disabled={enviando}>
                {enviando ? 'Criando…' : 'Criar boleto'}
              </button>
            </form>
          </div>
        )}
      </section>

      {erro && (
        <div className="gb-erro" role="alert">
          <span>{erro}</span>
          <button type="button" onClick={carregar}>Tentar de novo</button>
        </div>
      )}

      {carregando ? (
        <p className="gb-vazio" role="status">Carregando boletos…</p>
      ) : (
        !erro &&
        (boletos.length === 0 ? (
          <p className="gb-vazio">
            Nenhum boleto gerado neste condomínio ainda.
          </p>
        ) : (
          <>
            <div className="gb-filtros">
              <label>
                Morador
                <input type="search" value={busca} placeholder="Buscar por nome" onChange={(e) => setBusca(e.target.value)} />
              </label>
              <label>
                Situação
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  {FILTROS_STATUS.map(([valor, rotulo]) => (
                    <option key={valor} value={valor}>{rotulo}</option>
                  ))}
                </select>
              </label>
              <label>
                Mês de referência
                <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} />
              </label>
              {filtrando && (
                <button type="button" className="gb-btn-sec" onClick={() => { setStatus(''); setMes(''); setBusca(''); }}>
                  Limpar filtros
                </button>
              )}
            </div>

            <p className="gb-resumo" role="status">
              {visiveis.length} {visiveis.length === 1 ? 'boleto' : 'boletos'}, {brl(totalVisiveis)}
            </p>

            {visiveis.length === 0 ? (
              <p className="gb-vazio">Nenhum boleto com esses filtros.</p>
            ) : (
              <div className="gb-tabela-wrap">
                <table className="gb-tabela">
                  <thead>
                    <tr>
                      <th scope="col">Morador</th>
                      <th scope="col">Unidade</th>
                      <th scope="col">Referência</th>
                      <th scope="col">Vencimento</th>
                      <th scope="col" className="gb-num">Valor</th>
                      <th scope="col">Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visiveis.map((b) => {
                      const sit = situacao(b);
                      return (
                        <tr key={b.id}>
                          <td>{b.usuario_nome}</td>
                          <td>{[b.bloco && `Bloco ${b.bloco}`, b.unidade].filter(Boolean).join(', ') || '—'}</td>
                          <td>{b.mes_referencia}</td>
                          <td>{dataBR(b.data_vencimento)}</td>
                          <td className="gb-num">{brl(b.valor)}</td>
                          <td><span className={`gb-status gb-status--${sit.chave}`}>{sit.texto}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ))
      )}
    </main>
  );
}
