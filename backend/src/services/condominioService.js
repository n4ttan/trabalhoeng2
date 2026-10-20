const condominioRepository = require('../repositories/condominioRepository');

function erroNegocio(status, codigo, mensagem) {
    const erro = new Error(mensagem);
    erro.status = status;
    erro.codigo = codigo;
    return erro;
}

async function criarCondominio(nome) {
    const nomeLimpo = typeof nome === 'string' ? nome.trim() : '';
    if (!nomeLimpo) {
        throw erroNegocio(400, 'NOME_OBRIGATORIO', 'O nome do condomínio é obrigatório.');
    }
    const id = await condominioRepository.criarCondominio(nomeLimpo);
    return { id, nome: nomeLimpo };
}

async function excluirCondominio(id) {
    const idNum = Number(id);
    if (!idNum) {
        throw erroNegocio(400, 'ID_INVALIDO', 'ID do condomínio inválido.');
    }
    const excluido = await condominioRepository.excluirCondominio(idNum);
    if (!excluido) {
        throw erroNegocio(404, 'CONDOMINIO_NAO_ENCONTRADO', 'Condomínio não encontrado.');
    }
    return { mensagem: 'Condomínio excluído com sucesso.' };
}

async function listarCondominios() {
    return condominioRepository.listarCondominios();
}

async function buscarCondominioPorId(id) {
    const cond = await condominioRepository.buscarPorId(id);
    if (!cond) {
        throw erroNegocio(404, 'CONDOMINIO_NAO_ENCONTRADO', 'Condomínio não encontrado.');
    }
    return cond;
}

async function adicionarMorador(condominioId, usuarioId, blocoId = null, unidade = null) {
    const condId = Number(condominioId);
    const userId = Number(usuarioId);

    if (!condId || !userId) {
        throw erroNegocio(400, 'DADOS_INVALIDOS', 'Condomínio e usuário são obrigatórios.');
    }

    const condominio = await condominioRepository.buscarPorId(condId);
    if (!condominio) {
        throw erroNegocio(404, 'CONDOMINIO_NAO_ENCONTRADO', 'Condomínio não encontrado.');
    }

    const sucesso = await condominioRepository.adicionarMoradorAoCondominio(userId, condId, blocoId, unidade);
    if (!sucesso) {
        throw erroNegocio(404, 'USUARIO_NAO_ENCONTRADO', 'Usuário não encontrado.');
    }

    await condominioRepository.recalcularNumeroMoradores(condId);
    return { mensagem: 'Morador adicionado ao condomínio com sucesso.' };
}

async function definirMoradorBloco(condominioId, usuarioId, idBloco, blocoNome = null, unidade = null) {
    const condId = Number(condominioId);
    const userId = Number(usuarioId);

    if (!condId || !userId) {
        throw erroNegocio(400, 'DADOS_INVALIDOS', 'Condomínio e usuário são obrigatórios.');
    }

    const condominio = await condominioRepository.buscarPorId(condId);
    if (!condominio) {
        throw erroNegocio(404, 'CONDOMINIO_NAO_ENCONTRADO', 'Condomínio não encontrado.');
    }

    const sucesso = await condominioRepository.definirMoradorBloco(userId, condId, idBloco, blocoNome, unidade);
    if (!sucesso) {
        throw erroNegocio(404, 'USUARIO_NAO_ENCONTRADO', 'Usuário não encontrado.');
    }

    await condominioRepository.recalcularNumeroMoradores(condId);
    return { mensagem: 'Morador atribuído ao bloco com sucesso.' };
}

async function listarMoradores(condominioId, blocoId = null) {
    const condId = Number(condominioId);
    if (!condId) {
        throw erroNegocio(400, 'ID_INVALIDO', 'ID do condomínio inválido.');
    }
    return condominioRepository.listarMoradores(condId, blocoId);
}

async function criarBloco(condominioId, nome) {
    const condId = Number(condominioId);
    const nomeLimpo = typeof nome === 'string' ? nome.trim() : '';

    if (!condId || !nomeLimpo) {
        throw erroNegocio(400, 'DADOS_INVALIDOS', 'Nome do bloco e ID do condomínio são obrigatórios.');
    }

    const id = await condominioRepository.criarBloco(nomeLimpo, condId);
    return { id, nome: nomeLimpo, id_condominio: condId };
}

async function listarBlocos(condominioId) {
    const condId = Number(condominioId);
    if (!condId) {
        throw erroNegocio(400, 'ID_INVALIDO', 'ID do condomínio inválido.');
    }
    return condominioRepository.listarBlocos(condId);
}

async function atribuirGestao(usuarioId, condominios = []) {
    const userId = Number(usuarioId);
    if (!userId || !Array.isArray(condominios) || condominios.length === 0) {
        throw erroNegocio(400, 'DADOS_INVALIDOS', 'Informe o usuário e a lista de condomínios/blocos para gerenciamento.');
    }

    const resultados = [];
    for (const item of condominios) {
        const condId = typeof item === 'object' ? item.condominioId : item;
        const blocoId = typeof item === 'object' ? item.blocoId || null : null;
        if (condId) {
            const id = await condominioRepository.atribuirGestor(userId, condId, blocoId);
            resultados.push({ id, condominioId: condId, blocoId });
        }
    }

    return { mensagem: 'Gerenciamento atribuído com sucesso.', atribuicoes: resultados };
}

async function listarGerenciamentosUsuario(usuarioId) {
    const userId = Number(usuarioId);
    if (!userId) {
        throw erroNegocio(400, 'ID_INVALIDO', 'ID do usuário inválido.');
    }
    return condominioRepository.listarGerenciamentosUsuario(userId);
}

module.exports = {
    criarCondominio,
    excluirCondominio,
    listarCondominios,
    buscarCondominioPorId,
    adicionarMorador,
    definirMoradorBloco,
    listarMoradores,
    criarBloco,
    listarBlocos,
    atribuirGestao,
    listarGerenciamentosUsuario
};
