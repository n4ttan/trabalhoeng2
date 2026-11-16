import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  obterEstadoPagamentos,
  notificarInadimplentes
} from '../services/pagamentoApi';
import './PainelFinanceiroPage.css';

export default function PainelFinanceiroPage() {
  const navigate = useNavigate();
  const [condominioAtivo, setCondominioAtivo] = useState(null);
  const [relatorio, setRelatorio] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  // Estados para notificação de inadimplentes (Item 5)
  const [modalAberto, setModalAberto] = useState(false);
  const [tituloNotificacao, setTituloNotificacao] = useState(
    'Aviso de Cobrança: Taxa Condominial Pendente'
  );
  const [mensagemNotificacao, setMensagemNotificacao] = useState(
    'Prezado(a) morador(a), identificamos que constam faturas condominiais em aberto em sua unidade. Por favor, acesse o sistema para emitir a segunda via atualizada e regularizar seu pagamento.'
  );
  const [enviandoNotificacao, setEnviandoNotificacao] = useState(false);
  const [feedbackNotificacao, setFeedbackNotificacao] = useState(null);

  useEffect(() => {
    const condoSalvo = localStorage.getItem('morada_condominio_ativo');
    if (!condoSalvo) {
      navigate('/condominios');
      return;
    }
    try {
      const parsed = JSON.parse(condoSalvo);
      setCondominioAtivo(parsed);
      carregarDadosFinanceiros(parsed.id);
    } catch {
      navigate('/condominios');
    }
  }, [navigate]);

  const carregarDadosFinanceiros = async (condominioId) => {
    setCarregando(true);
    setErro('');
    try {
      const dados = await obterEstadoPagamentos(condominioId);
      setRelatorio(dados);
    } catch (err) {
      setErro(
        err.response?.data?.erro ||
          'Erro ao carregar o estado financeiro do condomínio.'
      );
    } finally {
      setCarregando(false);
    }
  };

  const handleNotificarInadimplentes = async (e) => {
    e.preventDefault();
    if (!condominioAtivo) return;

    setEnviandoNotificacao(true);
    setFeedbackNotificacao(null);
    try {
      const resposta = await notificarInadimplentes(condominioAtivo.id, {
        titulo: tituloNotificacao,
        mensagem: mensagemNotificacao
      });
      setFeedbackNotificacao({
        tipo: 'sucesso',
        texto: `${resposta.mensagem} (${resposta.total_notificados} morador(es) notificado(s))`
      });
      setModalAberto(false);
    } catch (err) {
      setFeedbackNotificacao({
        tipo: 'erro',
        texto:
          err.response?.data?.erro ||
          'Não foi possível enviar as notificações de cobrança.'
      });
    } finally {
      setEnviandoNotificacao(false);
    }
  };

  const formatarMoeda = (valor) => {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatarData = (dataStr) => {
    if (!dataStr) return '-';
    const parteData = String(dataStr).split('T')[0];
    const [ano, mes, dia] = parteData.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  if (carregando) {
    return (
      <div className="financeiro-container">
        <p className="financeiro-loading">Carregando indicadores financeiros...</p>
      </div>
    );
  }

  return (
    <div className="financeiro-container">
      <div className="financeiro-header">
        <div>
          <span className="financeiro-tag">GESTÃO FINANCEIRA</span>
          <h2>Painel Financeiro — {condominioAtivo?.nome}</h2>
          <p className="financeiro-sub">
            Acompanhe a adimplência, receitas recebidas e pendências do condomínio.
          </p>
        </div>

        <button
          className="btn-notificar-inadimplentes"
          onClick={() => setModalAberto(true)}
          disabled={
            !relatorio ||
            (relatorio.total_contas_pendentes === 0 &&
              relatorio.total_contas_atrasadas === 0)
          }
        >
          🔔 Notificar Inadimplentes
        </button>
      </div>

      {erro && <div className="financeiro-alerta erro">{erro}</div>}

      {feedbackNotificacao && (
        <div className={`financeiro-alerta ${feedbackNotificacao.tipo}`}>
          {feedbackNotificacao.texto}
        </div>
      )}

      {relatorio && (
        <>
          {/* Cards de Métricas (Item 4) */}
          <div className="financeiro-cards-grid">
            <div className="fin-card adimplencia">
              <span className="fin-card-label">Taxa de Adimplência</span>
              <strong className="fin-card-valor">
                {relatorio.taxa_adimplencia_percentual}%
              </strong>
              <small>
                {relatorio.total_contas_pagas} de {relatorio.total_contas} contas quitadas
              </small>
            </div>

            <div className="fin-card pago">
              <span className="fin-card-label">Total Recebido (Pago)</span>
              <strong className="fin-card-valor">
                {formatarMoeda(relatorio.valor_total_pago)}
              </strong>
              <small>{relatorio.total_contas_pagas} boletos pagos</small>
            </div>

            <div className="fin-card pendente">
              <span className="fin-card-label">A Receber (Pendente)</span>
              <strong className="fin-card-valor">
                {formatarMoeda(relatorio.valor_total_pendente)}
              </strong>
              <small>{relatorio.total_contas_pendentes} boletos em aberto</small>
            </div>

            <div className="fin-card atrasado">
              <span className="fin-card-label">Em Atraso (Inadimplência)</span>
              <strong className="fin-card-valor">
                {formatarMoeda(relatorio.valor_total_atrasado)}
              </strong>
              <small>{relatorio.total_contas_atrasadas} boletos vencidos</small>
            </div>
          </div>

          {/* Tabela Resumo dos Boletos */}
          <div className="financeiro-tabela-card">
            <h3>Detalhamento das Cobranças</h3>
            {relatorio.boletos && relatorio.boletos.length > 0 ? (
              <div className="tabela-scroll">
                <table className="financeiro-tabela">
                  <thead>
                    <tr>
                      <th>Morador</th>
                      <th>Bloco / Unidade</th>
                      <th>Referência</th>
                      <th>Vencimento</th>
                      <th>Valor</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorio.boletos.map((boleto) => (
                      <tr key={boleto.id}>
                        <td>{boleto.usuario_nome || `Morador #${boleto.id_usuario}`}</td>
                        <td>
                          {boleto.bloco ? `Bloco ${boleto.bloco}` : '-'} /{' '}
                          {boleto.unidade || '-'}
                        </td>
                        <td>{boleto.mes_referencia}</td>
                        <td>{formatarData(boleto.data_vencimento)}</td>
                        <td>{formatarMoeda(boleto.valor)}</td>
                        <td>
                          <span
                            className={`status-pill status-${String(
                              boleto.status
                            ).toLowerCase()}`}
                          >
                            {boleto.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="sem-registros">Nenhum boleto registrado neste condomínio.</p>
            )}
          </div>
        </>
      )}

      {/* Modal de Notificação de Inadimplentes (Item 5) */}
      {modalAberto && (
        <div className="fin-modal-overlay">
          <div className="fin-modal">
            <h3>Notificar Moradores com Pendências</h3>
            <p className="fin-modal-desc">
              Será enviada uma notificação urgente (e alerta em tempo real) para todos os moradores com boletos pendentes ou em atraso.
            </p>
            <form onSubmit={handleNotificarInadimplentes}>
              <label>
                Título do Aviso
                <input
                  type="text"
                  value={tituloNotificacao}
                  onChange={(e) => setTituloNotificacao(e.target.value)}
                  required
                />
              </label>

              <label>
                Mensagem
                <textarea
                  rows="4"
                  value={mensagemNotificacao}
                  onChange={(e) => setMensagemNotificacao(e.target.value)}
                  required
                />
              </label>

              <div className="fin-modal-acoes">
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={() => setModalAberto(false)}
                  disabled={enviandoNotificacao}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-confirmar-envio"
                  disabled={enviandoNotificacao}
                >
                  {enviandoNotificacao ? 'Enviando...' : 'Enviar Cobrança'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}