const connection = require('./database');

// Lista reuniões marcadas de um condomínio
function buscarPorCondominio(idCondominio) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM reunioes WHERE id_condominio = ? ORDER BY data_hora ASC';
        connection.query(query, [idCondominio], (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
}

// Salva uma nova reunião
function salvar(dados) {
    return new Promise((resolve, reject) => {
        const { id_condominio, titulo, pauta, data_hora, local_link } = dados;
        const query = `
            INSERT INTO reunioes (id_condominio, titulo, pauta, data_hora, local_link) 
            VALUES (?, ?, ?, ?, ?)
        `;
        connection.query(query, [id_condominio, titulo, pauta, data_hora, local_link], (error, results) => {
            if (error) return reject(error);
            resolve({ id: results.insertId, ...dados });
        });
    });
}

// Remove/Cancela uma reunião pelo ID
function remover(id) {
    return new Promise((resolve, reject) => {
        const query = 'DELETE FROM reunioes WHERE id = ?';
        connection.query(query, [id], (error, results) => {
            if (error) return reject(error);
            resolve(results.affectedRows > 0);
        });
    });
}

module.exports = {
    buscarPorCondominio,
    salvar,
    remover
};