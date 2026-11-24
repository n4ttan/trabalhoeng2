const multaRepository = require('../repositories/multaRepository');

function erro(status, mensagem) {
    const e = new Error(mensagem);
    e.status = status;
    return e;
}

const STATUS_DESTINO = ['PAGA', 'CANCELADA'];

module.exports = {
    async criar(idCondominio, { id_usuario, valor, motivo, data_multa } = {}) {
        const valorNum = Number(valor);
        if (!id_usuario || !motivo || !String(motivo).trim() || !data_multa) {
            throw erro(400, 'Morador, valor, motivo e data são obrigatórios.');
        }
        if (!Number.isFinite(valorNum) || valorNum <= 0) {
            throw erro(400, 'O valor da multa deve ser maior que zero.');
        }
        if (Number.isNaN(Date.parse(data_multa))) {
            throw erro(400, 'Data inválida.');
        }
        const morador = await multaRepository.buscarMorador(id_usuario, idCondominio);
        if (!morador) {
            throw erro(404, 'Morador não encontrado neste condomínio.');
        }
        return multaRepository.salvar({
            id_condominio: idCondominio,
            id_usuario,
            valor: valorNum,
            motivo: String(motivo).trim(),
            data_multa
        });
    },

    listarPorCondominio(idCondominio) {
        return multaRepository.listarPorCondominio(idCondominio);
    },

    listarMinhas(idCondominio, usuario) {
        return multaRepository.listarPorUsuario(idCondominio, usuario.id);
    },

    async atualizarStatus(idCondominio, id, status) {
        if (!STATUS_DESTINO.includes(status)) {
            throw erro(400, 'Status inválido. Use PAGA ou CANCELADA.');
        }
        const multa = await multaRepository.buscarPorId(id);
        if (!multa || multa.id_condominio !== idCondominio) {
            throw erro(404, 'Multa não encontrada.');
        }
        if (multa.status !== 'PENDENTE') {
            throw erro(400, 'Apenas multas pendentes podem ser alteradas.');
        }
        await multaRepository.atualizarStatus(id, status);
        return { ...multa, status };
    }
};
