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
    const erro = new Error(data.erro || data.mensagem || 'Erro ao processar a requisição.');
    erro.status = response.status;
    throw erro;
  }

  return data;
}

export async function obterManutencoes(idCondominio) {
  return await requisicao(`/condominios/${idCondominio}/manutencoes`);
}

export async function criarManutencao(idCondominio, dados) {
  return await requisicao(`/condominios/${idCondominio}/manutencoes`, {
    method: 'POST',
    body: JSON.stringify(dados)
  });
}

export async function atualizarStatusManutencao(idCondominio, id, status) {
  return await requisicao(`/condominios/${idCondominio}/manutencoes/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}
