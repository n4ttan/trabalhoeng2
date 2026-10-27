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
    throw new Error(data.erro || data.mensagem || 'Erro ao realizar operação.');
  }

  return data;
}

/*
 * LISTAR NOTIFICAÇÕES
 */
export async function listarNotificacoes() {
  return await requisicao('/notificacoes');
}

/*
 * PUBLICAR NOTIFICAÇÃO (SÍNDICO/ADMIN)
 */
export async function publicarNotificacao(dadosNotificacao) {
  return await requisicao('/notificacoes', {
    method: 'POST',
    body: JSON.stringify(dadosNotificacao)
  });
}