const connection = require('./database');

// Cria um registro de pedido de síndico para o usuário informado.
function criarPedidoSindico(usuario_id, deferido) {
    return new Promise((resolve, reject) => {
        connection.query(
            'INSERT INTO pedidos_sindico (usuario_id, deferido) VALUES (?, ?)',
            [usuario_id, deferido],
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

// Aprova um pedido pendente e atualiza o perfil do usuário em uma transação.
// A transação garante que as duas operações aconteçam juntas: atualizar o pedido
// e atualizar o usuário. Caso qualquer etapa falhe, tudo é revertido.
function aprovarPedidoSindico(pedidoId) {
    return new Promise((resolve, reject) => {
        connection.beginTransaction((error) => {
            if (error) {
                reject(error);
                return;
            }

            const atualizarPedido = `
                UPDATE pedidos_sindico
                SET deferido = TRUE
                WHERE id = ?
            `;

            connection.query(
                atualizarPedido,
                [pedidoId],
                (error, resultadoPedido) => {
                    if (error) {
                        return connection.rollback(() => {
                            reject(error);
                        });
                    }

                    // Se o pedido não existe ou não está pendente, cancela a transação.
                    if (resultadoPedido.affectedRows === 0) {
                        return connection.rollback(() => {
                            resolve(false);
                        });
                    }

                    const atualizarUsuario = `
                        UPDATE usuarios u
                        JOIN pedidos_sindico p ON p.usuario_id = u.id
                        SET u.perfil = 'SINDICO'
                        WHERE p.id = ?
                    `;

                    connection.query(
                        atualizarUsuario,
                        [pedidoId],
                        (error) => {
                            if (error) {
                                return connection.rollback(() => {
                                    reject(error);
                                });
                            }

                            connection.commit((error) => {
                                if (error) {
                                    return connection.rollback(() => {
                                        reject(error);
                                    });
                                }

                                resolve(true);
                            });
                        }
                    );
                }
            );
        });
    });
}

module.exports = {
    criarPedidoSindico,
    aprovarPedidoSindico
};