const manutencaoRepository = require('../repositories/manutencaoRepository');

const PRIORIDADES = ['BAIXA', 'MEDIA', 'ALTA'];
const STATUS = ['ABERTO', 'EM_ANDAMENTO', 'CONCLUIDO'];

function erro(mensagem, status) {
    const e = new Error(mensagem);
    e.status = status;
    return e;
}

const manutencaoService = {
    async abrir({ id_condominio, id_usuario, titulo, descricao, local, prioridade = 'MEDIA' }) {
        if (!id_condominio || !id_usuario) throw erro('Condomínio e usuário são obrigatórios.', 400);

        titulo = typeof titulo === 'string' ? titulo.trim() : '';
        descricao = typeof descricao === 'string' ? descricao.trim() : '';
        local = typeof local === 'string' ? local.trim() : '';

        if (!titulo || !descricao || !local) throw erro('Título, descrição e local são obrigatórios.', 400);
        if (titulo.length > 150 || local.length > 150) throw erro('Título e local devem ter no máximo 150 caracteres.', 400);
        if (!PRIORIDADES.includes(prioridade)) throw erro('Prioridade inválida.', 400);

        return manutencaoRepository.criar({ id_condominio, id_usuario, titulo, descricao, local, prioridade });
    },

    // Síndico/admin veem todos do condomínio; morador só os próprios.
    async listar(id_condominio, usuario) {
        const id = Number(id_condominio);
        if (!id) throw erro('ID do condomínio inválido.', 400);
        const ehGestor = usuario.perfil === 'SINDICO' || usuario.perfil === 'ADMIN';
        return manutencaoRepository.listar(id, ehGestor ? null : usuario.id);
    },

    async atualizarStatus(id, id_condominio, status) {
        const idNum = Number(id);
        if (!idNum) throw erro('ID de manutenção inválido.', 400);
        if (!STATUS.includes(status)) throw erro('Status inválido.', 400);

        const manutencao = await manutencaoRepository.buscarPorId(idNum);
        if (!manutencao || Number(manutencao.id_condominio) !== Number(id_condominio)) {
            throw erro('Chamado de manutenção não encontrado.', 404);
        }

        await manutencaoRepository.atualizarStatus(idNum, status);
        return { mensagem: 'Status atualizado com sucesso.' };
    }
};

module.exports = manutencaoService;
