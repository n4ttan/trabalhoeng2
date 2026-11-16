import React, { useEffect, useState } from 'react';
import {
  listarCondominios,
  listarBlocosCondominio
} from '../services/condominioApi';
import {
  listarGerenciamentosUsuario,
  atribuirGerenciamento,
  removerGerenciamento
} from '../services/gerenciamentoApi';
import './GerenciamentoPage.css';

export default function GerenciamentoPage() {
  const [condominios, setCondominios] = useState([]);
  const [blocos, setBlocos] = useState([]);

  const [usuarioId, setUsuarioId] = useState('');
  const [usuarioConsultado, setUsuarioConsultado] = useState('');
  const [gerenciamentos, setGerenciamentos] = useState([]);

  // Formulário de nova atribuição
  const [condominioSelecionado, setCondominioSelecionado] = useState('');
  const [blocoSelecionado, setBlocoSelecionado] = useState('');
  const [listaParaAtribuir, setListaParaAtribuir] = useState([]);

  const [carregandoLista, setCarregandoLista] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarCondominios();
  }, []);

  const carregarCondominios = async () => {
    try {
      const dados = await listarCondominios();
      setCondominios(Array.isArray(dados) ? dados : []);
    } catch (err) {
      setErro('Erro ao carregar lista de condomínios.');
    }
  };

  const handleSelecionarCondominio = async (idCond) => {
    setCondominioSelecionado(idCond);
    setBlocoSelecionado('');
    setBlocos([]);
    if (!idCond) return;

    try {
      const dadosBlocos = await listarBlocosCondominio(idCond);
      setBlocos(Array.isArray(dadosBlocos) ? dadosBlocos : []);
    } catch {
      setBlocos([]);
    }
  };

  const buscarGerenciamentos = async (idParaBuscar) => {
    const idNum = Number(idParaBuscar);
    if (!idNum || idNum <= 0) {
      setErro('Informe um ID de usuário válido.');
      return;
    }

    setCarregandoLista(true);
    setErro('');
    setMensagem('');
    try {
      const dados = await listarGerenciamentosUsuario(idNum);
      setGerenciamentos(Array.isArray(dados) ? dados : []);
      setUsuarioConsultado(String(idNum));
    } catch (err) {
      setGerenciamentos([]);
      setErro(
        err.response?.data?.erro ||
          'Erro ao consultar gerenciamentos do usuário.'
      );
    } finally {
      setCarregandoLista(false);
    }
  };

  const handleBuscarSubmit = (e) => {
    e.preventDefault();
    buscarGerenciamentos(usuarioId);
  };

  const adicionarItemNaFila = () => {
    setErro('');
    if (!condominioSelecionado) {
      setErro('Selecione um condomínio antes de adicionar.');
      return;
    }

    const condId = Number(condominioSelecionado);
    const blocoId = blocoSelecionado ? Number(blocoSelecionado) : null;

    const jaExiste = listaParaAtribuir.some(
      (item) => item.condominioId === condId && item.blocoId === blocoId
    );
    if (jaExiste) {
      setErro('Essa combinação de condomínio/bloco já está na lista.');
      return;
    }

    const condoObj = condominios.find((c) => Number(c.id) === condId);
    const blocoObj = blocos.find((b) => Number(b.id) === blocoId);

    setListaParaAtribuir((prev) => [
      ...prev,
      {
        condominioId: condId,
        condominioNome: condoObj ? condoObj.nome : `Condomínio #${condId}`,
        blocoId,
        blocoNome: blocoObj ? blocoObj.nome : 'Condomínio inteiro'
      }
    ]);
    setBlocoSelecionado('');
  };

  const removerItemDaFila = (index) => {
    setListaParaAtribuir((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleConfirmarAtribuicao = async () => {
    const alvoUserId = Number(usuarioConsultado || usuarioId);
    if (!alvoUserId) {
      setErro('Informe o ID do síndico ou administrador.');
      return;
    }
    if (listaParaAtribuir.length === 0) {
      setErro('Adicione pelo menos um condomínio/bloco na lista para atribuir.');
      return;
    }

    setSalvando(true);
    setErro('');
    setMensagem('');
    try {
      const payload = listaParaAtribuir.map(({ condominioId, blocoId }) => ({
        condominioId,
        blocoId
      }));
      const resp = await atribuirGerenciamento(alvoUserId, payload);
      setMensagem(resp.mensagem || 'Gerenciamento atribuído com sucesso!');
      setListaParaAtribuir([]);
      await buscarGerenciamentos(alvoUserId);
    } catch (err) {
      setErro(
        err.response?.data?.erro ||
          'Não foi possível atribuir o gerenciamento.'
      );
    } finally {
      setSalvando(false);
    }
  };

  const handleDesassociar = async (gerenciamentoId) => {
    const alvoUserId = Number(usuarioConsultado || usuarioId);
    if (!alvoUserId || !gerenciamentoId) return;

    setErro('');
    setMensagem('');
    try {
      const resp = await removerGerenciamento(alvoUserId, gerenciamentoId);
      setMensagem(resp.mensagem || 'Gerenciamento removido com sucesso.');
      await buscarGerenciamentos(alvoUserId);
    } catch (err) {
      setErro(
        err.response?.data?.erro ||
          'Erro ao desassociar gerenciamento.'
      );
    }
  };

  return (
    <div className="gerenciamento-container">
      <div className="gerenciamento-header">
        <span className="gerenciamento-tag">ADMINISTRAÇÃO</span>
        <h2>Atribuir e Gerenciar Vínculos de Síndicos</h2>
        <p className="gerenciamento-sub">
          Associe ou desassocie condomínios e blocos específicos para síndicos e administradores.
        </p>
      </div>

      {erro && <div className="gerenciamento-alerta erro">⚠ {erro}</div>}
      {mensagem && (
        <div className="gerenciamento-alerta sucesso">✓ {mensagem}</div>
      )}

      {/* Card 1: Buscar Gestor */}
      <section className="gerenciamento-card">
        <h3>1. Selecionar Gestor (Síndico / Admin)</h3>
        <form className="busca-gestor-form" onSubmit={handleBuscarSubmit}>
          <input
            type="number"
            min="1"
            placeholder="Digite o ID do usuário gestor"
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
            required
          />
          <button type="submit" disabled={carregandoLista}>
            {carregandoLista ? 'Buscando...' : 'Carregar Vínculos'}
          </button>
        </form>
      </section>

      {/* Card 2: Atribuir Novos Condomínios / Blocos */}
      <section className="gerenciamento-card">
        <h3>2. Atribuir Condomínios e Blocos</h3>
        <div className="atribuicao-grid">
          <div className="campo-grupo">
            <label>Condomínio</label>
            <select
              value={condominioSelecionado}
              onChange={(e) => handleSelecionarCondominio(e.target.value)}
            >
              <option value="">Selecione um condomínio...</option>
              {condominios.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} (ID: {c.id})
                </option>
              ))}
            </select>
          </div>

          <div className="campo-grupo">
            <label>Bloco (Opcional)</label>
            <select
              value={blocoSelecionado}
              onChange={(e) => setBlocoSelecionado(e.target.value)}
              disabled={!condominioSelecionado}
            >
              <option value="">Condomínio inteiro (todos os blocos)</option>
              {blocos.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nome}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="btn-adicionar-fila"
            onClick={adicionarItemNaFila}
          >
            + Adicionar à lista
          </button>
        </div>

        {listaParaAtribuir.length > 0 && (
          <div className="fila-atribuicao">
            <h4>Itens prontos para atribuir ao usuário #{usuarioConsultado || usuarioId || '?'}:</h4>
            <ul>
              {listaParaAtribuir.map((item, idx) => (
                <li key={`${item.condominioId}-${item.blocoId}-${idx}`}>
                  <span>
                    <strong>{item.condominioNome}</strong> — {item.blocoNome}
                  </span>
                  <button
                    type="button"
                    className="btn-remover-item"
                    onClick={() => removerItemDaFila(idx)}
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="btn-salvar-atribuicao"
              onClick={handleConfirmarAtribuicao}
              disabled={salvando}
            >
              {salvando ? 'Salvando...' : 'Confirmar Atribuição'}
            </button>
          </div>
        )}
      </section>

      {/* Card 3: Vínculos Ativos e Desassociação */}
      {usuarioConsultado && (
        <section className="gerenciamento-card">
          <h3>3. Gerenciamentos Ativos (Usuário #{usuarioConsultado})</h3>
          {gerenciamentos.length > 0 ? (
            <div className="tabela-scroll">
              <table className="gerenciamento-tabela">
                <thead>
                  <tr>
                    <th>ID Vínculo</th>
                    <th>Condomínio</th>
                    <th>Escopo / Bloco</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {gerenciamentos.map((g) => {
                    const idVinculo = g.id || g.gerenciamento_id;
                    const nomeCond =
                      g.condominio_nome ||
                      g.nome_condominio ||
                      g.nome ||
                      `Condomínio #${g.id_condominio || g.condominio_id}`;
                    const nomeBloco =
                      g.bloco_nome ||
                      g.nome_bloco ||
                      (g.id_bloco || g.bloco_id
                        ? `Bloco #${g.id_bloco || g.bloco_id}`
                        : 'Condomínio inteiro');

                    return (
                      <tr key={idVinculo}>
                        <td>#{idVinculo}</td>
                        <td>{nomeCond}</td>
                        <td>
                          <span className="badge-escopo">{nomeBloco}</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-desassociar"
                            onClick={() => handleDesassociar(idVinculo)}
                          >
                            Desassociar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="sem-vinculos">
              Nenhum gerenciamento ativo encontrado para este usuário.
            </p>
          )}
        </section>
      )}
    </div>
  );
}