import axios from 'axios';

const API_URL = 'http://localhost:3000';

const getHeaders = () => {
  const token = localStorage.getItem('morada_token');
  return { Authorization: `Bearer ${token}` };
};

export const listarGerenciamentosUsuario = async (usuarioId) => {
  const response = await axios.get(`${API_URL}/usuarios/${usuarioId}/gerenciamentos`, {
    headers: getHeaders()
  });
  return response.data;
};

export const atribuirGerenciamento = async (usuarioId, condominios) => {
  const response = await axios.post(
    `${API_URL}/usuarios/${usuarioId}/atribuir-gerenciamento`,
    { condominios },
    { headers: getHeaders() }
  );
  return response.data;
};

export const removerGerenciamento = async (usuarioId, gerenciamentoId) => {
  const response = await axios.delete(
    `${API_URL}/usuarios/${usuarioId}/gerenciamentos/${gerenciamentoId}`,
    { headers: getHeaders() }
  );
  return response.data;
};