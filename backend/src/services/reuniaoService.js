const reuniaoRepository = require('../repositories/reuniaoRepository');

module.exports = {
  async listarPorCondominio(idCondominio) {
    return await reuniaoRepository.buscarPorCondominio(idCondominio);
  },

  async criar(dados) {
    return await reuniaoRepository.salvar(dados);
  },

  async deletar(id) {
    return await reuniaoRepository.remover(id);
  }
};