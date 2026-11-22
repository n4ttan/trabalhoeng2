import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { obterReservasSalao, criarReservaSalao, cancelarReservaSalao } from '../services/reservaSalaoApi';
import { obterUsuario, obterPerfil } from '../services/authApi';
import './ReservasSalaoPage.css';

const dataBR = (iso) => String(iso).slice(0, 10).split('-').reverse().join('/');
const hora = (t) => String(t).slice(0, 5);

export default function ReservasSalaoPage() {
  const navigate = useNavigate();
  const [reservas, setReservas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('TODAS');

  const [dataReserva, setDataReserva] = useState('');
  const [horarioInicio, setHorarioInicio] = useState('');
  const [horarioFim, setHorarioFim] = useState('');
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  const usuarioLogado = obterUsuario();
  const perfil = obterPerfil();
  const ehSindicoOuAdmin = perfil === 'SINDICO' || perfil === 'ADMIN';

  const condoSalvo = localStorage.getItem('morada_condominio_ativo');
  const condominioAtivo = condoSalvo ? JSON.parse(condoSalvo) : null;

  const carregarReservas = async () => {
    if (!condominioAtivo?.id) {
      setCarregando(false);
      return;
    }

    try {
      setCarregando(true);
      const data = await obterReservasSalao(condominioAtivo.id);
      setReservas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar reservas do salão:', err);
      setMensagem({
        tipo: 'erro',
        texto: err.message || 'Erro ao carregar reservas do salão de festas.'
      });
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarReservas();
  }, [condominioAtivo?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem({ tipo: '', texto: '' });

    if (!condominioAtivo?.id) {
      setMensagem({
        tipo: 'erro',
        texto: 'Por favor, selecione um condomínio antes de realizar uma reserva.'
      });
      return;
    }

    if (horarioInicio >= horarioFim) {
      setMensagem({
        tipo: 'erro',
        texto: 'O horário de início deve ser anterior ao horário de término.'
      });
      return;
    }

    try {
      setProcessando(true);
      await criarReservaSalao(condominioAtivo.id, {
        data_reserva: dataReserva,
        horario_inicio: horarioInicio,
        horario_fim: horarioFim
      });

      setMensagem({
        tipo: 'sucesso',
        texto: 'Reserva do salão de festas confirmada com sucesso!'
      });

      setDataReserva('');
      setHorarioInicio('');
      setHorarioFim('');
      await carregarReservas();
    } catch (err) {
      setMensagem({
        tipo: 'erro',
        texto: err.message || 'Erro ao agendar reserva do salão.'
      });
    } finally {
      setProcessando(false);
    }
  };

  const handleCancelar = async (reservaId) => {
    if (!window.confirm('Tem certeza que deseja cancelar esta reserva do salão de festas?')) {
      return;
    }

    setMensagem({ tipo: '', texto: '' });

    try {
      setProcessando(true);
      await cancelarReservaSalao(condominioAtivo.id, reservaId);
      setMensagem({
        tipo: 'sucesso',
        texto: 'Reserva do salão cancelada com sucesso.'
      });
      await carregarReservas();
    } catch (err) {
      setMensagem({
        tipo: 'erro',
        texto: err.message || 'Não foi possível cancelar a reserva.'
      });
    } finally {
      setProcessando(false);
    }
  };

  // Se não houver condomínio selecionado
  if (!condominioAtivo?.id) {
    return (
      <main className="salao-page">
        <div className="salao-sem-condo">
          <span className="salao-icone-aviso">⚠️</span>
          <h2>Nenhum Condomínio Selecionado</h2>
          <p>Para agendar ou visualizar reservas do salão de festas, selecione primeiro o seu condomínio.</p>
          <button 
            type="button" 
            className="salao-btn-selecionar"
            onClick={() => navigate('/condominios')}
          >
            Ir para Seleção de Condomínios
          </button>
        </div>
      </main>
    );
  }

  const reservasFiltradas = reservas.filter((r) => {
    if (filtroStatus === 'TODAS') return true;
    return r.status === filtroStatus;
  });

  return (
    <main className="salao-page">
      <div className="salao-container">
        {/* Banner do Salão de Festas */}
        <section className="salao-banner">
          <div className="salao-banner-texto">
            <span className="salao-badge-topo">ÁREA COMUM · CONDOMÍNIO {condominioAtivo.nome.toUpperCase()}</span>
            <h1>Reserva do Salão de Festas</h1>
            <p>
              Agende o salão de festas para suas confraternizações e comemorações. 
              Consulte a disponibilidade de datas e horários em tempo real.
            </p>
          </div>
          <div className="salao-banner-ilustracao">
            🎉
          </div>
        </section>

        {mensagem.texto && (
          <div 
            className={`salao-alerta salao-alerta--${mensagem.tipo}`} 
            role={mensagem.tipo === 'erro' ? 'alert' : 'status'}
          >
            <span>{mensagem.tipo === 'erro' ? '⚠️' : '✓'}</span>
            <p>{mensagem.texto}</p>
          </div>
        )}

        <div className="salao-grid">
          {/* Formulário de Nova Reserva */}
          <section className="salao-card salao-card--form">
            <header className="salao-card-header">
              <h2>Novo Agendamento</h2>
              <p>Preencha a data e o intervalo de horário desejado.</p>
            </header>

            <form onSubmit={handleSubmit} className="salao-formulario">
              <div className="salao-campo">
                <label htmlFor="dataReserva">Data da Reserva</label>
                <input 
                  id="dataReserva"
                  type="date" 
                  value={dataReserva} 
                  onChange={(e) => setDataReserva(e.target.value)} 
                  min={new Date().toISOString().split('T')[0]}
                  required 
                />
              </div>

              <div className="salao-dupla-campos">
                <div className="salao-campo">
                  <label htmlFor="horarioInicio">Horário Início</label>
                  <input 
                    id="horarioInicio"
                    type="time" 
                    value={horarioInicio} 
                    onChange={(e) => setHorarioInicio(e.target.value)} 
                    required 
                  />
                </div>

                <div className="salao-campo">
                  <label htmlFor="horarioFim">Horário Término</label>
                  <input 
                    id="horarioFim"
                    type="time" 
                    value={horarioFim} 
                    onChange={(e) => setHorarioFim(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="salao-regras">
                <strong>Regras de Uso:</strong>
                <ul>
                  <li>Horário de início deve ser anterior ao término.</li>
                  <li>Cancelamentos podem ser feitos a qualquer momento pelo autor ou síndico.</li>
                  <li>O horário reservado não pode coincidir com outro agendamento ativo.</li>
                </ul>
              </div>

              <button 
                type="submit" 
                className="salao-btn-submeter" 
                disabled={processando}
              >
                {processando ? 'Confirmando Agendamento...' : 'Reservar Salão de Festas'}
              </button>
            </form>
          </section>

          {/* Listagem de Reservas Agendadas */}
          <section className="salao-card salao-card--lista">
            <header className="salao-card-header salao-header-com-filtro">
              <div>
                <h2>Agenda do Salão</h2>
                <p>Reservas registradas para o condomínio.</p>
              </div>

              <div className="salao-filtro-botoes">
                <button
                  type="button"
                  className={`btn-filtro ${filtroStatus === 'TODAS' ? 'ativo' : ''}`}
                  onClick={() => setFiltroStatus('TODAS')}
                >
                  Todas ({reservas.length})
                </button>
                <button
                  type="button"
                  className={`btn-filtro ${filtroStatus === 'CONFIRMADA' ? 'ativo' : ''}`}
                  onClick={() => setFiltroStatus('CONFIRMADA')}
                >
                  Ativas ({reservas.filter(r => r.status === 'CONFIRMADA').length})
                </button>
                <button
                  type="button"
                  className={`btn-filtro ${filtroStatus === 'CANCELADA' ? 'ativo' : ''}`}
                  onClick={() => setFiltroStatus('CANCELADA')}
                >
                  Canceladas ({reservas.filter(r => r.status === 'CANCELADA').length})
                </button>
              </div>
            </header>

            {carregando ? (
              <div className="salao-carregando">
                <p>Consultando agenda do salão de festas...</p>
              </div>
            ) : reservasFiltradas.length === 0 ? (
              <div className="salao-vazio">
                <span>🎈</span>
                <h3>Nenhuma reserva encontrada</h3>
                <p>Não há reservas {filtroStatus !== 'TODAS' ? `com status ${filtroStatus}` : 'neste condomínio'}.</p>
              </div>
            ) : (
              <div className="salao-tabela-wrapper">
                <table className="salao-tabela">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Horário</th>
                      <th>Morador / Unidade</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservasFiltradas.map((r) => {
                      const ehAutor = Number(usuarioLogado?.id) === Number(r.id_usuario);
                      const podeCancelar = (ehAutor || ehSindicoOuAdmin) && r.status === 'CONFIRMADA';

                      return (
                        <tr key={r.id} className={r.status === 'CANCELADA' ? 'linha-cancelada' : ''}>
                          <td>
                            <strong>{dataBR(r.data_reserva)}</strong>
                          </td>
                          <td>
                            <span className="horario-badge">
                              {hora(r.horario_inicio)} às {hora(r.horario_fim)}
                            </span>
                          </td>
                          <td>
                            <div className="morador-info-celula">
                              <strong>{r.usuario_nome || 'Morador'}</strong>
                              {r.unidade && (
                                <small>Unidade {r.unidade} {r.bloco ? `(Bloco ${r.bloco})` : ''}</small>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge-salao status-${r.status?.toLowerCase()}`}>
                              {r.status === 'CONFIRMADA' ? 'Confirmada' : 'Cancelada'}
                            </span>
                          </td>
                          <td>
                            {podeCancelar ? (
                              <button
                                type="button"
                                className="btn-cancelar-salao"
                                onClick={() => handleCancelar(r.id)}
                                disabled={processando}
                                title="Cancelar reserva"
                              >
                                Cancelar
                              </button>
                            ) : (
                              <span className="sem-acao">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
