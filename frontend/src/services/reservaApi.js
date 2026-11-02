import axios from 'axios';

const API_URL = 'http://localhost:3000';

export const obterReservas = async (condominioId) => {
  const token = localStorage.getItem('morada_token');
  const response = await axios.get(`${API_URL}/condominios/${condominioId}/reservas-churrasqueira`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const criarReserva = async (condominioId, dadosReserva) => {
  const token = localStorage.getItem('morada_token');
  const response = await axios.post(`${API_URL}/condominios/${condominioId}/reservas-churrasqueira`, dadosReserva, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};