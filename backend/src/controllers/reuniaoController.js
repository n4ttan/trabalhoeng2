const reuniaoService = require('../services/reuniaoService');

module.exports = {
  async listarReunioes(req, res) {
    try {
      const { idCondominio } = req.params;
      const reunioes = await reuniaoService.listarPorCondominio(idCondominio);
      return res.json(reunioes);
    } catch (error) {
      return res.status(500).json({ erro: error.message || 'Erro ao listar reuniões.' });
    }
  },

  async criarReuniao(req, res) {
    try {
      const { idCondominio } = req.params;
      const { titulo, pauta, data_hora, local_link } = req.body;

      if (!titulo || !data_hora) {
        return res.status(400).json({ erro: 'Título e Data/Hora são obrigatórios.' });
      }

      const novaReuniao = await reuniaoService.criar({
        id_condominio: idCondominio,
        titulo,
        pauta,
        data_hora,
        local_link
      });

      return res.status(201).json(novaReuniao);
    } catch (error) {
      return res.status(500).json({ erro: error.message || 'Erro ao agendar reunião.' });
    }
  },

  async deletarReuniao(req, res) {
    try {
      const { reuniaoId } = req.params;
      await reuniaoService.deletar(reuniaoId);
      return res.json({ mensagem: 'Reunião cancelada com sucesso.' });
    } catch (error) {
      return res.status(500).json({ erro: error.message || 'Erro ao cancelar reunião.' });
    }
  }
};