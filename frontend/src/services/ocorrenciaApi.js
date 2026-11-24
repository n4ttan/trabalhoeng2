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
    throw new Error(data.erro || data.mensagem || 'Erro na requisição.');
  }

  return data;
}

// Morador registra uma ocorrência
export function registrarOcorrencia(idCondominio, dados) {
  return requisicao(`/condominios/${idCondominio}/ocorrencias`, {
    method: 'POST',
    body: JSON.stringify(dados)
  });
}

// Morador lista as suas ocorrências
export function listarMinhasOcorrencias(idCondominio) {
  return requisicao(`/condominios/${idCondominio}/ocorrencias/minhas`);
}

// Síndico/Admin lista as ocorrências do condomínio
export function listarOcorrenciasCondominio(idCondominio) {
  return requisicao(`/condominios/${idCondominio}/ocorrencias`);
}

// Síndico/Admin altera status e adiciona resposta
export function atualizarOcorrencia(idCondominio, id, dados) {
  return requisicao(`/condominios/${idCondominio}/ocorrencias/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dados)
  });
}
