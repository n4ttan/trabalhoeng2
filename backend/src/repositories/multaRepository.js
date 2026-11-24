const connection = require('./database');

function executar(query, params) {
    return new Promise((resolve, reject) => {
        connection.query(query, params, (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
}

// Morador do condomínio (escopo da multa)
async function buscarMorador(idUsuario, idCondominio) {
    const rows = await executar(
        `SELECT id FROM usuarios WHERE id = ? AND id_condominio = ? AND perfil = 'MORADOR'`,
        [idUsuario, idCondominio]
    );
    return rows[0] || null;
}

async function salvar({ id_condominio, id_usuario, valor, motivo, data_multa }) {
    const results = await executar(
        'INSERT INTO multas (id_condominio, id_usuario, valor, motivo, data_multa) VALUES (?, ?, ?, ?, ?)',
        [id_condominio, id_usuario, valor, motivo, data_multa]
    );
    return { id: results.insertId, id_condominio, id_usuario, valor, motivo, data_multa, status: 'PENDENTE' };
}

function listarPorCondominio(idCondominio) {
    return executar(
        `SELECT m.*, u.nome AS nome_morador, u.bloco, u.unidade
         FROM multas m JOIN usuarios u ON m.id_usuario = u.id
         WHERE m.id_condominio = ? ORDER BY m.data_multa DESC, m.id DESC`,
        [idCondominio]
    );
}

function listarPorUsuario(idCondominio, idUsuario) {
    return executar(
        'SELECT * FROM multas WHERE id_condominio = ? AND id_usuario = ? ORDER BY data_multa DESC, id DESC',
        [idCondominio, idUsuario]
    );
}

async function buscarPorId(id) {
    const rows = await executar('SELECT * FROM multas WHERE id = ?', [id]);
    return rows[0] || null;
}

async function atualizarStatus(id, status) {
    const results = await executar('UPDATE multas SET status = ? WHERE id = ?', [status, id]);
    return results.affectedRows > 0;
}

module.exports = { buscarMorador, salvar, listarPorCondominio, listarPorUsuario, buscarPorId, atualizarStatus };
