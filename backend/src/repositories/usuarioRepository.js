const connection = require('./database');

// Insere um novo usuário no banco com nome, email, senha já tratada e perfil.
function criarUsuario(nome, email, senha, perfil) {
    return new Promise((resolve, reject) => {
        connection.query(
            'INSERT INTO usuarios (nome, email, senha, perfil) VALUES (?, ?, ?, ?)',
            [nome, email, senha, perfil],
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

// Remove primeiro os pedidos de síndico ligados ao usuário e depois exclui o usuário.
// Essa ordem evita dados órfãos no banco quando um usuário é apagado.
function excluirUsuarioEPedido(usuarioId) {
    return new Promise((resolve, reject) => {
        connection.query(
            'DELETE FROM pedidos_sindico WHERE usuario_id = ?',
            [usuarioId],
            (error) => {
                if (error) {
                    reject(error);
                    return;
                }

                connection.query(
                    'DELETE FROM usuarios WHERE id = ?',
                    [usuarioId],
                    (error, results) => {
                        if (error) {
                            reject(error);
                            return;
                        }

                        resolve(results.affectedRows);
                    }
                );
            }
        );
    });
}

module.exports = {
    criarUsuario,
    excluirUsuarioEPedido
};