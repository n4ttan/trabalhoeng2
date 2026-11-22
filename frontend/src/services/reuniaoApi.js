import { listarCondominios } from './condominioApi';

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
    throw new Error(data.erro || data.mensagem || 'Erro na requisição.');
  }

  return data;
}

// Lista as reuniões do condomínio selecionado
export async function listarReunioesCondominio(idCondominio) {
  return await requisicao(`/condominios/${idCondominio}/reunioes`);
}

// Agenda uma nova reunião (Síndico/Admin)
export async function criarReuniaoCondominio(idCondominio, dadosReuniao) {
  return await requisicao(`/condominios/${idCondominio}/reunioes`, {
    method: 'POST',
    body: JSON.stringify(dadosReuniao)
  });
}

// Cancela / Exclui uma reunião marcada (Síndico/Admin)
export async function deletarReuniaoCondominio(idCondominio, reuniaoId) {
  return await requisicao(`/condominios/${idCondominio}/reunioes/${reuniaoId}`, {
    method: 'DELETE'
  });
}