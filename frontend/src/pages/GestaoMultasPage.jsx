import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarMoradoresCondominio } from '../services/condominioApi';
import { registrarMulta, listarMultas, atualizarStatusMulta } from '../services/multaApi';
import './MultasPage.css';

const brl = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dataBR = (iso) => String(iso).slice(0, 10).split('-').reverse().join('/');
const VAZIO = { id_usuario: '', valor: '', motivo: '', data_multa: new Date().toISOString().slice(0, 10) };

export default function GestaoMultasPage() {
  const navigate = useNavigate();
  const condoSalvo = localStorage.getItem('morada_condominio_ativo');
  const condominio = condoSalvo ? JSON.parse(condoSalvo) : null;

  const [multas, setMultas] = useState([]);
  const [moradores, setMoradores] = useState([]);
  const [form, setForm] = useState(VAZIO);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    try {
      setErro('');
      const [m, lista] = await Promise.all([
        listarMultas(condominio.id),
        listarMoradoresCondominio(condominio.id)
      ]);
      setMultas(Array.isArray(m) ? m : []);
      setMoradores(Array.isArray(lista) ? lista : []);
    } catch (err) {
      setErro(err.message || 'Não foi possível carregar as multas.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (!condominio) {
      navigate('/condominios');
      return;
    }
    carregar();
  }, []);

  const alterar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    try {
      setErro('');
      await registrarMulta(condominio.id, { ...form, id_usuario: Number(form.id_usuario) });
      setForm(VAZIO);
      await carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  async function mudarStatus(id, status) {
    try {
      setErro('');
      await atualizarStatusMulta(condominio.id, id, status);
      await carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <div className="multas-page">
      <h2>Multas de moradores</h2>

      <form className="multas-form" onSubmit={enviar}>
        <label>
          Morador
          <select required value={form.id_usuario} onChange={alterar('id_usuario')}>
            <option value="">Selecione</option>
            {moradores.map((m) => (
              <option key={m.id} value={m.id}>{m.nome}</option>
            ))}
          </select>
        </label>
        <label>
          Valor (R$)
          <input required type="number" min="0.01" step="0.01" value={form.valor} onChange={alterar('valor')} />
        </label>
        <label>
          Data
          <input required type="date" value={form.data_multa} onChange={alterar('data_multa')} />
        </label>
        <label>
          Motivo
          <input required maxLength={500} value={form.motivo} onChange={alterar('motivo')} />
        </label>
        <button type="submit">Registrar multa</button>
      </form>

      {erro && <p className="multas-erro" role="alert">{erro}</p>}
      {carregando && <p>Carregando...</p>}
      {!carregando && multas.length === 0 && <p>Nenhuma multa registrada.</p>}

      {multas.map((m) => (
        <div className="multa-card" key={m.id}>
          <div>
            <strong>{m.nome_morador}</strong> — {brl(m.valor)} em {dataBR(m.data_multa)}
            <div>{m.motivo}</div>
          </div>
          <div>
            <span className={`multa-status ${m.status.toLowerCase()}`}>{m.status}</span>
            {m.status === 'PENDENTE' && (
              <div className="multa-acoes">
                <button type="button" onClick={() => mudarStatus(m.id, 'PAGA')}>Marcar paga</button>
                <button type="button" onClick={() => mudarStatus(m.id, 'CANCELADA')}>Cancelar</button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
