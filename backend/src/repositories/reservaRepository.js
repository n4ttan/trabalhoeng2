const connection = require('./database');

const reservaRepository = {
    verificarConflito(id_condominio, data_reserva, horario_inicio, horario_fim) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM reservas_churrasqueira
                WHERE id_condominio = ? 
                  AND data_reserva = ?
                  AND status = 'CONFIRMADA'
                  AND (
                    (horario_inicio < ? AND horario_fim > ?)
                  )
            `;
            connection.query(query, [id_condominio, data_reserva, horario_fim, horario_inicio], (error, results) => {
                if (error) return reject(error);
                resolve(results.length > 0);
            });
        });
    },

    criarReserva(dados) {
        return new Promise((resolve, reject) => {
            const { id_condominio, id_usuario, data_reserva, horario_inicio, horario_fim } = dados;
            const query = `
                INSERT INTO reservas_churrasqueira (id_condominio, id_usuario, data_reserva, horario_inicio, horario_fim)
                VALUES (?, ?, ?, ?, ?)
            `;
            connection.query(query, [id_condominio, id_usuario, data_reserva, horario_inicio, horario_fim], (error, results) => {
                if (error) return reject(error);
                resolve(results.insertId);
            });
        });
    },

    listarPorCondominio(id_condominio) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT r.*, u.nome AS usuario_nome 
                FROM reservas_churrasqueira r
                JOIN usuarios u ON r.id_usuario = u.id
                WHERE r.id_condominio = ?
                ORDER BY r.data_reserva ASC, r.horario_inicio ASC
            `;
            connection.query(query, [id_condominio], (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });
    }
};

module.exports = reservaRepository;