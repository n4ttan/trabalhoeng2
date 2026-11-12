const reservaSalaoService = require('../services/reservaSalaoService');

function validarAcessoMorador(req, res) {
    const idCondominioRota = Number(req.params.idCondominio);
    if (req.usuario.perfil === 'MORADOR' && Number(req.usuario.id_condominio) !== idCondominioRota) {
        res.status(403).json({
            erro: 'Acesso negado. Você só pode acessar o seu próprio condomínio.',
            mensagem: 'Acesso negado. Você só pode acessar o seu próprio condomínio.'
        });
        return false;
    }
    return true;
}

const reservaSalaoController = {
    async criar(req, res) {
        try {
            if (!validarAcessoMorador(req, res)) return;

            const id_condominio = Number(req.params.idCondominio);
            const id_usuario = req.usuario.id;
            const { data_reserva, horario_inicio, horario_fim } = req.body;

            const id = await reservaSalaoService.agendar({
                id_condominio,
                id_usuario,
                data_reserva,
                horario_inicio,
                horario_fim
            });

            return res.status(201).json({
                mensagem: 'Reserva do salão realizada com sucesso!',
                id
            });
        } catch (error) {
            const status = error.status || 400;
            return res.status(status).json({ erro: error.message, mensagem: error.message });
        }
    },

    async listar(req, res) {
        try {
            if (!validarAcessoMorador(req, res)) return;

            const id_condominio = Number(req.params.idCondominio);
            const reservas = await reservaSalaoService.listar(id_condominio);
            return res.status(200).json(reservas);
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({ erro: error.message || 'Erro ao buscar reservas do salão.' });
        }
    },

    async obterPorId(req, res) {
        try {
            if (!validarAcessoMorador(req, res)) return;

            const idReserva = Number(req.params.id);
            const reserva = await reservaSalaoService.buscarPorId(idReserva);

            if (req.usuario.perfil === 'MORADOR' && Number(reserva.id_condominio) !== Number(req.usuario.id_condominio)) {
                return res.status(403).json({
                    erro: 'Acesso negado. Você só pode acessar o seu próprio condomínio.'
                });
            }

            return res.status(200).json(reserva);
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({ erro: error.message });
        }
    },

    async cancelar(req, res) {
        try {
            if (!validarAcessoMorador(req, res)) return;

            const idReserva = Number(req.params.id);
            const resultado = await reservaSalaoService.cancelar(idReserva, req.usuario);
            return res.status(200).json(resultado);
        } catch (error) {
            const status = error.status || 400;
            return res.status(status).json({ erro: error.message });
        }
    }
};

module.exports = reservaSalaoController;
