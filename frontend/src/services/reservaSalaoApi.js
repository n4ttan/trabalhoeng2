const API_URL = 'http://localhost:3000';

function obterToken() {
  return localStorage.getItem('morada_token');
}

async function requisicao(url, options = {}) {
  const token = obterToken();

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
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
    const mensagemErro = data.erro || data.mensagem || 'Erro ao processar a requisição.';
    const erro = new Error(mensagemErro);
    erro.status = response.status;
    erro.codigo = data.codigo;
    throw erro;
  }

  return data;
}

/**
 * Listar reservas do salão de festas do condomínio
 */
export async function obterReservasSalao(idCondominio) {
  return await requisicao(`/condominios/${idCondominio}/reservas-salao`);
}

/**
 * Criar nova reserva do salão de festas
 */
export async function criarReservaSalao(idCondominio, dadosReserva) {
  return await requisicao(`/condominios/${idCondominio}/reservas-salao`, {
    method: 'POST',
    body: JSON.stringify(dadosReserva)
  });
}

/**
 * Cancelar reserva do salão de festas (autor ou síndico/admin)
 */
export async function cancelarReservaSalao(idCondominio, reservaId) {
  return await requisicao(`/condominios/${idCondominio}/reservas-salao/${reservaId}/cancelar`, {
    method: 'PATCH'
  });
}

/**
 * Obter detalhes de uma reserva específica
 */
export async function obterReservaSalaoPorId(idCondominio, reservaId) {
  return await requisicao(`/condominios/${idCondominio}/reservas-salao/${reservaId}`);
}
