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

// Salva o código de validação e sua data de expiração para o usuário informado.
function salvarTokenValidacao(usuarioId, token, expiraEm) {
    return new Promise((resolve, reject) => {
        connection.query(
            'UPDATE usuarios SET token_validacao = ?, token_expira_em = ? WHERE id = ?',
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

// Confirma o token e avança o status do cadastro para pendente de aprovação.
function confirmarEmail(usuarioId) {
    return new Promise((resolve, reject) => {
        connection.query(
            `UPDATE usuarios
             SET status_cadastro = 'PENDENTE_APROVACAO', token_validacao = NULL, token_expira_em = NULL
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

async function listarPendentes() {
  const [rows] = await db.query(
    "SELECT id, nome, email, unidade, status_cadastro FROM usuarios WHERE status_cadastro = 'PENDENTE_APROVACAO'"
  );
  return rows;
}

async function aprovarMorador(usuarioId) {
  const [result] = await db.query(
    "UPDATE usuarios SET status_cadastro = 'APROVADO' WHERE id = ? AND status_cadastro = 'PENDENTE_APROVACAO'",
    [usuarioId]
  );
  return result.affectedRows > 0;
}

async function rejeitarMorador(usuarioId) {
  const [result] = await db.query(
    "UPDATE usuarios SET status_cadastro = 'REJEITADO' WHERE id = ? AND status_cadastro = 'PENDENTE_APROVACAO'",
    [usuarioId]
  );
  return result.affectedRows > 0;
}

module.exports = {
    criarUsuario,
    excluirUsuarioEPedido,
    salvarTokenValidacao,
    buscarPorEmail,
    confirmarEmail,
    listarPendentes,
    aprovarMorador,
    rejeitarMorador
};
