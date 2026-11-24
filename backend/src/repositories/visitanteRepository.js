const connection = require('./database');

const SELECT_BASE = `
    SELECT v.*, u.nome AS usuario_nome, u.unidade, u.bloco
    FROM visitantes v
    JOIN usuarios u ON v.id_usuario = u.id
`;

const visitanteRepository = {
    criar(dados) {
        return new Promise((resolve, reject) => {
            const { id_condominio, id_usuario, nome_visitante, documento, data_prevista, validade_ate } = dados;
            const query = `
                INSERT INTO visitantes (id_condominio, id_usuario, nome_visitante, documento, data_prevista, validade_ate)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            connection.query(query, [id_condominio, id_usuario, nome_visitante, documento, data_prevista, validade_ate], (error, results) => {
                if (error) return reject(error);
                resolve(results.insertId);
            });
        });
    },

    listarPorCondominio(id_condominio) {
        return new Promise((resolve, reject) => {
            const query = `${SELECT_BASE} WHERE v.id_condominio = ? ORDER BY v.data_prevista DESC`;
            connection.query(query, [id_condominio], (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });
    },

    listarPorUsuario(id_condominio, id_usuario) {
        return new Promise((resolve, reject) => {
            const query = `${SELECT_BASE} WHERE v.id_condominio = ? AND v.id_usuario = ? ORDER BY v.data_prevista DESC`;
            connection.query(query, [id_condominio, id_usuario], (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });
    },

    buscarPorId(id) {
        return new Promise((resolve, reject) => {
            connection.query(`${SELECT_BASE} WHERE v.id = ?`, [id], (error, results) => {
                if (error) return reject(error);
                resolve(results.length > 0 ? results[0] : null);
            });
        });
    },

    // Só atualiza se o status atual for o esperado (evita corrida entre portaria e morador).
    atualizarStatus(id, statusAtual, novoStatus) {
        return new Promise((resolve, reject) => {
            const extra = novoStatus === 'ENTROU' ? ', entrada_em = NOW()' : novoStatus === 'SAIU' ? ', saida_em = NOW()' : '';
            const query = `UPDATE visitantes SET status = ?${extra} WHERE id = ? AND status = ?`;
            connection.query(query, [novoStatus, id, statusAtual], (error, results) => {
                if (error) return reject(error);
                resolve(results.affectedRows > 0);
            });
        });
    }
};

module.exports = visitanteRepository;
