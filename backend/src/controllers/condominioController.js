const condominioService = require('../services/condominioService');

function responderErro(res, error, mensagemPadrao) {
    if (error.status) {
        return res.status(error.status).json({ erro: error.message, codigo: error.codigo });
    }
    console.error(mensagemPadrao, error);
    return res.status(500).json({ erro: mensagemPadrao });
}

// POST /condominios/adicionarCondominio ou POST /condominios
async function adicionarCondominio(req, res) {
    try {
        const { nome } = req.body;
        const resultado = await condominioService.criarCondominio(nome);
        return res.status(201).json({
            mensagem: 'Condomínio criado com sucesso.',
            condominio: resultado
        });
    } catch (error) {
        return responderErro(res, error, 'Erro ao criar condomínio.');
    }
}

// POST /condominios/retirarCondominio ou DELETE /condominios/:idCondominio
async function retirarCondominio(req, res) {
    try {
        const idCondominio = req.params.idCondominio || req.body.idCondominio || req.body.id;
        const resultado = await condominioService.excluirCondominio(idCondominio);
        return res.status(200).json(resultado);
    } catch (error) {
        return responderErro(res, error, 'Erro ao excluir condomínio.');
    }
}

// GET /condominios
async function listarCondominios(req, res) {
    try {
        const condominios = await condominioService.listarCondominios();
        return res.status(200).json(condominios);
    } catch (error) {
        return responderErro(res, error, 'Erro ao listar condomínios.');
    }
}

// GET /condominios/:idCondominio
async function obterCondominio(req, res) {
    try {
        const { idCondominio } = req.params;
        const condominio = await condominioService.buscarCondominioPorId(idCondominio);
        return res.status(200).json(condominio);
    } catch (error) {
        return responderErro(res, error, 'Erro ao obter condomínio.');
    }
}

// POST /condominios/:idCondominio/adicionarMorador
async function adicionarMorador(req, res) {
    try {
        const { idCondominio } = req.params;
        const { usuarioId, blocoId, bloco, unidade } = req.body;

        const resultado = await condominioService.adicionarMorador(
            idCondominio,
            usuarioId,
            blocoId || bloco,
            unidade
        );
        return res.status(200).json(resultado);
    } catch (error) {
        return responderErro(res, error, 'Erro ao adicionar morador ao condomínio.');
    }
}

// POST /condominios/:idCondominio/definirMoradorBloco ou PATCH /condominios/:idCondominio/moradores/:usuarioId/bloco
async function definirMoradorBloco(req, res) {
    try {
        const { idCondominio } = req.params;
        const usuarioId = req.params.usuarioId || req.body.usuarioId;
        const { idBloco, bloco, unidade } = req.body;

        const resultado = await condominioService.definirMoradorBloco(
            idCondominio,
            usuarioId,
            idBloco,
            bloco,
            unidade
        );
        return res.status(200).json(resultado);
    } catch (error) {
        return responderErro(res, error, 'Erro ao definir bloco do morador.');
    }
}

// GET /condominios/:idCondominio/moradores
async function listarMoradores(req, res) {
    try {
        const { idCondominio } = req.params;
        const { blocoId } = req.query;
        const moradores = await condominioService.listarMoradores(idCondominio, blocoId);
        return res.status(200).json(moradores);
    } catch (error) {
        return responderErro(res, error, 'Erro ao listar moradores do condomínio.');
    }
}

// POST /condominios/:idCondominio/blocos
async function criarBloco(req, res) {
    try {
        const { idCondominio } = req.params;
        const { nome } = req.body;
        const resultado = await condominioService.criarBloco(idCondominio, nome);
        return res.status(201).json({
            mensagem: 'Bloco criado com sucesso.',
            bloco: resultado
        });
    } catch (error) {
        return responderErro(res, error, 'Erro ao criar bloco.');
    }
}

// GET /condominios/:idCondominio/blocos
async function listarBlocos(req, res) {
    try {
        const { idCondominio } = req.params;
        const blocos = await condominioService.listarBlocos(idCondominio);
        return res.status(200).json(blocos);
    } catch (error) {
        return responderErro(res, error, 'Erro ao listar blocos do condomínio.');
    }
}

// POST /admin/gerenciamento ou POST /usuarios/:usuarioId/atribuir-gerenciamento
// Atribui múltiplos condomínios e blocos para um síndico/administrador
async function atribuirGerenciamento(req, res) {
    try {
        const usuarioId = req.params.usuarioId || req.body.usuarioId;
        const { condominios } = req.body; // array de condominios ou objetos { condominioId, blocoId }
        const resultado = await condominioService.atribuirGestao(usuarioId, condominios);
        return res.status(200).json(resultado);
    } catch (error) {
        return responderErro(res, error, 'Erro ao atribuir gerenciamento.');
    }
}

// GET /usuarios/:usuarioId/gerenciamentos
async function listarGerenciamentos(req, res) {
    try {
        const usuarioId = req.params.usuarioId || req.usuario.id;
        const gerenciamentos = await condominioService.listarGerenciamentosUsuario(usuarioId);
        return res.status(200).json(gerenciamentos);
    } catch (error) {
        return responderErro(res, error, 'Erro ao listar condomínios gerenciados.');
    }
}

// POST /usuarios/:idCondominio/acessarCondominio
async function acessarCondominio(req, res) {
    try {
        const { idCondominio } = req.params;
        const condominio = await condominioService.buscarCondominioPorId(idCondominio);
        return res.status(200).json({
            mensagem: 'Acesso ao condomínio autorizado.',
            condominio
        });
    } catch (error) {
        return responderErro(res, error, 'Erro ao acessar condomínio.');
    }
}

module.exports = {
    adicionarCondominio,
    retirarCondominio,
    listarCondominios,
    obterCondominio,
    adicionarMorador,
    definirMoradorBloco,
    listarMoradores,
    criarBloco,
    listarBlocos,
    atribuirGerenciamento,
    listarGerenciamentos,
    acessarCondominio
};
