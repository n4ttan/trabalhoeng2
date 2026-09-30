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

// Insere um novo morador no banco com nome, email, senha já tratada, perfil e unidade.
function criarMorador(nome, email, senha, perfil, unidade) {
    return new Promise((resolve, reject) => {
        connection.query(
            'INSERT INTO usuarios (nome, email, senha, perfil, unidade) VALUES (?, ?, ?, ?, ?)',
            [nome, email, senha, perfil, unidade],
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

// Salva o código de validação e sua data de expiração para o usuário informado.
function salvarTokenValidacao(usuarioId, token, expiraEm) {
    return new Promise((resolve, reject) => {
        connection.query(
            'UPDATE usuarios SET token_validacao = ?, token_expira_em = ?, tentativas_validacao = 0 WHERE id = ?',
            [token, expiraEm, usuarioId],
            (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(results.affectedRows);
            }
        );
    });
}

// Busca um usuário pelo e-mail, usado para validar o token informado.
function buscarPorEmail(email) {
    return new Promise((resolve, reject) => {
        connection.query(
            'SELECT * FROM usuarios WHERE email = ?',
            [email],
            (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(results[0]);
            }
        );
    });
}

// Consome uma tentativa de validação só se ainda houver limite; devolve true se reservou.
function reservarTentativaValidacao(usuarioId, maximo) {
    return new Promise((resolve, reject) => {
        connection.query(
            `UPDATE usuarios
             SET tentativas_validacao = tentativas_validacao + 1
             WHERE id = ? AND status_cadastro = 'AGUARDANDO_EMAIL' AND tentativas_validacao < ?`,
            [usuarioId, maximo],
            (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(results.affectedRows > 0);
            }
        );
    });
}

// Confirma o token e avança o status do cadastro para pendente de aprovação.
function confirmarEmail(usuarioId) {
    return new Promise((resolve, reject) => {
        connection.query(
            `UPDATE usuarios
             SET status_cadastro = 'PENDENTE_APROVACAO', token_validacao = NULL, token_expira_em = NULL,
                 tentativas_validacao = 0
             WHERE id = ? AND status_cadastro = 'AGUARDANDO_EMAIL'`,
            [usuarioId],
            (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(results.affectedRows);
            }
        );
    });
}

// Lista os moradores que já validaram o e-mail e aguardam aprovação do síndico.
function listarPendentes() {
    return new Promise((resolve, reject) => {
        connection.query(
            "SELECT id, nome, email, unidade, status_cadastro FROM usuarios WHERE status_cadastro = 'PENDENTE_APROVACAO'",
            (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(results);
            }
        );
    });
}

// Aprova um morador pendente; devolve true se alguma linha foi alterada.
function aprovarMorador(usuarioId) {
    return new Promise((resolve, reject) => {
        connection.query(
            "UPDATE usuarios SET status_cadastro = 'APROVADO' WHERE id = ? AND status_cadastro = 'PENDENTE_APROVACAO'",
            [usuarioId],
            (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(results.affectedRows > 0);
            }
        );
    });
}

// Rejeita um morador pendente; devolve true se alguma linha foi alterada.
function rejeitarMorador(usuarioId) {
    return new Promise((resolve, reject) => {
        connection.query(
            "UPDATE usuarios SET status_cadastro = 'REJEITADO' WHERE id = ? AND status_cadastro = 'PENDENTE_APROVACAO'",
            [usuarioId],
            (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(results.affectedRows > 0);
            }
        );
    });
}

module.exports = {
    criarUsuario,
    criarMorador,
    excluirUsuarioEPedido,
    salvarTokenValidacao,
    buscarPorEmail,
    reservarTentativaValidacao,
    confirmarEmail,
    listarPendentes,
    aprovarMorador,
    rejeitarMorador
};
