import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  listarMoradoresCondominio, 
  listarBlocosCondominio, 
  criarBlocoCondominio, 
  adicionarMoradorAoCondominio, 
  definirMoradorBloco 
} from '../services/condominioApi';
import { obterPerfil } from '../services/authApi';
import './MoradoresPage.css';

export default function MoradoresPage() {
  const navigate = useNavigate();
  const perfil = obterPerfil();
  const ehAdminOuSindico = perfil === 'ADMIN' || perfil === 'SINDICO';

  const [moradores, setMoradores] = useState([]);
  const [blocos, setBlocos] = useState([]);
  const [blocoFiltro, setBlocoFiltro] = useState('');
  const [buscaNome, setBuscaNome] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  // Aba ativa: 'lista', 'adicionar', 'blocos'
  const [abaAtiva, setAbaAtiva] = useState('lista');

  // Modal para definir/editar bloco e unidade de um morador existente
  const [moradorEdicao, setMoradorEdicao] = useState(null);
  const [editaBlocoId, setEditaBlocoId] = useState('');
  const [editaUnidade, setEditaUnidade] = useState('');

  // Formulário para adicionar morador
  const [novoUsuarioId, setNovoUsuarioId] = useState('');
  const [novoBlocoId, setNovoBlocoId] = useState('');
  const [novaUnidade, setNovaUnidade] = useState('');

  // Formulário para novo bloco
  const [novoBlocoNome, setNovoBlocoNome] = useState('');

  const condoSalvo = localStorage.getItem('morada_condominio_ativo');
  const condominioAtivo = condoSalvo ? JSON.parse(condoSalvo) : null;

  const carregarDados = async () => {
    if (!condominioAtivo?.id) {
      setCarregando(false);
      return;
    }

    try {
      setCarregando(true);
      const [listaMoradores, listaBlocos] = await Promise.all([
        listarMoradoresCondominio(condominioAtivo.id, blocoFiltro || null),
        listarBlocosCondominio(condominioAtivo.id)
      ]);
      setMoradores(Array.isArray(listaMoradores) ? listaMoradores : []);
      setBlocos(Array.isArray(listaBlocos) ? listaBlocos : []);
    } catch (err) {
      console.error('Erro ao carregar dados do condomínio:', err);
      setMensagem({
        tipo: 'erro',
        texto: err.message || 'Erro ao carregar moradores e blocos do condomínio.'
      });
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [condominioAtivo?.id, blocoFiltro]);

  // Submeter novo Bloco
  const handleCriarBloco = async (e) => {
    e.preventDefault();
    if (!novoBlocoNome.trim()) return;

    setMensagem({ tipo: '', texto: '' });
    try {
      setProcessando(true);
      await criarBlocoCondominio(condominioAtivo.id, novoBlocoNome.trim());
      setMensagem({
        tipo: 'sucesso',
        texto: `Bloco "${novoBlocoNome.trim()}" criado com sucesso!`
      });
      setNovoBlocoNome('');
      await carregarDados();
    } catch (err) {
      setMensagem({
        tipo: 'erro',
        texto: err.message || 'Erro ao criar bloco.'
      });
    } finally {
      setProcessando(false);
    }
  };

  // Submeter adição de morador
  const handleAdicionarMorador = async (e) => {
    e.preventDefault();
    if (!novoUsuarioId) {
      setMensagem({ tipo: 'erro', texto: 'Informe o ID do usuário cadastrado.' });
      return;
    }

    setMensagem({ tipo: '', texto: '' });
    try {
      setProcessando(true);
      await adicionarMoradorAoCondominio(condominioAtivo.id, {
        usuarioId: Number(novoUsuarioId),
        blocoId: novoBlocoId ? Number(novoBlocoId) : null,
        unidade: novaUnidade.trim() || null
      });

      setMensagem({
        tipo: 'sucesso',
        texto: 'Morador vinculado ao condomínio com sucesso!'
      });

      setNovoUsuarioId('');
      setNovoBlocoId('');
      setNovaUnidade('');
      setAbaAtiva('lista');
      await carregarDados();
    } catch (err) {
      setMensagem({
        tipo: 'erro',
        texto: err.message || 'Erro ao vincular morador.'
      });
    } finally {
      setProcessando(false);
    }
  };

  // Abrir modal de edição de bloco/unidade
  const abrirEdicaoMorador = (m) => {
    setMoradorEdicao(m);
    setEditaBlocoId(m.id_bloco || '');
    setEditaUnidade(m.unidade || '');
  };

  // Salvar bloco e unidade do morador
  const handleSalvarEdicaoMorador = async (e) => {
    e.preventDefault();
    if (!moradorEdicao) return;

    setMensagem({ tipo: '', texto: '' });
    try {
      setProcessando(true);
      const blocoSelecionado = blocos.find((b) => Number(b.id) === Number(editaBlocoId));
      await definirMoradorBloco(condominioAtivo.id, moradorEdicao.id, {
        idBloco: editaBlocoId ? Number(editaBlocoId) : null,
        bloco: blocoSelecionado ? blocoSelecionado.nome : null,
        unidade: editaUnidade.trim() || null
      });

      setMensagem({
        tipo: 'sucesso',
        texto: `Bloco e unidade do morador ${moradorEdicao.nome} atualizados com sucesso!`
      });

      setMoradorEdicao(null);
      await carregarDados();
    } catch (err) {
      setMensagem({
        tipo: 'erro',
        texto: err.message || 'Erro ao atualizar bloco/unidade do morador.'
      });
    } finally {
      setProcessando(false);
    }
  };

  if (!condominioAtivo?.id) {
    return (
      <main className="moradores-page">
        <div className="moradores-sem-condo">
          <span>⚠️</span>
          <h2>Selecione um Condomínio</h2>
          <p>Para gerenciar moradores e blocos, selecione primeiro um condomínio ativo.</p>
          <button 
            type="button" 
            className="btn-ir-condominios"
            onClick={() => navigate('/condominios')}
          >
            Ir para Condomínios
          </button>
        </div>
      </main>
    );
  }

  const moradoresFiltrados = moradores.filter((m) => {
    const busca = buscaNome.toLowerCase();
    const nomeOk = m.nome?.toLowerCase().includes(busca);
    const emailOk = m.email?.toLowerCase().includes(busca);
    const unidadeOk = m.unidade?.toLowerCase().includes(busca);
    return nomeOk || emailOk || unidadeOk;
  });

  return (
    <main className="moradores-page">
      <div className="moradores-container">
        {/* Banner Superior */}
        <header className="moradores-banner">
          <div>
            <span className="moradores-tag">GESTÃO DE CONDÔMINOS · {condominioAtivo.nome.toUpperCase()}</span>
            <h1>Moradores & Blocos</h1>
            <p>Gerencie a distribuição de apartamentos, vincule moradores e organize os blocos residenciais.</p>
          </div>
          <div className="moradores-resumo-numeros">
            <div className="stat-card">
              <strong>{moradores.length}</strong>
              <span>Moradores</span>
            </div>
            <div className="stat-card">
              <strong>{blocos.length}</strong>
              <span>Blocos</span>
            </div>
          </div>
        </header>

        {mensagem.texto && (
          <div 
            className={`moradores-alerta moradores-alerta--${mensagem.tipo}`}
            role={mensagem.tipo === 'erro' ? 'alert' : 'status'}
          >
            <span>{mensagem.tipo === 'erro' ? '⚠️' : '✓'}</span>
            <p>{mensagem.texto}</p>
          </div>
        )}

        {/* Navegação entre Abas */}
        <div className="moradores-abas">
          <button
            type="button"
            className={`aba-btn ${abaAtiva === 'lista' ? 'ativa' : ''}`}
            onClick={() => setAbaAtiva('lista')}
          >
            👥 Lista de Moradores ({moradores.length})
          </button>
          <button
            type="button"
            className={`aba-btn ${abaAtiva === 'adicionar' ? 'ativa' : ''}`}
            onClick={() => setAbaAtiva('adicionar')}
          >
            ➕ Vincular Novo Morador
          </button>
          <button
            type="button"
            className={`aba-btn ${abaAtiva === 'blocos' ? 'ativa' : ''}`}
            onClick={() => setAbaAtiva('blocos')}
          >
            🏢 Gerenciar Blocos ({blocos.length})
          </button>
        </div>

        {/* ABA 1: LISTAGEM DE MORADORES */}
        {abaAtiva === 'lista' && (
          <section className="moradores-painel">
            <div className="moradores-filtros-bar">
              <div className="filtro-pesquisa">
                <input
                  type="text"
                  placeholder="Buscar por nome, e-mail ou unidade..."
                  value={buscaNome}
                  onChange={(e) => setBuscaNome(e.target.value)}
                />
              </div>

              <div className="filtro-bloco-select">
                <label htmlFor="selectBlocoFiltro">Filtrar Bloco:</label>
                <select
                  id="selectBlocoFiltro"
                  value={blocoFiltro}
                  onChange={(e) => setBlocoFiltro(e.target.value)}
                >
                  <option value="">Todos os Blocos</option>
                  {blocos.map((b) => (
                    <option key={b.id} value={b.id}>{b.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            {carregando ? (
              <div className="moradores-carregando">
                <p>Carregando lista de moradores...</p>
              </div>
            ) : moradoresFiltrados.length === 0 ? (
              <div className="moradores-vazio">
                <span>👤</span>
                <h3>Nenhum morador encontrado</h3>
                <p>Nenhum morador cadastrado corresponde aos filtros selecionados.</p>
              </div>
            ) : (
              <div className="moradores-tabela-responsive">
                <table className="moradores-tabela">
                  <thead>
                    <tr>
                      <th>Morador</th>
                      <th>E-mail</th>
                      <th>Bloco</th>
                      <th>Unidade</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {moradoresFiltrados.map((m) => (
                      <tr key={m.id}>
                        <td>
                          <div className="morador-nome-item">
                            <span className="morador-avatar-circulo">
                              {m.nome ? m.nome.charAt(0).toUpperCase() : 'M'}
                            </span>
                            <strong>{m.nome}</strong>
                          </div>
                        </td>
                        <td>{m.email}</td>
                        <td>
                          <span className="bloco-tag">
                            {m.bloco_nome || m.bloco || 'Sem Bloco'}
                          </span>
                        </td>
                        <td>
                          <strong>{m.unidade || 'Não informada'}</strong>
                        </td>
                        <td>
                          <span className={`status-cadastro-tag status-${m.status_cadastro?.toLowerCase()}`}>
                            {m.status_cadastro || 'APROVADO'}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-editar-bloco"
                            onClick={() => abrirEdicaoMorador(m)}
                            title="Alterar Bloco / Unidade"
                          >
                            ✏️ Editar Unidade
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ABA 2: VINCULAR NOVO MORADOR */}
        {abaAtiva === 'adicionar' && (
          <section className="moradores-painel painel-formulario-adicionar">
            <h2>Vincular Morador ao Condomínio</h2>
            <p>Atribua um usuário já cadastrado na plataforma ao condomínio selecionado.</p>

            <form onSubmit={handleAdicionarMorador} className="form-adicionar-morador">
              <div className="campo-form">
                <label htmlFor="novoUsuarioId">ID do Usuário Cadastrado *</label>
                <input
                  id="novoUsuarioId"
                  type="number"
                  min="1"
                  placeholder="Ex: 5"
                  value={novoUsuarioId}
                  onChange={(e) => setNovoUsuarioId(e.target.value)}
                  required
                />
                <small>Identificador numérico do usuário existente no sistema.</small>
              </div>

              <div className="dupla-campos-form">
                <div className="campo-form">
                  <label htmlFor="novoBlocoId">Bloco (Opcional)</label>
                  <select
                    id="novoBlocoId"
                    value={novoBlocoId}
                    onChange={(e) => setNovoBlocoId(e.target.value)}
                  >
                    <option value="">Selecione um bloco...</option>
                    {blocos.map((b) => (
                      <option key={b.id} value={b.id}>{b.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="campo-form">
                  <label htmlFor="novaUnidade">Unidade / Apto (Opcional)</label>
                  <input
                    id="novaUnidade"
                    type="text"
                    placeholder="Ex: Apto 101"
                    value={novaUnidade}
                    onChange={(e) => setNovaUnidade(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-confirmar-adicao"
                disabled={processando}
              >
                {processando ? 'Vinculando Morador...' : 'Confirmar Vínculo'}
              </button>
            </form>
          </section>
        )}

        {/* ABA 3: GERENCIAR BLOCOS */}
        {abaAtiva === 'blocos' && (
          <section className="moradores-painel painel-blocos-grid">
            <div className="painel-criar-bloco">
              <h2>Adicionar Novo Bloco</h2>
              <p>Cadastre torres, blocos ou alas deste condomínio.</p>

              <form onSubmit={handleCriarBloco} className="form-novo-bloco">
                <div className="campo-form">
                  <label htmlFor="novoBlocoNome">Nome do Bloco *</label>
                  <input
                    id="novoBlocoNome"
                    type="text"
                    placeholder="Ex: Bloco A, Torre Sul, Ala 1..."
                    value={novoBlocoNome}
                    onChange={(e) => setNovoBlocoNome(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn-salvar-bloco"
                  disabled={processando}
                >
                  {processando ? 'Criando Bloco...' : 'Criar Bloco'}
                </button>
              </form>
            </div>

            <div className="painel-lista-blocos">
              <h2>Blocos Cadastrados</h2>
              {blocos.length === 0 ? (
                <div className="blocos-vazio">
                  <span>🏢</span>
                  <p>Nenhum bloco cadastrado ainda neste condomínio.</p>
                </div>
              ) : (
                <div className="cards-blocos-grid">
                  {blocos.map((b) => {
                    const moradoresNoBloco = moradores.filter(
                      (m) => Number(m.id_bloco) === Number(b.id) || m.bloco === b.nome
                    ).length;

                    return (
                      <div key={b.id} className="card-bloco-item">
                        <span className="bloco-icon-card">🏢</span>
                        <div className="bloco-info-card">
                          <h3>{b.nome}</h3>
                          <span>{moradoresNoBloco} moradores vinculados</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* MODAL / OVERLAY DE EDIÇÃO DE BLOCO E UNIDADE */}
        {moradorEdicao && (
          <div className="modal-overlay" onClick={() => setMoradorEdicao(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <header className="modal-header">
                <h3>Editar Unidade do Morador</h3>
                <button 
                  type="button" 
                  className="btn-fechar-modal"
                  onClick={() => setMoradorEdicao(null)}
                >
                  ✕
                </button>
              </header>

              <p className="modal-morador-sub">
                Atualizando dados para <strong>{moradorEdicao.nome}</strong> ({moradorEdicao.email}).
              </p>

              <form onSubmit={handleSalvarEdicaoMorador} className="form-modal-edicao">
                <div className="campo-form">
                  <label htmlFor="editaBlocoId">Bloco</label>
                  <select
                    id="editaBlocoId"
                    value={editaBlocoId}
                    onChange={(e) => setEditaBlocoId(e.target.value)}
                  >
                    <option value="">Sem bloco (Geral)</option>
                    {blocos.map((b) => (
                      <option key={b.id} value={b.id}>{b.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="campo-form">
                  <label htmlFor="editaUnidade">Unidade / Apartamento</label>
                  <input
                    id="editaUnidade"
                    type="text"
                    placeholder="Ex: 302B"
                    value={editaUnidade}
                    onChange={(e) => setEditaUnidade(e.target.value)}
                  />
                </div>

                <div className="modal-acoes">
                  <button
                    type="button"
                    className="btn-cancelar-modal"
                    onClick={() => setMoradorEdicao(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-salvar-modal"
                    disabled={processando}
                  >
                    {processando ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
