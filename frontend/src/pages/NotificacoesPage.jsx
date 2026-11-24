import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarNotificacoes, publicarNotificacao, marcarNotificacaoComoLida } from '../services/notificacaoApi';
import { assinarNotificacoes } from '../services/socketService';
import './NotificacoesPage.css';

function decodificarToken(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function ehNotificacaoCobranca(aviso) {
  if (!aviso) return false;
  const texto = `${aviso.titulo || ''} ${aviso.mensagem || aviso.descricao || ''}`.toLowerCase();
  return (
    texto.includes('cobrança') ||
    texto.includes('cobranca') ||
    texto.includes('taxa condominial') ||
    texto.includes('fatura') ||
    texto.includes('boleto') ||
    texto.includes('inadimpl') ||
    texto.includes('pendente') ||
    texto.includes('em aberto') ||
    (aviso.tipo === 'URGENTE' && (texto.includes('pagamento') || texto.includes('valor')))
  );
}

export default function NotificacoesPage() {
  const navigate = useNavigate();
  const [avisos, setAvisos] = useState([]);
  const [condominios, setCondominios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [alertaTempoReal, setAlertaTempoReal] = useState(null);

  // Aba selecionada: 'TODAS' | 'COBRANCAS' | 'NAO_LIDAS' | 'COMUNICADOS'
  const [abaAtiva, setAbaAtiva] = useState('TODAS');

  // Formulário de publicação (para Síndico/Admin)
  const [mostrarForm, setMostrarForm] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaMensagem, setNovaMensagem] = useState('');
  const [novoTipo, setNovoTipo] = useState('AVISO');
  const [novoEscopo, setNovoEscopo] = useState('CONDOMINIO');
  const [novoCondominioId, setNovoCondominioId] = useState('');

  // Filtro na visualização dos avisos
  const [filtroCondominio, setFiltroCondominio] = useState('TODOS');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');

  // Carrega os condomínios cadastrados
  const carregarCondominios = async () => {
    try {
      const res = await fetch('http://localhost:3000/condominios');
      if (res.ok) {
        const dados = await res.json();
        const lista = Array.isArray(dados) ? dados : [];
        setCondominios(lista);

        const token = localStorage.getItem('morada_token');
        const tokenData = token ? decodificarToken(token) : null;
        if (tokenData && tokenData.id_condominio) {
          setNovoCondominioId(String(tokenData.id_condominio));
        } else if (lista.length > 0) {
          setNovoCondominioId(String(lista[0].id));
        }
      }
    } catch (err) {
      console.error('Erro ao buscar lista de condomínios:', err);
    }
  };

  // Carrega as notificações do banco de dados ao abrir a página
  const carregarAvisos = async () => {
    try {
      setLoading(true);
      const dados = await listarNotificacoes();
      setAvisos(Array.isArray(dados) ? dados : []);
      setErro('');
    } catch (err) {
      setErro(err.message || 'Erro ao carregar avisos do servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarCondominios();
    carregarAvisos();
  }, []);

  // Assinatura do Socket.IO para receber notificações em tempo real
  useEffect(() => {
    const cancelarAssinatura = assinarNotificacoes((nova) => {
      setAvisos((prev) => {
        if (prev.some((a) => a.id === nova.id)) return prev;
        return [nova, ...prev];
      });

      const cobranca = ehNotificacaoCobranca(nova);
      setAlertaTempoReal({
        id: nova.id,
        titulo: nova.titulo,
        mensagem: nova.mensagem,
        ehCobranca: cobranca
      });

      // Se for notificação de cobrança pendente, muda automaticamente para a aba de cobranças
      if (cobranca) {
        setAbaAtiva('COBRANCAS');
      }

      setTimeout(() => {
        setAlertaTempoReal(null);
      }, 9000);
    });

    return () => {
      cancelarAssinatura();
    };
  }, []);

  // Publica novo aviso no backend
  const handleCriarAviso = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (!novoTitulo.trim() || !novaMensagem.trim()) {
      setErro('Preencha o título e a descrição do comunicado.');
      return;
    }

    if (novoEscopo === 'CONDOMINIO' && (!novoCondominioId || Number(novoCondominioId) <= 0)) {
      setErro('Por favor, selecione ou informe um condomínio válido.');
      return;
    }

    try {
      setEnviando(true);

      const payload = {
        titulo: novoTitulo.trim(),
        mensagem: novaMensagem.trim(),
        tipo: novoTipo,
        escopo: novoEscopo,
        condominio_id: novoEscopo === 'CONDOMINIO' ? Number(novoCondominioId) : null
      };

      await publicarNotificacao(payload);

      setSucesso('Comunicado publicado com sucesso!');
      setNovoTitulo('');
      setNovaMensagem('');
      setNovoTipo('AVISO');
      setMostrarForm(false);

      await carregarAvisos();
    } catch (err) {
      setErro(err.message || 'Erro ao publicar aviso.');
    } finally {
      setEnviando(false);
    }
  };

  const obterNomeCondominio = (idCondo) => {
    if (!idCondo) return null;
    const condo = condominios.find((c) => String(c.id) === String(idCondo));
    return condo ? condo.nome : `Condomínio #${idCondo}`;
  };

  const handleMarcarLida = async (id) => {
    try {
      await marcarNotificacaoComoLida(id);
      setAvisos((prev) =>
        prev.map((a) =>
          (a.id === id || a.idNotificacao === id) ? { ...a, lida: true } : a
        )
      );
    } catch (err) {
      setErro(err.message || 'Erro ao marcar notificação como lida.');
    }
  };

  // Contadores para as abas
  const totalCobrancas = avisos.filter(ehNotificacaoCobranca).length;
  const totalNaoLidas = avisos.filter((a) => !a.lida).length;
  const totalComunicados = avisos.filter((a) => !ehNotificacaoCobranca(a)).length;

  // Filtragem dos avisos por condomínio, tipo e aba ativa
  const avisosFiltrados = avisos.filter((aviso) => {
    // Filtro da Aba
    if (abaAtiva === 'COBRANCAS' && !ehNotificacaoCobranca(aviso)) {
      return false;
    }
    if (abaAtiva === 'NAO_LIDAS' && aviso.lida) {
      return false;
    }
    if (abaAtiva === 'COMUNICADOS' && ehNotificacaoCobranca(aviso)) {
      return false;
    }

    // Filtro por Condomínio
    if (filtroCondominio !== 'TODOS') {
      if (filtroCondominio === 'PLATAFORMA') {
        if (aviso.escopo !== 'PLATAFORMA') return false;
      } else {
        if (String(aviso.condominio_id) !== String(filtroCondominio)) return false;
      }
    }

    // Filtro por Tipo
    if (filtroTipo !== 'TODOS') {
      if (aviso.tipo !== filtroTipo) return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="notificacoes-container">
        <p>Carregando notificações e avisos...</p>
      </div>
    );
  }

  return (
    <div className="notificacoes-container">
      {/* Alerta em tempo real via Socket.IO */}
      {alertaTempoReal && (
        <div className={`alerta-socket-banner ${alertaTempoReal.ehCobranca ? 'cobranca' : ''}`}>
          <div className="alerta-socket-conteudo">
            <span className="alerta-socket-icone">
              {alertaTempoReal.ehCobranca ? '💳' : '🔔'}
            </span>
            <div>
              <strong>Nova notificação recebida em tempo real via WebSocket:</strong>
              <p>{alertaTempoReal.titulo}</p>
            </div>
          </div>
          {alertaTempoReal.ehCobranca && (
            <button
              type="button"
              className="btn-ir-boletos"
              onClick={() => navigate('/meus-boletos')}
            >
              Ver Meus Boletos →
            </button>
          )}
          <button 
            type="button" 
            className="btn-fechar-alerta-socket"
            onClick={() => setAlertaTempoReal(null)}
          >
            ✕
          </button>
        </div>
      )}

      <div className="notificacoes-header">
        <div>
          <h2>Central de Notificações & Avisos</h2>
          <span className="notificacoes-subtitulo">
            Acompanhe comunicados, notificações de cobrança e avisos do condomínio em tempo real
          </span>
        </div>
        <button
          type="button"
          className="btn-novo-aviso"
          onClick={() => {
            setMostrarForm(!mostrarForm);
            setErro('');
            setSucesso('');
          }}
        >
          {mostrarForm ? 'Cancelar' : '+ Novo Aviso'}
        </button>
      </div>

      {erro && <div className="notificacao-alerta erro">{erro}</div>}
      {sucesso && <div className="notificacao-alerta sucesso">{sucesso}</div>}

      {/* Abas Principais de Notificações */}
      <div className="abas-notificacoes-container">
        <button
          type="button"
          className={`aba-item ${abaAtiva === 'TODAS' ? 'ativa' : ''}`}
          onClick={() => setAbaAtiva('TODAS')}
        >
          <span className="aba-icone">📋</span>
          <span>Todas</span>
          <span className="aba-contador">{avisos.length}</span>
        </button>

        <button
          type="button"
          className={`aba-item aba-cobrancas ${abaAtiva === 'COBRANCAS' ? 'ativa' : ''}`}
          onClick={() => setAbaAtiva('COBRANCAS')}
        >
          <span className="aba-icone">💳</span>
          <span>Contas & Cobranças</span>
          {totalCobrancas > 0 && (
            <span className="aba-contador contador-cobranca">{totalCobrancas}</span>
          )}
        </button>

        <button
          type="button"
          className={`aba-item ${abaAtiva === 'NAO_LIDAS' ? 'ativa' : ''}`}
          onClick={() => setAbaAtiva('NAO_LIDAS')}
        >
          <span className="aba-icone">🔔</span>
          <span>Não Lidas</span>
          {totalNaoLidas > 0 && (
            <span className="aba-contador contador-nao-lidas">{totalNaoLidas}</span>
          )}
        </button>

        <button
          type="button"
          className={`aba-item ${abaAtiva === 'COMUNICADOS' ? 'ativa' : ''}`}
          onClick={() => setAbaAtiva('COMUNICADOS')}
        >
          <span className="aba-icone">📢</span>
          <span>Comunicados Gerais</span>
          <span className="aba-contador">{totalComunicados}</span>
        </button>
      </div>

      {mostrarForm && (
        <form className="form-aviso" onSubmit={handleCriarAviso}>
          <h3>Publicar Novo Comunicado</h3>

          <div className="form-aviso-linha">
            <div className="form-aviso-campo">
              <label htmlFor="campo-escopo">Escopo do Comunicado</label>
              <select
                id="campo-escopo"
                value={novoEscopo}
                onChange={(e) => setNovoEscopo(e.target.value)}
              >
                <option value="CONDOMINIO">Condomínio Específico</option>
                <option value="PLATAFORMA">Toda a Plataforma (Geral)</option>
              </select>
            </div>

            {novoEscopo === 'CONDOMINIO' && (
              <div className="form-aviso-campo">
                <label htmlFor="campo-condominio">Condomínio Destino</label>
                {condominios.length > 0 ? (
                  <select
                    id="campo-condominio"
                    value={novoCondominioId}
                    onChange={(e) => setNovoCondominioId(e.target.value)}
                    required
                  >
                    <option value="">Selecione um condomínio...</option>
                    {condominios.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} (ID: {c.id})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="campo-condominio"
                    type="number"
                    min="1"
                    placeholder="ID do condomínio"
                    value={novoCondominioId}
                    onChange={(e) => setNovoCondominioId(e.target.value)}
                    required
                  />
                )}
              </div>
            )}

            <div className="form-aviso-campo">
              <label htmlFor="campo-tipo">Tipo de Notificação</label>
              <select
                id="campo-tipo"
                value={novoTipo}
                onChange={(e) => setNovoTipo(e.target.value)}
              >
                <option value="AVISO">Aviso Geral</option>
                <option value="MANUTENCAO">Manutenção</option>
                <option value="URGENTE">Urgente / Cobrança</option>
              </select>
            </div>
          </div>

          <div className="form-aviso-campo">
            <label htmlFor="campo-titulo">Título</label>
            <input
              id="campo-titulo"
              type="text"
              maxLength={150}
              placeholder="Ex: Interrupção temporária de água no Bloco B"
              value={novoTitulo}
              onChange={(e) => setNovoTitulo(e.target.value)}
              required
            />
          </div>

          <div className="form-aviso-campo">
            <label htmlFor="campo-mensagem">Descrição</label>
            <textarea
              id="campo-mensagem"
              placeholder="Descreva detalhadamente o comunicado para os moradores..."
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-novo-aviso" disabled={enviando}>
            {enviando ? 'Publicando...' : 'Publicar Comunicado'}
          </button>
        </form>
      )}

      {/* Barra de Filtros Complementares */}
      <div className="filtros-avisos-bar">
        <div className="filtro-item">
          <label htmlFor="filtro-condo">Condomínio:</label>
          <select
            id="filtro-condo"
            value={filtroCondominio}
            onChange={(e) => setFiltroCondominio(e.target.value)}
          >
            <option value="TODOS">Todos os Condomínios</option>
            <option value="PLATAFORMA">Plataforma Global</option>
            {condominios.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="filtro-item">
          <label htmlFor="filtro-tipo-select">Classificação:</label>
          <select
            id="filtro-tipo-select"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
          >
            <option value="TODOS">Todos os tipos</option>
            <option value="AVISO">Avisos</option>
            <option value="MANUTENCAO">Manutenções</option>
            <option value="URGENTE">Urgentes / Cobranças</option>
          </select>
        </div>
      </div>

      {/* Lista de Notificações com Destaque de Contas Pendentes */}
      <div className="lista-avisos">
        {avisosFiltrados.length === 0 ? (
          <div className="painel-sem-avisos">
            <span className="icone-vazio">
              {abaAtiva === 'COBRANCAS' ? '✅' : '📭'}
            </span>
            <h3>
              {abaAtiva === 'COBRANCAS'
                ? 'Nenhuma notificação de conta pendente encontrada'
                : 'Nenhum aviso encontrado'}
            </h3>
            <p>
              {abaAtiva === 'COBRANCAS'
                ? 'Suas taxas condominiais estão em dia ou não há notificações de cobrança pendente para você.'
                : 'Não há avisos para os filtros selecionados no momento.'}
            </p>
          </div>
        ) : (
          avisosFiltrados.map((aviso) => {
            const ehCobranca = ehNotificacaoCobranca(aviso);
            const tipoClasse = (aviso.tipo || 'AVISO').toLowerCase();
            const nomeCondo = obterNomeCondominio(aviso.condominio_id);

            return (
              <div
                key={aviso.id || aviso.idNotificacao}
                className={`card-aviso card-aviso-${tipoClasse} ${ehCobranca ? 'card-aviso-cobranca' : ''}`}
              >
                <div className="card-aviso-top">
                  <div className="card-aviso-badges">
                    {ehCobranca ? (
                      <span className="badge-tag badge-cobranca-destaque">
                        ⚠️ Pendência Financeira
                      </span>
                    ) : (
                      <span className={`badge-tag badge-tipo badge-${tipoClasse}`}>
                        {aviso.tipo || 'AVISO'}
                      </span>
                    )}

                    {aviso.escopo === 'PLATAFORMA' ? (
                      <span className="badge-tag badge-escopo-plataforma">
                        🌐 Plataforma Global
                      </span>
                    ) : (
                      <span className="badge-tag badge-condominio">
                        🏢 {nomeCondo || (aviso.condominio_id ? `Condomínio #${aviso.condominio_id}` : 'Condomínio')}
                      </span>
                    )}

                    {typeof aviso.lida !== 'undefined' && (
                      <span
                        className={`badge-tag ${
                          aviso.lida ? 'badge-lida' : 'badge-nao-lida'
                        }`}
                      >
                        {aviso.lida ? '✓ Lida' : '● Nova'}
                      </span>
                    )}
                  </div>

                  <span className="card-aviso-data">
                    {aviso.criado_em || aviso.created_at || aviso.data
                      ? new Date(
                          aviso.criado_em || aviso.created_at || aviso.data
                        ).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : ''}
                  </span>
                </div>

                <div className="card-aviso-header">
                  <h4 className="card-aviso-titulo">{aviso.titulo}</h4>
                </div>

                <p className="card-aviso-mensagem">
                  {aviso.mensagem || aviso.descricao}
                </p>

                <div className="card-aviso-rodape-acoes">
                  {ehCobranca && (
                    <button
                      type="button"
                      className="btn-ir-boletos"
                      onClick={() => navigate('/meus-boletos')}
                    >
                      💳 Ver e Pagar Boletos Pendentes →
                    </button>
                  )}

                  {!aviso.lida && (
                    <button
                      type="button"
                      className="btn-marcar-lida"
                      onClick={() => handleMarcarLida(aviso.id || aviso.idNotificacao)}
                    >
                      ✓ Marcar como lida
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
