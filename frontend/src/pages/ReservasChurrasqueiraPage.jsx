import React, { useState, useEffect } from 'react';
import { obterReservas, criarReserva } from '../services/reservaApi';

export default function ReservasChurrasqueiraPage() {
  const [reservas, setReservas] = useState([]);
  const [dataReserva, setDataReserva] = useState('');
  const [horarioInicio, setHorarioInicio] = useState('');
  const [horarioFim, setHorarioFim] = useState('');
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  const condominioAtivo = JSON.parse(localStorage.getItem('morada_condominio_ativo') || '{"id": 1}');

  const carregarReservas = async () => {
    try {
      const data = await obterReservas(condominioAtivo.id);
      setReservas(data);
    } catch (err) {
      console.error('Erro ao carregar reservas:', err);
    }
  };

  useEffect(() => {
    carregarReservas();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem({ tipo: '', texto: '' });

    try {
      await criarReserva(condominioAtivo.id, {
        data_reserva: dataReserva,
        horario_inicio: horarioInicio,
        horario_fim: horarioFim
      });
      setMensagem({ tipo: 'sucesso', texto: 'Reserva realizada com sucesso!' });
      setDataReserva('');
      setHorarioInicio('');
      setHorarioFim('');
      carregarReservas();
    } catch (err) {
      setMensagem({
        tipo: 'erro',
        texto: err.response?.data?.error || 'Erro ao agendar reserva.'
      });
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🍖 Reserva de Churrasqueira</h2>

      {mensagem.texto && (
        <div style={{
          padding: '10px',
          marginBottom: '15px',
          backgroundColor: mensagem.tipo === 'sucesso' ? '#d4edda' : '#f8d7da',
          color: mensagem.tipo === 'sucesso' ? '#155724' : '#721c24',
          borderRadius: '4px'
        }}>
          {mensagem.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
        <label>
          Data da Reserva:
          <input type="date" value={dataReserva} onChange={(e) => setDataReserva(e.target.value)} required />
        </label>
        <label>
          Horário de Início:
          <input type="time" value={horarioInicio} onChange={(e) => setHorarioInicio(e.target.value)} required />
        </label>
        <label>
          Horário de Término:
          <input type="time" value={horarioFim} onChange={(e) => setHorarioFim(e.target.value)} required />
        </label>
        <button type="submit" style={{ padding: '10px', cursor: 'pointer' }}>Reservar Horário</button>
      </form>

      <h3>Reservas Confirmadas</h3>
      <ul>
        {reservas.map((reserva) => (
          <li key={reserva.id}>
            <strong>{reserva.data_reserva}</strong>: {reserva.horario_inicio} às {reserva.horario_fim} (Reservado por: {reserva.usuario_nome || 'Morador'})
          </li>
        ))}
      </ul>
    </div>
  );
}