const API_URL = 'http://localhost:3000';

async function requisicao(url, options = {}) {
  const token = localStorage.getItem('morada_token');

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.erro || data.mensagem || 'Erro ao realizar operação.');
  }

  return data;
}

export const registrarMulta = (idCondominio, dados) =>
  requisicao(`/condominios/${idCondominio}/multas`, { method: 'POST', body: JSON.stringify(dados) });

export const listarMultas = (idCondominio) => requisicao(`/condominios/${idCondominio}/multas`);

export const listarMinhasMultas = (idCondominio) =>
  requisicao(`/condominios/${idCondominio}/multas/minhas`);

export const atualizarStatusMulta = (idCondominio, id, status) =>
  requisicao(`/condominios/${idCondominio}/multas/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
