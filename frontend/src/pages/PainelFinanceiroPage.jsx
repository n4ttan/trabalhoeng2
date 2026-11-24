
import React, { useEffect, useState, useCallback, useRef } from 'react';
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

  // Item 5 - Estados das notificações
  const [modalAberto, setModalAberto] = useState(false);

  const [tituloNotificacao, setTituloNotificacao] = useState(
    'Aviso de Cobrança: Taxa Condominial Pendente'
  );

  const [mensagemNotificacao, setMensagemNotificacao] = useState(
    'Prezado(a) morador(a), identificamos que constam faturas condominiais em aberto em sua unidade. Por favor, acesse o sistema para emitir a segunda via atualizada e regularizar seu pagamento.'
  );

  const [enviandoNotificacao, setEnviandoNotificacao] = useState(false);
  const [feedbackNotificacao, setFeedbackNotificacao] = useState(null);
  const [erroModal, setErroModal] = useState('');

  const envioEmCurso = useRef(false);

  // Item 4 - Consultar dados financeiros
  const carregarDadosFinanceiros = useCallback(async (condominioId) => {
    setCarregando(true);
    setErro('');

    try {
      const dados = await obterEstadoPagamentos(condominioId);
      setRelatorio(dados);
    } catch (err) {
      setRelatorio(null);
      setErro(
        err.response?.data?.erro ||
        err.message ||
        'Erro ao carregar o estado financeiro do condomínio.'
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    try {
      const parsed = JSON.parse(
        localStorage.getItem('morada_condominio_ativo')
      );

      if (!parsed?.id) {
        navigate('/condominios', { replace: true });
        return;
      }

      setCondominioAtivo(parsed);
      carregarDadosFinanceiros(parsed.id);

    } catch {
      navigate('/condominios', { replace: true });
    }
  }, [navigate, carregarDadosFinanceiros]);

  // Item 5 - Enviar notificações
  const handleNotificarInadimplentes = async (e) => {
    e.preventDefault();

    if (!condominioAtivo || envioEmCurso.current) return;

    if (!tituloNotificacao.trim() || !mensagemNotificacao.trim()) {
      setErroModal('Preencha o título e a mensagem.');
      return;
    }

    envioEmCurso.current = true;

    setErroModal('');
    setEnviandoNotificacao(true);
    setFeedbackNotificacao(null);

    try {
      const resposta = await notificarInadimplentes(
        condominioAtivo.id,
        {
          titulo: tituloNotificacao.trim(),
          mensagem: mensagemNotificacao.trim()
        }
      );

      setFeedbackNotificacao({
        tipo: 'sucesso',
        texto: `${resposta.mensagem} (${resposta.total_notificados} morador(es) notificado(s))`
      });

      setModalAberto(false);

    } catch (err) {
      setErroModal(
        err.response?.data?.erro ||
        err.message ||
        'Não foi possível enviar as notificações de cobrança.'
      );

    } finally {
      envioEmCurso.current = false;
      setEnviandoNotificacao(false);
    }
  };

  // Formatação monetária
  const formatarMoeda = (valor) => {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Formatação de datas
  const formatarData = (dataStr) => {
    if (!dataStr) return '-';

    const parteData = String(dataStr).split('T')[0];
    const [ano, mes, dia] = parteData.split('-');

    return `${dia}/${mes}/${ano}`;
  };

  // Identificação de boletos atrasados
  const statusExibido = (boleto) => {
    const hoje = new Date();

    const dataLocal =
      `${hoje.getFullYear()}-` +
      `${String(hoje.getMonth() + 1).padStart(2, '0')}-` +
      `${String(hoje.getDate()).padStart(2, '0')}`;

    const vencimento = String(
      boleto.data_vencimento || ''
    ).split('T')[0];

    return boleto.status === 'PENDENTE' &&
      vencimento &&
      vencimento < dataLocal
      ? 'ATRASADO'
      : boleto.status;
  };

  if (carregando) {
    return (
      <div className="financeiro-container">
        <p className="financeiro-loading">
          Carregando indicadores financeiros...
        </p>
      </div>
    );
  }

  return (
    <div className="financeiro-container">

      <div className="financeiro-header">
        <div>
          <span className="financeiro-tag">
            GESTÃO FINANCEIRA
          </span>

          <h2>
            Painel Financeiro — {condominioAtivo?.nome}
          </h2>

          <p className="financeiro-sub">
            Acompanhe a adimplência, receitas recebidas
            e pendências do condomínio.
          </p>
        </div>

        <div className="financeiro-acoes">

          <button
            type="button"
            className="fin-btn-atualizar"
            onClick={() =>
              carregarDadosFinanceiros(condominioAtivo.id)
            }
            disabled={!condominioAtivo}
          >
            Atualizar dados
          </button>

          <button
            type="button"
            className="btn-notificar-inadimplentes"
            onClick={() => {
              setErroModal('');
              setFeedbackNotificacao(null);
              setModalAberto(true);
            }}
            disabled={
              !relatorio ||
              (
                relatorio.total_contas_pendentes === 0 &&
                relatorio.total_contas_atrasadas === 0
              )
            }
          >
            Notificar Inadimplentes
          </button>

        </div>
      </div>

      {erro && (
        <div className="financeiro-alerta erro" role="alert">
          {erro}
        </div>
      )}

      {feedbackNotificacao && (
        <div
          className={`financeiro-alerta ${feedbackNotificacao.tipo}`}
          role="status"
        >
          {feedbackNotificacao.texto}
        </div>
      )}

      {relatorio && (
        <>

          {/* ITEM 4 - Indicadores financeiros */}

          <div className="financeiro-cards-grid">

            <div className="fin-card adimplencia">
              <span className="fin-card-label">
                Taxa de Adimplência
              </span>

              <strong className="fin-card-valor">
                {relatorio.taxa_adimplencia_percentual}%
              </strong>

              <small>
                {relatorio.total_contas_pagas} de{' '}
                {relatorio.total_contas} contas quitadas
              </small>
            </div>

            <div className="fin-card pago">
              <span className="fin-card-label">
                Total Recebido (Pago)
              </span>

              <strong className="fin-card-valor">
                {formatarMoeda(relatorio.valor_total_pago)}
              </strong>

              <small>
                {relatorio.total_contas_pagas} boletos pagos
              </small>
            </div>

            <div className="fin-card pendente">
              <span className="fin-card-label">
                A Receber (Pendente)
              </span>

              <strong className="fin-card-valor">
                {formatarMoeda(relatorio.valor_total_pendente)}
              </strong>

              <small>
                {relatorio.total_contas_pendentes} boletos em aberto
              </small>
            </div>

            <div className="fin-card atrasado">
              <span className="fin-card-label">
                Em Atraso (Inadimplência)
              </span>

              <strong className="fin-card-valor">
                {formatarMoeda(relatorio.valor_total_atrasado)}
              </strong>

              <small>
                {relatorio.total_contas_atrasadas} boletos vencidos
              </small>
            </div>

          </div>

          {/* Tabela de cobranças */}

          <div className="financeiro-tabela-card">

            <h3>
              Detalhamento das Cobranças
              ({relatorio.total_contas} contas)
            </h3>

            {relatorio.boletos &&
             relatorio.boletos.length > 0 ? (

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

                        <td>
                          {boleto.usuario_nome ||
                            `Morador #${boleto.id_usuario}`}
                        </td>

                        <td>
                          {boleto.bloco
                            ? `Bloco ${boleto.bloco}`
                            : '-'}
                          {' / '}
                          {boleto.unidade || '-'}
                        </td>

                        <td>{boleto.mes_referencia}</td>

                        <td>
                          {formatarData(boleto.data_vencimento)}
                        </td>

                        <td>
                          {formatarMoeda(boleto.valor)}
                        </td>

                        <td>
                          <span
                            className={`status-pill status-${String(
                              statusExibido(boleto)
                            ).toLowerCase()}`}
                          >
                            {statusExibido(boleto)}
                          </span>
                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            ) : (

              <p className="sem-registros">
                Nenhum boleto registrado neste condomínio.
              </p>

            )}

          </div>

        </>
      )}

      {/* ITEM 5 - Modal de notificação */}

      {modalAberto && (

        <div className="fin-modal-overlay">

          <div
            className="fin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fin-modal-titulo"
          >

            <h3 id="fin-modal-titulo">
              Notificar Moradores com Pendências
            </h3>

            <p className="fin-modal-desc">
              Será enviada uma notificação de cobrança
              para moradores com boletos pendentes
              (inclusive a vencer) ou em atraso.
              Confirme antes de enviar.
            </p>

            <form onSubmit={handleNotificarInadimplentes}>

              {erroModal && (
                <div
                  className="financeiro-alerta erro"
                  role="alert"
                >
                  {erroModal}
                </div>
              )}

              <label>
                Título do Aviso

                <input
                  type="text"
                  value={tituloNotificacao}
                  onChange={(e) =>
                    setTituloNotificacao(e.target.value)
                  }
                  disabled={enviandoNotificacao}
                  required
                />

              </label>

              <label>
                Mensagem

                <textarea
                  rows="4"
                  value={mensagemNotificacao}
                  onChange={(e) =>
                    setMensagemNotificacao(e.target.value)
                  }
                  disabled={enviandoNotificacao}
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
                  {enviandoNotificacao
                    ? 'Enviando...'
                    : 'Enviar Cobrança'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}
