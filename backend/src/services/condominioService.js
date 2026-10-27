const condominioRepository = require('../repositories/condominioRepository');
const usuarioRepository = require('../repositories/usuarioRepository');

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

const PERFIS_GESTORES = ['SINDICO', 'ADMIN'];

// Aceita um ID de condomínio ou um objeto { condominioId, blocoId } e devolve os IDs como números.
function normalizarAtribuicao(item) {
    const objeto = item !== null && typeof item === 'object';
    const condominioId = Number(objeto ? item.condominioId : item);
    const blocoId = objeto && item.blocoId ? Number(item.blocoId) : null;

    const condominioValido = Number.isInteger(condominioId) && condominioId > 0;
    const blocoValido = blocoId === null || (Number.isInteger(blocoId) && blocoId > 0);

    if (!condominioValido || !blocoValido) {
        throw erroNegocio(400, 'DADOS_INVALIDOS', 'Cada atribuição precisa de um condomínio (e, opcionalmente, um bloco) válido.');
    }

    return { condominioId, blocoId };
}

async function atribuirGestao(usuarioId, condominios = []) {
    const userId = Number(usuarioId);
    if (!userId || !Array.isArray(condominios) || condominios.length === 0) {
        throw erroNegocio(400, 'DADOS_INVALIDOS', 'Informe o usuário e a lista de condomínios/blocos para gerenciamento.');
    }

    // Remove repetições do próprio pedido antes de validar.
    const itens = new Map();
    for (const item of condominios) {
        const atribuicao = normalizarAtribuicao(item);
        itens.set(`${atribuicao.condominioId}:${atribuicao.blocoId}`, atribuicao);
    }

    const usuario = await usuarioRepository.buscarPorId(userId);
    if (!usuario) {
        throw erroNegocio(404, 'USUARIO_NAO_ENCONTRADO', 'Usuário não encontrado.');
    }
    if (!PERFIS_GESTORES.includes(usuario.perfil)) {
        throw erroNegocio(400, 'PERFIL_INVALIDO', 'Apenas síndicos ou administradores podem receber gerenciamento.');
    }

    const condominiosVerificados = new Set();
    for (const { condominioId, blocoId } of itens.values()) {
        if (!condominiosVerificados.has(condominioId)) {
            const condominio = await condominioRepository.buscarPorId(condominioId);
            if (!condominio) {
                throw erroNegocio(404, 'CONDOMINIO_NAO_ENCONTRADO', `Condomínio ${condominioId} não encontrado.`);
            }
            condominiosVerificados.add(condominioId);
        }

        if (blocoId !== null) {
            const bloco = await condominioRepository.buscarBlocoPorId(blocoId);
            if (!bloco) {
                throw erroNegocio(404, 'BLOCO_NAO_ENCONTRADO', `Bloco ${blocoId} não encontrado.`);
            }
            if (bloco.id_condominio !== condominioId) {
                throw erroNegocio(400, 'BLOCO_INVALIDO', `O bloco ${blocoId} não pertence ao condomínio ${condominioId}.`);
            }
        }
    }

    const atribuicoes = await condominioRepository.atribuirGestores(userId, [...itens.values()]);

    return { mensagem: 'Gerenciamento atribuído com sucesso.', atribuicoes };
}

async function removerGestao(usuarioId, gerenciamentoId) {
    const userId = Number(usuarioId);
    const gestaoId = Number(gerenciamentoId);
    if (!userId || !gestaoId) {
        throw erroNegocio(400, 'ID_INVALIDO', 'ID do usuário ou do gerenciamento inválido.');
    }

    const removido = await condominioRepository.removerGestao(userId, gestaoId);
    if (!removido) {
        throw erroNegocio(404, 'GERENCIAMENTO_NAO_ENCONTRADO', 'Gerenciamento não encontrado para este usuário.');
    }

    return { mensagem: 'Gerenciamento removido com sucesso.' };
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
    removerGestao,
    listarGerenciamentosUsuario
};
