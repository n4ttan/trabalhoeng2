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
    const erro = new Error(data.erro || data.mensagem || 'Erro ao processar a requisição.');
    erro.status = response.status;
    throw erro;
  }

  return data;
}

const base = (idCondominio) => `/condominios/${idCondominio}/visitantes`;

// Morador
export const autorizarVisitante = (idCondominio, dados) =>
  requisicao(base(idCondominio), { method: 'POST', body: JSON.stringify(dados) });

export const obterMeusVisitantes = (idCondominio) => requisicao(`${base(idCondominio)}/meus`);

export const cancelarVisitante = (idCondominio, id) =>
  requisicao(`${base(idCondominio)}/${id}/cancelar`, { method: 'PATCH' });

// Síndico (portaria)
export const obterVisitantesCondominio = (idCondominio) => requisicao(base(idCondominio));

export const registrarEntradaVisitante = (idCondominio, id) =>
  requisicao(`${base(idCondominio)}/${id}/entrada`, { method: 'PATCH' });

export const registrarSaidaVisitante = (idCondominio, id) =>
  requisicao(`${base(idCondominio)}/${id}/saida`, { method: 'PATCH' });
