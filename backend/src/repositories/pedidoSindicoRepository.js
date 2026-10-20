const connection = require('./database');

// Cria um registro de pedido de síndico para o usuário informado e condomínio específico.
function criarPedidoSindico(usuarioId, condominioId) {
    return new Promise((resolve, reject) => {
        const query = `
            INSERT INTO pedidos_sindico (usuario_id, condominio_id, deferido) 
            VALUES (?, ?, FALSE)
        `;

        connection.query(query, [usuarioId, condominioId], (error, results) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(results.insertId);
        });
    });
}

// Aprova um pedido pendente, atualiza o perfil do usuário para SINDICO,
// vincula o id_condominio ao usuário e define o sindico_responsavel no condomínio.
function aprovarPedidoSindico(pedidoId) {
    return new Promise((resolve, reject) => {
        connection.beginTransaction((error) => {
            if (error) {
                reject(error);
                return;
            }

            const buscarPedido = `
                SELECT usuario_id, condominio_id 
                FROM pedidos_sindico 
                WHERE id = ? AND deferido = FALSE
            `;

            connection.query(buscarPedido, [pedidoId], (error, pedidos) => {
                if (error) {
                    return connection.rollback(() => reject(error));
                }

                if (!pedidos || pedidos.length === 0) {
                    return connection.rollback(() => resolve(false));
                }

                const pedido = pedidos[0];

                const atualizarPedido = `
                    UPDATE pedidos_sindico
                    SET deferido = TRUE
                    WHERE id = ?
                `;

                connection.query(atualizarPedido, [pedidoId], (error) => {
                    if (error) {
                        return connection.rollback(() => reject(error));
                    }

                    const atualizarUsuario = `
                        UPDATE usuarios
                        SET perfil = 'SINDICO', id_condominio = ?
                        WHERE id = ?
                    `;

                    connection.query(atualizarUsuario, [pedido.condominio_id, pedido.usuario_id], (error) => {
                        if (error) {
                            return connection.rollback(() => reject(error));
                        }

                        const atualizarCondominio = `
                            UPDATE condominios
                            SET sindico_responsavel = ?
                            WHERE id = ?
                        `;

                        connection.query(atualizarCondominio, [pedido.usuario_id, pedido.condominio_id], (error) => {
                            if (error) {
                                return connection.rollback(() => reject(error));
                            }

                            connection.commit((error) => {
                                if (error) {
                                    return connection.rollback(() => reject(error));
                                }
                                resolve(true);
                            });
                        });
                    });
                });
            });
        });
    });
}

function reprovarPedidoSindico(pedidoId) {
    return new Promise((resolve, reject) => {
        const query = `
            UPDATE pedidos_sindico
            SET deferido = FALSE
            WHERE id = ?
        `;

        connection.query(query, [pedidoId], (error, results) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(results.affectedRows > 0);
        });
    });
}

module.exports = {
    criarPedidoSindico,
    aprovarPedidoSindico,
    reprovarPedidoSindico
};
