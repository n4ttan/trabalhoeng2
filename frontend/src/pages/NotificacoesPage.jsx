import React, { useEffect, useState } from 'react';
import { listarNotificacoes, publicarNotificacao } from '../services/notificacaoApi';
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

export default function NotificacoesPage() {
  const [avisos, setAvisos] = useState([]);
  const [condominios, setCondominios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Formulário de publicação
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

        // Se o usuário tiver um condomínio padrão no token, usa ele; senão o primeiro da lista
        const token = localStorage.getItem('morada_token');
        const tokenData = token ? decodificarToken(token) : null;
        if (tokenData && tokenData.condominio) {
          setNovoCondominioId(String(tokenData.condominio));
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

  // Publica novo aviso no backend com tratamento para múltiplos condomínios
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

      // Atualiza a lista com o novo aviso
      await carregarAvisos();
    } catch (err) {
      setErro(err.message || 'Erro ao publicar aviso.');
    } finally {
      setEnviando(false);
    }
  };

  // Mapeia id do condomínio para o nome legível
  const obterNomeCondominio = (idCondo) => {
    if (!idCondo) return null;
    const condo = condominios.find((c) => String(c.id) === String(idCondo));
    return condo ? condo.nome : `Condomínio #${idCondo}`;
  };

  // Filtragem dos avisos
  const avisosFiltrados = avisos.filter((aviso) => {
    if (filtroCondominio !== 'TODOS') {
      if (filtroCondominio === 'PLATAFORMA') {
        if (aviso.escopo !== 'PLATAFORMA') return false;
      } else {
        if (String(aviso.condominio_id) !== String(filtroCondominio)) return false;
      }
    }

    if (filtroTipo !== 'TODOS') {
      if (aviso.tipo !== filtroTipo) return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="notificacoes-container">
        <p>Carregando avisos...</p>
      </div>
    );
  }

  return (
    <div className="notificacoes-container">
      <div className="notificacoes-header">
        <div>
          <h2>Mural de Avisos e Notificações</h2>
          <span className="notificacoes-subtitulo">
            Gerenciamento e comunicados por condomínio
          </span>
        </div>
        <button
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
                <option value="URGENTE">Urgente</option>
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

      {/* Barra de Filtros */}
      <div className="filtros-avisos-bar">
        <div className="filtro-item">
          <label htmlFor="filtro-condo">Filtrar por Condomínio:</label>
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
          <label htmlFor="filtro-tipo-select">Filtrar por Tipo:</label>
          <select
            id="filtro-tipo-select"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
          >
            <option value="TODOS">Todos os tipos</option>
            <option value="AVISO">Avisos</option>
            <option value="MANUTENCAO">Manutenções</option>
            <option value="URGENTE">Urgentes</option>
          </select>
        </div>
      </div>

      {/* Lista de Notificações com as Caixas de Mostragem Atualizadas */}
      <div className="lista-avisos">
        {avisosFiltrados.length === 0 ? (
          <p className="nenhum-aviso">Nenhum aviso encontrado para os critérios selecionados.</p>
        ) : (
          avisosFiltrados.map((aviso) => {
            const tipoClasse = (aviso.tipo || 'AVISO').toLowerCase();
            const nomeCondo = obterNomeCondominio(aviso.condominio_id);

            return (
              <div
                key={aviso.id || aviso.idNotificacao}
                className={`card-aviso card-aviso-${tipoClasse}`}
              >
                <div className="card-aviso-top">
                  <div className="card-aviso-badges">
                    <span className={`badge-tag badge-tipo badge-${tipoClasse}`}>
                      {aviso.tipo || 'AVISO'}
                    </span>

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
                        {aviso.lida ? 'Lida' : 'Nova'}
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
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
