import React, { useState, useEffect } from 'react';
import { obterReservas, criarReserva } from '../services/reservaApi';
import fotoChurrasqueira from '../assets/churrasqueira.jpg';
import './ReservasChurrasqueiraPage.css';

const dataBR = (iso) => String(iso).slice(0, 10).split('-').reverse().join('/');
const hora = (t) => String(t).slice(0, 5);

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
    <main className="churras-page">
      <div className="churras-conteudo">
        <header>
          <h2>Reserva da churrasqueira</h2>
          <p>Escolha o dia e o horário. Horários já ocupados não podem ser reservados.</p>
        </header>

        {mensagem.texto && (
          <div className={`churras-msg churras-msg--${mensagem.tipo}`} role={mensagem.tipo === 'erro' ? 'alert' : 'status'}>
            {mensagem.texto}
          </div>
        )}

        <form className="churras-form" onSubmit={handleSubmit}>
          <label className="churras-campo churras-campo--cheio">
            Data da reserva
            <input type="date" value={dataReserva} onChange={(e) => setDataReserva(e.target.value)} required />
          </label>
          <label className="churras-campo">
            Início
            <input type="time" value={horarioInicio} onChange={(e) => setHorarioInicio(e.target.value)} required />
          </label>
          <label className="churras-campo">
            Término
            <input type="time" value={horarioFim} onChange={(e) => setHorarioFim(e.target.value)} required />
          </label>
          <button type="submit" className="churras-btn">Reservar horário</button>
        </form>

        <section>
          <h3>Reservas confirmadas</h3>
          {reservas.length === 0 ? (
            <p className="churras-vazio">Nenhuma reserva por enquanto. O primeiro horário é seu.</p>
          ) : (
            <ul className="churras-lista">
              {reservas.map((reserva) => (
                <li key={reserva.id}>
                  <strong>{dataBR(reserva.data_reserva)}</strong>
                  <span>{hora(reserva.horario_inicio)} às {hora(reserva.horario_fim)}</span>
                  <span className="churras-quem">{reserva.usuario_nome || 'Morador'}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="churras-foto" role="img" aria-label="Carnes grelhadas na churrasqueira, com brasas e fumaça">
        <img src={fotoChurrasqueira} alt="" />
      </div>
    </main>
  );
}
