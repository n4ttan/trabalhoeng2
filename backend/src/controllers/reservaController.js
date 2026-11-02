const reservaService = require('../services/reservaService');

const reservaController = {
  async criar(req, res) {
    try {
      const id_condominio = req.params.idCondominio || 1;
      const id_usuario = req.usuario.id;
      const { data_reserva, horario_inicio, horario_fim } = req.body;

      const id = await reservaService.agendar({
        id_condominio,
        id_usuario,
        data_reserva,
        horario_inicio,
        horario_fim
      });

      return res.status(201).json({ message: 'Reserva realizada com sucesso!', id });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },

  async listar(req, res) {
    try {
      const id_condominio = req.params.idCondominio || 1;
      const reservas = await reservaService.listar(id_condominio);
      return res.json(reservas);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar reservas.' });
    }
  }
};

module.exports = reservaController;