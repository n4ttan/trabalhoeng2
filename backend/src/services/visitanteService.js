const visitanteRepository = require('../repositories/visitanteRepository');

function erro(mensagem, status) {
    const e = new Error(mensagem);
    e.status = status;
    return e;
}

async function buscarDoCondominio(id, id_condominio) {
    const idNum = Number(id);
    if (!idNum) throw erro('ID de autorização inválido.', 400);
    const visitante = await visitanteRepository.buscarPorId(idNum);
    if (!visitante || Number(visitante.id_condominio) !== Number(id_condominio)) {
        throw erro('Autorização não encontrada.', 404);
    }
    return visitante;
}

async function transicionar(id, id_condominio, de, para, msgInvalida) {
    const visitante = await buscarDoCondominio(id, id_condominio);
    if (visitante.status !== de) throw erro(msgInvalida, 400);
    if (para === 'ENTROU' && new Date(visitante.validade_ate) < new Date()) {
        throw erro('Autorização expirada.', 400);
    }
    const ok = await visitanteRepository.atualizarStatus(visitante.id, de, para);
    if (!ok) throw erro(msgInvalida, 409);
}

const visitanteService = {
    async autorizar(dados) {
        const { id_condominio, id_usuario, nome_visitante, documento, data_prevista, validade_ate } = dados;

        if (!id_condominio || !id_usuario) throw erro('Condomínio e usuário são obrigatórios.', 400);
        if (!nome_visitante || !String(nome_visitante).trim() || !documento || !String(documento).trim()) {
            throw erro('Nome e documento do visitante são obrigatórios.', 400);
        }
        if (!data_prevista || !validade_ate) throw erro('Data prevista e validade são obrigatórias.', 400);

        const prevista = new Date(data_prevista);
        const validade = new Date(validade_ate);
        if (isNaN(prevista) || isNaN(validade)) throw erro('Data prevista ou validade inválida.', 400);
        if (validade < prevista) throw erro('A validade deve ser posterior à data prevista.', 400);
        if (validade < new Date()) throw erro('A validade não pode estar no passado.', 400);

        return await visitanteRepository.criar({
            id_condominio,
            id_usuario,
            nome_visitante: String(nome_visitante).trim(),
            documento: String(documento).trim(),
            data_prevista,
            validade_ate
        });
    },

    async listarDoCondominio(id_condominio) {
        const id = Number(id_condominio);
        if (!id) throw erro('ID do condomínio inválido.', 400);
        return await visitanteRepository.listarPorCondominio(id);
    },

    async listarDoMorador(id_condominio, id_usuario) {
        const id = Number(id_condominio);
        if (!id || !id_usuario) throw erro('ID do condomínio inválido.', 400);
        return await visitanteRepository.listarPorUsuario(id, id_usuario);
    },

    async cancelar(id, id_condominio, usuario) {
        const visitante = await buscarDoCondominio(id, id_condominio);
        if (Number(visitante.id_usuario) !== Number(usuario.id)) {
            throw erro('Acesso negado. Você só pode cancelar as suas autorizações.', 403);
        }
        if (visitante.status !== 'AUTORIZADO') {
            throw erro('Só é possível cancelar autorizações com status AUTORIZADO.', 400);
        }
        const ok = await visitanteRepository.atualizarStatus(visitante.id, 'AUTORIZADO', 'CANCELADO');
        if (!ok) throw erro('Só é possível cancelar autorizações com status AUTORIZADO.', 409);
        return { mensagem: 'Autorização cancelada com sucesso.' };
    },

    async registrarEntrada(id, id_condominio) {
        await transicionar(id, id_condominio, 'AUTORIZADO', 'ENTROU', 'A autorização não está com status AUTORIZADO.');
        return { mensagem: 'Entrada registrada com sucesso.' };
    },

    async registrarSaida(id, id_condominio) {
        await transicionar(id, id_condominio, 'ENTROU', 'SAIU', 'O visitante não está com status ENTROU.');
        return { mensagem: 'Saída registrada com sucesso.' };
    }
};

module.exports = visitanteService;
