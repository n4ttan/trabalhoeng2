const connection = require('./database');

const reservaSalaoRepository = {
    verificarConflito(id_condominio, data_reserva, horario_inicio, horario_fim, idReservaIgnorar = null) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT * FROM reservas_salao
                WHERE id_condominio = ? 
                  AND data_reserva = ?
                  AND status = 'CONFIRMADA'
                  AND (
                    (horario_inicio < ? AND horario_fim > ?)
                  )
            `;
            const params = [id_condominio, data_reserva, horario_fim, horario_inicio];

            if (idReservaIgnorar) {
                query += ' AND id != ?';
                params.push(idReservaIgnorar);
            }

            connection.query(query, params, (error, results) => {
                if (error) return reject(error);
                resolve(results.length > 0);
            });
        });
    },

    criarReserva(dados) {
        return new Promise((resolve, reject) => {
            const { id_condominio, id_usuario, data_reserva, horario_inicio, horario_fim, status = 'CONFIRMADA' } = dados;
            const query = `
                INSERT INTO reservas_salao (id_condominio, id_usuario, data_reserva, horario_inicio, horario_fim, status)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            connection.query(query, [id_condominio, id_usuario, data_reserva, horario_inicio, horario_fim, status], (error, results) => {
                if (error) return reject(error);
                resolve(results.insertId);
            });
        });
    },

    listarPorCondominio(id_condominio) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT r.*, u.nome AS usuario_nome, u.unidade, u.bloco
                FROM reservas_salao r
                JOIN usuarios u ON r.id_usuario = u.id
                WHERE r.id_condominio = ?
                ORDER BY r.data_reserva ASC, r.horario_inicio ASC
            `;
            connection.query(query, [id_condominio], (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });
    },

    buscarPorId(id) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT r.*, u.nome AS usuario_nome, u.email AS usuario_email, u.unidade, u.bloco
                FROM reservas_salao r
                JOIN usuarios u ON r.id_usuario = u.id
                WHERE r.id = ?
            `;
            connection.query(query, [id], (error, results) => {
                if (error) return reject(error);
                resolve(results.length > 0 ? results[0] : null);
            });
        });
    },

    cancelarReserva(id) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE reservas_salao
                SET status = 'CANCELADA'
                WHERE id = ?
            `;
            connection.query(query, [id], (error, results) => {
                if (error) return reject(error);
                resolve(results.affectedRows > 0);
            });
        });
    }
};

module.exports = reservaSalaoRepository;
