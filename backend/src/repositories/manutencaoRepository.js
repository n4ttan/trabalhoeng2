const connection = require('./database');

const manutencaoRepository = {
    criar({ id_condominio, id_usuario, titulo, descricao, local, prioridade }) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO manutencoes (id_condominio, id_usuario, titulo, descricao, local, prioridade)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            connection.query(query, [id_condominio, id_usuario, titulo, descricao, local, prioridade], (error, results) => {
                if (error) return reject(error);
                resolve(results.insertId);
            });
        });
    },

    // idUsuario opcional: quando informado, lista só os chamados dele.
    listar(id_condominio, idUsuario = null) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT m.*, u.nome AS usuario_nome, u.unidade, u.bloco
                FROM manutencoes m
                JOIN usuarios u ON m.id_usuario = u.id
                WHERE m.id_condominio = ?
            `;
            const params = [id_condominio];
            if (idUsuario) {
                query += ' AND m.id_usuario = ?';
                params.push(idUsuario);
            }
            query += ' ORDER BY m.criado_em DESC';
            connection.query(query, params, (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });
    },

    buscarPorId(id) {
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM manutencoes WHERE id = ?', [id], (error, results) => {
                if (error) return reject(error);
                resolve(results.length > 0 ? results[0] : null);
            });
        });
    },

    atualizarStatus(id, status) {
        return new Promise((resolve, reject) => {
            connection.query('UPDATE manutencoes SET status = ? WHERE id = ?', [status, id], (error, results) => {
                if (error) return reject(error);
                resolve(results.affectedRows > 0);
            });
        });
    }
};

module.exports = manutencaoRepository;
