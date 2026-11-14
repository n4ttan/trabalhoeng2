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

// Boletos do morador logado no condomínio
export async function listarMeusBoletos(idCondominio) {
  return await requisicao(`/condominios/${idCondominio}/boletos/meus-boletos`);
}

// 2ª via atualizada (multa e juros incluídos) com o template HTML do boleto
export async function obterSegundaVia(idCondominio, idBoleto) {
  return await requisicao(`/condominios/${idCondominio}/boletos/${idBoleto}/segunda-via`);
}
