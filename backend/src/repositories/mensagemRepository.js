const connection = require('./database');

function criarPedidoSindico(usuarioId) {
    return new Promise((resolve, reject) => {
        connection.query(
            'INSERT INTO pedidos_sindico (usuario_id) VALUES (?)',
            [usuarioId],
            (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(results.insertId);
            }
        );
    });
}

module.exports = {
    criarPedidoSindico
};