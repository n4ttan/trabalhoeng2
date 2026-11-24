import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  autorizarVisitante,
  obterMeusVisitantes,
  cancelarVisitante,
  obterVisitantesCondominio,
  registrarEntradaVisitante,
  registrarSaidaVisitante
} from '../services/visitanteApi';
import { obterPerfil } from '../services/authApi';
import './VisitantesPage.css';

const dataHoraBR = (v) => (v ? new Date(v).toLocaleString('pt-BR') : '-');

export default function VisitantesPage() {
  const navigate = useNavigate();
  const [visitantes, setVisitantes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });
  const [form, setForm] = useState({ nome_visitante: '', documento: '', data_prevista: '', validade_ate: '' });

  const perfil = obterPerfil();
  const ehPortaria = perfil === 'SINDICO' || perfil === 'ADMIN';

  const condoSalvo = localStorage.getItem('morada_condominio_ativo');
  const condominioAtivo = condoSalvo ? JSON.parse(condoSalvo) : null;
  const idCondominio = condominioAtivo?.id;

  const carregar = async () => {
    if (!idCondominio) {
      setCarregando(false);
      return;
    }
    try {
      setCarregando(true);
      const data = await (ehPortaria ? obterVisitantesCondominio(idCondominio) : obterMeusVisitantes(idCondominio));
      setVisitantes(Array.isArray(data) ? data : []);
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.message || 'Erro ao carregar visitantes.' });
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [idCondominio]);

  const executar = async (acao, sucesso, confirmacao) => {
    if (confirmacao && !window.confirm(confirmacao)) return;
    setMensagem({ tipo: '', texto: '' });
    try {
      setProcessando(true);
      await acao();
      setMensagem({ tipo: 'sucesso', texto: sucesso });
      await carregar();
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.message || 'Não foi possível concluir a operação.' });
    } finally {
      setProcessando(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.validade_ate < form.data_prevista) {
      setMensagem({ tipo: 'erro', texto: 'A validade deve ser posterior à data prevista.' });
      return;
    }
    await executar(async () => {
      await autorizarVisitante(idCondominio, form);
      setForm({ nome_visitante: '', documento: '', data_prevista: '', validade_ate: '' });
    }, 'Visitante pré-autorizado com sucesso!');
  };

  const campo = (nome) => ({
    value: form[nome],
    onChange: (e) => setForm({ ...form, [nome]: e.target.value })
  });

  if (!idCondominio) {
    return (
      <main className="visitantes-page">
        <div className="visitantes-card">
          <h2>Nenhum Condomínio Selecionado</h2>
          <p>Selecione primeiro o seu condomínio para gerenciar visitantes.</p>
          <button type="button" onClick={() => navigate('/condominios')}>Ir para Seleção de Condomínios</button>
        </div>
      </main>
    );
  }

  return (
    <main className="visitantes-page">
      <div className="visitantes-container">
        <h1>{ehPortaria ? 'Portaria: Visitantes' : 'Pré-autorização de Visitantes'}</h1>

        {mensagem.texto && (
          <div className={`visitantes-alerta visitantes-alerta--${mensagem.tipo}`} role={mensagem.tipo === 'erro' ? 'alert' : 'status'}>
            {mensagem.texto}
          </div>
        )}

        {!ehPortaria && (
          <section className="visitantes-card">
            <h2>Nova autorização</h2>
            <form onSubmit={handleSubmit} className="visitantes-form">
              <label htmlFor="nome_visitante">Nome do visitante</label>
              <input id="nome_visitante" type="text" maxLength={150} required {...campo('nome_visitante')} />

              <label htmlFor="documento">Documento</label>
              <input id="documento" type="text" maxLength={30} required {...campo('documento')} />

              <label htmlFor="data_prevista">Data e hora prevista</label>
              <input id="data_prevista" type="datetime-local" required {...campo('data_prevista')} />

              <label htmlFor="validade_ate">Válida até</label>
              <input id="validade_ate" type="datetime-local" required {...campo('validade_ate')} />

              <button type="submit" disabled={processando}>Autorizar visitante</button>
            </form>
          </section>
        )}

        <section className="visitantes-card">
          <h2>{ehPortaria ? 'Autorizações do condomínio' : 'Minhas autorizações'}</h2>
          {carregando ? (
            <p>Carregando...</p>
          ) : visitantes.length === 0 ? (
            <p>Nenhuma autorização encontrada.</p>
          ) : (
            <table className="visitantes-tabela">
              <thead>
                <tr>
                  <th>Visitante</th>
                  <th>Documento</th>
                  {ehPortaria && <th>Morador</th>}
                  <th>Previsto</th>
                  <th>Válido até</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {visitantes.map((v) => (
                  <tr key={v.id}>
                    <td>{v.nome_visitante}</td>
                    <td>{v.documento}</td>
                    {ehPortaria && <td>{v.usuario_nome}{v.bloco ? ` · ${v.bloco}` : ''}{v.unidade ? ` ${v.unidade}` : ''}</td>}
                    <td>{dataHoraBR(v.data_prevista)}</td>
                    <td>{dataHoraBR(v.validade_ate)}</td>
                    <td><span className={`visitantes-status visitantes-status--${v.status}`}>{v.status}</span></td>
                    <td>
                      {!ehPortaria && v.status === 'AUTORIZADO' && (
                        <button type="button" disabled={processando}
                          onClick={() => executar(() => cancelarVisitante(idCondominio, v.id), 'Autorização cancelada.', 'Cancelar esta autorização?')}>
                          Cancelar
                        </button>
                      )}
                      {ehPortaria && v.status === 'AUTORIZADO' && (
                        <button type="button" disabled={processando}
                          onClick={() => executar(() => registrarEntradaVisitante(idCondominio, v.id), 'Entrada registrada.')}>
                          Registrar entrada
                        </button>
                      )}
                      {ehPortaria && v.status === 'ENTROU' && (
                        <button type="button" disabled={processando}
                          onClick={() => executar(() => registrarSaidaVisitante(idCondominio, v.id), 'Saída registrada.')}>
                          Registrar saída
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </main>
  );
}
