const API_URL = 'http://localhost:3000';

export async function obterRelatorio(idCondominio) {
  const token = localStorage.getItem('morada_token');
  const response = await fetch(`${API_URL}/condominios/${idCondominio}/relatorios`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.erro || data.mensagem || 'Erro ao carregar relatórios.');
  }
  return data;
}
