const reservaSalaoRepository = require('../repositories/reservaSalaoRepository');

const reservaSalaoService = {
    async agendar(dados) {
        const { id_condominio, id_usuario, data_reserva, horario_inicio, horario_fim } = dados;

        if (!id_condominio) {
            const erro = new Error('Condomínio é obrigatório.');
            erro.status = 400;
            throw erro;
        }

        if (!id_usuario) {
            const erro = new Error('Usuário é obrigatório.');
            erro.status = 400;
            throw erro;
        }

        if (!data_reserva || !horario_inicio || !horario_fim) {
            const erro = new Error('Data, horário de início e término são obrigatórios.');
            erro.status = 400;
            throw erro;
        }

        if (horario_inicio >= horario_fim) {
            const erro = new Error('O horário de início deve ser anterior ao horário de término.');
            erro.status = 400;
            throw erro;
        }

        const conflito = await reservaSalaoRepository.verificarConflito(
            id_condominio,
            data_reserva,
            horario_inicio,
            horario_fim
        );

        if (conflito) {
            const erro = new Error('O salão de festas já está reservado para este horário.');
            erro.status = 409;
            throw erro;
        }

        const id = await reservaSalaoRepository.criarReserva({
            id_condominio,
            id_usuario,
            data_reserva,
            horario_inicio,
            horario_fim,
            status: 'CONFIRMADA'
        });

        return id;
    },

    async listar(id_condominio) {
        const id = Number(id_condominio);
        if (!id) {
            const erro = new Error('ID do condomínio inválido.');
            erro.status = 400;
            throw erro;
        }
        return await reservaSalaoRepository.listarPorCondominio(id);
    },

    async buscarPorId(id) {
        const idNum = Number(id);
        if (!idNum) {
            const erro = new Error('ID de reserva inválido.');
            erro.status = 400;
            throw erro;
        }
        const reserva = await reservaSalaoRepository.buscarPorId(idNum);
        if (!reserva) {
            const erro = new Error('Reserva não encontrada.');
            erro.status = 404;
            throw erro;
        }
        return reserva;
    },

    async cancelar(id, usuario) {
        const idNum = Number(id);
        if (!idNum) {
            const erro = new Error('ID de reserva inválido.');
            erro.status = 400;
            throw erro;
        }

        const reserva = await reservaSalaoRepository.buscarPorId(idNum);
        if (!reserva) {
            const erro = new Error('Reserva não encontrada.');
            erro.status = 404;
            throw erro;
        }

        if (reserva.status === 'CANCELADA') {
            const erro = new Error('Esta reserva já se encontra cancelada.');
            erro.status = 400;
            throw erro;
        }

        const ehAdmin = usuario.perfil === 'ADMIN';
        const ehSindicoDoCondo = usuario.perfil === 'SINDICO' && Number(usuario.id_condominio) === Number(reserva.id_condominio);
        const ehAutor = Number(usuario.id) === Number(reserva.id_usuario);

        if (!ehAdmin && !ehSindicoDoCondo && !ehAutor) {
            const erro = new Error('Acesso negado. Você não tem permissão para cancelar esta reserva.');
            erro.status = 403;
            throw erro;
        }

        await reservaSalaoRepository.cancelarReserva(idNum);
        return { mensagem: 'Reserva cancelada com sucesso.' };
    }
};

module.exports = reservaSalaoService;
