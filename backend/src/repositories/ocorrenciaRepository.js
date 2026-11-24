const connection = require('./database');

function executar(query, params) {
    return new Promise((resolve, reject) => {
        connection.query(query, params, (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
}

// Registra uma nova ocorrência
async function salvar(dados) {
    const { id_condominio, id_usuario, titulo, descricao, categoria, data_ocorrencia } = dados;
    const results = await executar(
        `INSERT INTO ocorrencias (id_condominio, id_usuario, titulo, descricao, categoria, data_ocorrencia)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id_condominio, id_usuario, titulo, descricao, categoria, data_ocorrencia]
    );
    return { id: results.insertId, status: 'REGISTRADA', ...dados };
}

// Lista todas as ocorrências de um condomínio (síndico)
function buscarPorCondominio(idCondominio) {
    return executar(
        `SELECT o.*, u.nome AS nome_morador
         FROM ocorrencias o
         JOIN usuarios u ON u.id = o.id_usuario
         WHERE o.id_condominio = ?
         ORDER BY o.criado_em DESC`,
        [idCondominio]
    );
}

// Lista as ocorrências de um morador dentro do condomínio
function buscarPorUsuario(idCondominio, idUsuario) {
    return executar(
        'SELECT * FROM ocorrencias WHERE id_condominio = ? AND id_usuario = ? ORDER BY criado_em DESC',
        [idCondominio, idUsuario]
    );
}

// Atualiza status e resposta; escopo por condomínio. Retorna true se alterou
async function atualizar(idCondominio, id, { status, resposta }) {
    const results = await executar(
        'UPDATE ocorrencias SET status = ?, resposta = ? WHERE id = ? AND id_condominio = ?',
        [status, resposta, id, idCondominio]
    );
    return results.affectedRows > 0;
}

module.exports = { salvar, buscarPorCondominio, buscarPorUsuario, atualizar };
