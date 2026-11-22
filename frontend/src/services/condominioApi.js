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

// ### Condomínios (CRUD)
export async function listarCondominios() {
  return await requisicao('/condominios');
}

export async function obterCondominio(idCondominio) {
  return await requisicao(`/condominios/${idCondominio}`);
}

export async function criarCondominio(dados) {
  return await requisicao('/condominios', {
    method: 'POST',
    body: JSON.stringify(dados)
  });
}

export async function excluirCondominio(idCondominio) {
  return await requisicao(`/condominios/${idCondominio}`, {
    method: 'DELETE'
  });
}

// ### Moradores e Blocos por Condomínio
export async function listarBlocosCondominio(idCondominio) {
  return await requisicao(`/condominios/${idCondominio}/blocos`);
}

export async function criarBlocoCondominio(idCondominio, nome) {
  return await requisicao(`/condominios/${idCondominio}/blocos`, {
    method: 'POST',
    body: JSON.stringify({ nome })
  });
}

export async function listarMoradoresCondominio(idCondominio, blocoId = null) {
  const query = blocoId ? `?blocoId=${blocoId}` : '';
  return await requisicao(`/condominios/${idCondominio}/moradores${query}`);
}

export async function adicionarMoradorAoCondominio(idCondominio, dadosMorador) {
  return await requisicao(`/condominios/${idCondominio}/adicionarMorador`, {
    method: 'POST',
    body: JSON.stringify(dadosMorador)
  });
}

export async function definirMoradorBloco(idCondominio, usuarioId, dadosBloco) {
  return await requisicao(`/condominios/${idCondominio}/moradores/${usuarioId}/bloco`, {
    method: 'PATCH',
    body: JSON.stringify(dadosBloco)
  });
}

export async function acessarCondominioMorador(idCondominio) {
  return await requisicao(`/usuarios/${idCondominio}/acessarCondominio`, {
    method: 'POST'
  });
}

// ### Gerenciamento de múltiplos condomínios
export async function listarGerenciamentosUsuario(usuarioId) {
  return await requisicao(`/usuarios/${usuarioId}/gerenciamentos`);
}