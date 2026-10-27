import React, { useEffect, useState } from 'react';
import { listarNotificacoes, publicarNotificacao } from '../services/notificacaoApi';
import './NotificacoesPage.css';

export default function NotificacoesPage() {
  const [avisos, setAvisos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const [mostrarForm, setMostrarForm] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaMensagem, setNovaMensagem] = useState('');

  // Carrega as notificações do banco de dados MySQL ao abrir a página
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
    carregarAvisos();
  }, []);

  // Publica novo aviso no backend
  const handleCriarAviso = async (e) => {
    e.preventDefault();
    if (!novoTitulo || !novaMensagem) return;

    try {
      await publicarNotificacao({
        titulo: novoTitulo,
        mensagem: novaMensagem
      });

      setNovoTitulo('');
      setNovaMensagem('');
      setMostrarForm(false);
      
      // Atualiza a lista com o novo aviso salvo
      carregarAvisos();
    } catch (err) {
      alert(err.message || 'Erro ao publicar aviso.');
    }
  };

  if (loading) return <div className="notificacoes-container"><p>Carregando avisos...</p></div>;

  return (
    <div className="notificacoes-container">
      <div className="notificacoes-header">
        <h2>Mural de Avisos e Notificações</h2>
        <button 
          className="btn-novo-aviso" 
          onClick={() => setMostrarForm(!mostrarForm)}
        >
          {mostrarForm ? 'Cancelar' : '+ Novo Aviso'}
        </button>
      </div>

      {erro && <div className="erro-mensagem" style={{ color: 'red', marginBottom: '15px' }}>{erro}</div>}

      {mostrarForm && (
        <form className="form-aviso" onSubmit={handleCriarAviso}>
          <h3>Publicar Novo Comunicado</h3>
          <input 
            type="text" 
            placeholder="Título do aviso" 
            value={novoTitulo}
            onChange={(e) => setNovoTitulo(e.target.value)}
            required
          />
          <textarea 
            placeholder="Descrição detalhada do aviso..." 
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            required
          />
          <button type="submit" className="btn-novo-aviso">Publicar Aviso</button>
        </form>
      )}

      <div className="lista-avisos">
        {avisos.length === 0 ? (
          <p>Nenhum aviso publicado no momento.</p>
        ) : (
          avisos.map((aviso) => (
            <div key={aviso.id || aviso.idNotificacao} className="card-aviso">
              <div className="card-aviso-header">
                <span className="card-aviso-titulo">{aviso.titulo}</span>
                <span className="card-aviso-data">
                  {aviso.created_at || aviso.data ? new Date(aviso.created_at || aviso.data).toLocaleDateString('pt-BR') : ''}
                </span>
              </div>
              <p className="card-aviso-mensagem">{aviso.mensagem || aviso.descricao}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}