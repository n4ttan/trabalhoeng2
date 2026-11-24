const ocorrenciaRepository = require('../repositories/ocorrenciaRepository');

const CATEGORIAS = ['BARULHO', 'VAZAMENTO', 'SEGURANCA', 'LIMPEZA', 'OUTROS'];
const STATUS = ['REGISTRADA', 'EM_ANALISE', 'RESOLVIDA'];

function erro(mensagem, statusCode) {
    return Object.assign(new Error(mensagem), { statusCode });
}

module.exports = {
    async registrar({ id_condominio, id_usuario, titulo, descricao, categoria, data_ocorrencia }) {
        if (!titulo?.trim() || !descricao?.trim() || !categoria || !data_ocorrencia) {
            throw erro('Título, descrição, categoria e data são obrigatórios.', 400);
        }
        if (!CATEGORIAS.includes(categoria)) {
            throw erro('Categoria inválida.', 400);
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(data_ocorrencia) || Number.isNaN(Date.parse(data_ocorrencia))) {
            throw erro('Data inválida. Use AAAA-MM-DD.', 400);
        }
        return await ocorrenciaRepository.salvar({
            id_condominio,
            id_usuario,
            titulo: titulo.trim(),
            descricao: descricao.trim(),
            categoria,
            data_ocorrencia
        });
    },

    async listarPorCondominio(idCondominio) {
        return await ocorrenciaRepository.buscarPorCondominio(idCondominio);
    },

    async listarMinhas(idCondominio, idUsuario) {
        return await ocorrenciaRepository.buscarPorUsuario(idCondominio, idUsuario);
    },

    async atualizar(idCondominio, id, { status, resposta }) {
        if (!STATUS.includes(status)) {
            throw erro('Status inválido.', 400);
        }
        const respostaLimpa = resposta?.trim() || null;
        const ok = await ocorrenciaRepository.atualizar(idCondominio, id, { status, resposta: respostaLimpa });
        if (!ok) throw erro('Ocorrência não encontrada.', 404);
        return { id: Number(id), status, resposta: respostaLimpa };
    }
};
