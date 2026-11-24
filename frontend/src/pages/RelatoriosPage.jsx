import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { obterRelatorio } from '../services/relatorioApi';
import './RelatoriosPage.css';

const moeda = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dataHora = (v) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
};

function montarCsv(r) {
  const linhas = [['Seção', 'Item', 'Quantidade', 'Valor']];
  r.moradoresPorStatus.forEach((m) => linhas.push(['Moradores', m.status, m.total, '']));
  Object.entries(r.boletos).forEach(([k, b]) => linhas.push(['Boletos', k, b.quantidade, b.valor]));
  r.reservasPorMes.forEach((m) => {
    linhas.push(['Reservas churrasqueira', m.mes, m.churrasqueira, '']);
    linhas.push(['Reservas salão', m.mes, m.salao, '']);
  });
  r.reunioesFuturas.forEach((m) => linhas.push(['Reuniões futuras', `${m.titulo || ''} ${m.data_hora}`.trim(), 1, '']));
  r.notificacoes.porTipo.forEach((n) => linhas.push(['Notificações', n.tipo, n.total, '']));
  return linhas
    .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
    .join('\r\n');
}

function exportarCsv(r) {
  const blob = new Blob(['﻿' + montarCsv(r)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio-condominio-${r.id_condominio}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RelatoriosPage() {
  const navigate = useNavigate();
  const [condominio, setCondominio] = useState(null);
  const [relatorio, setRelatorio] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let condo;
    try {
      condo = JSON.parse(localStorage.getItem('morada_condominio_ativo'));
    } catch {
      condo = null;
    }
    if (!condo?.id) {
      navigate('/condominios');
      return;
    }
    setCondominio(condo);
    obterRelatorio(condo.id)
      .then(setRelatorio)
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, [navigate]);

  if (carregando) return <div className="relatorios-container">Carregando relatórios...</div>;
  if (erro) return <div className="relatorios-container relatorios-erro">{erro}</div>;

  const { boletos, notificacoes } = relatorio;
  const cards = [
    { titulo: 'Boletos pagos', qtd: boletos.pagos.quantidade, valor: boletos.pagos.valor },
    { titulo: 'Boletos pendentes', qtd: boletos.pendentes.quantidade, valor: boletos.pendentes.valor },
    { titulo: 'Boletos vencidos', qtd: boletos.vencidos.quantidade, valor: boletos.vencidos.valor },
    { titulo: 'Reuniões futuras', qtd: relatorio.reunioesFuturas.length },
    { titulo: 'Notificações enviadas', qtd: notificacoes.total }
  ];

  return (
    <div className="relatorios-container">
      <div className="relatorios-cabecalho">
        <h1>Relatórios{condominio?.nome ? ` - ${condominio.nome}` : ''}</h1>
        <button type="button" className="relatorios-botao" onClick={() => exportarCsv(relatorio)}>
          Exportar CSV
        </button>
      </div>

      <div className="relatorios-cards">
        {cards.map((c) => (
          <div key={c.titulo} className="relatorios-card">
            <span>{c.titulo}</span>
            <strong>{c.qtd}</strong>
            {c.valor !== undefined && <small>{moeda(c.valor)}</small>}
          </div>
        ))}
      </div>

      <section>
        <h2>Moradores por status</h2>
        <table className="relatorios-tabela">
          <thead><tr><th>Status</th><th>Total</th></tr></thead>
          <tbody>
            {relatorio.moradoresPorStatus.length === 0 && <tr><td colSpan="2">Sem dados.</td></tr>}
            {relatorio.moradoresPorStatus.map((m) => (
              <tr key={m.status}><td>{m.status}</td><td>{m.total}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Reservas por mês</h2>
        <table className="relatorios-tabela">
          <thead><tr><th>Mês</th><th>Churrasqueira</th><th>Salão</th></tr></thead>
          <tbody>
            {relatorio.reservasPorMes.length === 0 && <tr><td colSpan="3">Sem dados.</td></tr>}
            {relatorio.reservasPorMes.map((m) => (
              <tr key={m.mes}><td>{m.mes}</td><td>{m.churrasqueira}</td><td>{m.salao}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Reuniões futuras</h2>
        <table className="relatorios-tabela">
          <thead><tr><th>Reunião</th><th>Data</th></tr></thead>
          <tbody>
            {relatorio.reunioesFuturas.length === 0 && <tr><td colSpan="2">Nenhuma reunião agendada.</td></tr>}
            {relatorio.reunioesFuturas.map((m) => (
              <tr key={m.id}><td>{m.titulo || m.pauta || `Reunião #${m.id}`}</td><td>{dataHora(m.data_hora)}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Notificações por tipo</h2>
        <table className="relatorios-tabela">
          <thead><tr><th>Tipo</th><th>Total</th></tr></thead>
          <tbody>
            {notificacoes.porTipo.length === 0 && <tr><td colSpan="2">Sem dados.</td></tr>}
            {notificacoes.porTipo.map((n) => (
              <tr key={n.tipo}><td>{n.tipo}</td><td>{n.total}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
