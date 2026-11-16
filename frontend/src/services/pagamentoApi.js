import axios from 'axios';

const API_URL = 'http://localhost:3000';

export const obterEstadoPagamentos = async (condominioId) => {
  const token = localStorage.getItem('morada_token');
  const response = await axios.get(`${API_URL}/condominios/${condominioId}/pagamentos/status`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const notificarInadimplentes = async (condominioId, dadosNotificacao = {}) => {
  const token = localStorage.getItem('morada_token');
  const response = await axios.post(
    `${API_URL}/condominios/${condominioId}/pagamentos/notificar-inadimplentes`,
    dadosNotificacao,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
};