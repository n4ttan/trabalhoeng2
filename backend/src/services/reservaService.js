const reservaRepository = require('../repositories/reservaRepository');

const reservaService = {
  async agendar(dados) {
    const { id_condominio, data_reserva, horario_inicio, horario_fim } = dados;

    if (!data_reserva || !horario_inicio || !horario_fim) {
      throw new Error('Data, horário de início e término são obrigatórios.');
    }

    if (horario_inicio >= horario_fim) {
      throw new Error('O horário de início deve ser anterior ao horário de término.');
    }

    const conflito = await reservaRepository.verificarConflito(id_condominio, data_reserva, horario_inicio, horario_fim);
    if (conflito) {
      throw new Error('A churrasqueira já está reservada para este horário.');
    }

    return await reservaRepository.criarReserva(dados);
  },

  async listar(id_condominio) {
    return await reservaRepository.listarPorCondominio(id_condominio);
  }
};

module.exports = reservaService;