const connection = require('./database');

// Cria um novo condomínio
function criarCondominio(nome) {
    return new Promise((resolve, reject) => {
        connection.query(
            'INSERT INTO condominios (nome, numero_moradores) VALUES (?, 0)',
            [nome],
            (error, results) => {
                if (error) return reject(error);
                resolve(results.insertId);
            }
        );
    });
}

// Remove um condomínio
function excluirCondominio(id) {
    return new Promise((resolve, reject) => {
        connection.query(
            'DELETE FROM condominios WHERE id = ?',
            [id],
            (error, results) => {
                if (error) return reject(error);
                resolve(results.affectedRows > 0);
            }
        );
    });
}

// Lista todos os condomínios
function listarCondominios() {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT c.*, u.nome AS sindico_nome, u.email AS sindico_email
            FROM condominios c
            LEFT JOIN usuarios u ON c.sindico_responsavel = u.id
        `;
        connection.query(query, (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
}

// Busca condomínio por ID
function buscarPorId(id) {
    return new Promise((resolve, reject) => {
        connection.query(
            'SELECT * FROM condominios WHERE id = ?',
            [id],
            (error, results) => {
                if (error) return reject(error);
                resolve(results[0] || null);
            }
        );
    });
}

// Lista moradores de um condomínio (com filtro opcional por bloco)
function listarMoradores(condominioId, blocoId = null) {
    return new Promise((resolve, reject) => {
        let query = `
            SELECT u.id, u.nome, u.email, u.perfil, u.id_condominio, u.id_bloco, u.bloco, u.unidade, u.status_cadastro, b.nome AS bloco_nome
            FROM usuarios u
            LEFT JOIN blocos b ON u.id_bloco = b.id
            WHERE u.id_condominio = ? AND u.perfil = 'MORADOR'
        `;
        const params = [condominioId];

        if (blocoId) {
            query += ' AND (u.id_bloco = ? OR u.bloco = ?)';
            params.push(blocoId, String(blocoId));
        }

        connection.query(query, params, (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
}

// Vincula um morador a um condomínio e opcionalmente bloco/unidade
function adicionarMoradorAoCondominio(usuarioId, condominioId, blocoId = null, unidade = null) {
    return new Promise((resolve, reject) => {
        const query = `
            UPDATE usuarios 
            SET id_condominio = ?, 
                id_bloco = COALESCE(?, id_bloco), 
                unidade = COALESCE(?, unidade)
            WHERE id = ?
        `;
        connection.query(query, [condominioId, blocoId, unidade, usuarioId], (error, results) => {
            if (error) return reject(error);
            resolve(results.affectedRows > 0);
        });
    });
}

// Define morador em bloco e unidade
function definirMoradorBloco(usuarioId, condominioId, idBloco, blocoNome = null, unidade = null) {
    return new Promise((resolve, reject) => {
        const query = `
            UPDATE usuarios 
            SET id_condominio = ?,
                id_bloco = ?,
                bloco = COALESCE(?, bloco),
                unidade = COALESCE(?, unidade)
            WHERE id = ?
        `;
        connection.query(query, [condominioId, idBloco, blocoNome, unidade, usuarioId], (error, results) => {
            if (error) return reject(error);
            resolve(results.affectedRows > 0);
        });
    });
}

// Atualiza o contador de moradores do condomínio
function recalcularNumeroMoradores(condominioId) {
    return new Promise((resolve, reject) => {
        const query = `
            UPDATE condominios c
            SET numero_moradores = (
                SELECT COUNT(*) FROM usuarios u 
                WHERE u.id_condominio = c.id AND u.perfil = 'MORADOR' AND u.status_cadastro = 'APROVADO'
            )
            WHERE c.id = ?
        `;
        connection.query(query, [condominioId], (error, results) => {
            if (error) return reject(error);
            resolve(results.affectedRows > 0);
        });
    });
}

// Atribui síndico responsável a um condomínio
function atribuirSindicoCondominio(condominioId, usuarioId) {
    return new Promise((resolve, reject) => {
        const query = `
            UPDATE condominios 
            SET sindico_responsavel = ? 
            WHERE id = ?
        `;
        connection.query(query, [usuarioId, condominioId], (error, results) => {
            if (error) return reject(error);
            resolve(results.affectedRows > 0);
        });
    });
}

// Cria um bloco no condomínio
function criarBloco(nome, condominioId) {
    return new Promise((resolve, reject) => {
        connection.query(
            'INSERT INTO blocos (nome, id_condominio) VALUES (?, ?)',
            [nome, condominioId],
            (error, results) => {
                if (error) return reject(error);
                resolve(results.insertId);
            }
        );
    });
}

// Lista blocos de um condomínio
function listarBlocos(condominioId) {
    return new Promise((resolve, reject) => {
        connection.query(
            'SELECT * FROM blocos WHERE id_condominio = ?',
            [condominioId],
            (error, results) => {
                if (error) return reject(error);
                resolve(results);
            }
        );
    });
}

// Atribui gestão de condomínio/bloco (suporta múltiplos condomínios e blocos para gerenciamento)
function atribuirGestor(usuarioId, condominioId, blocoId = null) {
    return new Promise((resolve, reject) => {
        connection.query(
            'INSERT INTO gestores_condominios (usuario_id, condominio_id, bloco_id) VALUES (?, ?, ?)',
            [usuarioId, condominioId, blocoId],
            (error, results) => {
                if (error) return reject(error);
                resolve(results.insertId);
            }
        );
    });
}

// Lista condomínios e blocos gerenciados por um usuário
function listarGerenciamentosUsuario(usuarioId) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT g.id, g.condominio_id, c.nome AS condominio_nome, g.bloco_id, b.nome AS bloco_nome
            FROM gestores_condominios g
            JOIN condominios c ON g.condominio_id = c.id
            LEFT JOIN blocos b ON g.bloco_id = b.id
            WHERE g.usuario_id = ?
        `;
        connection.query(query, [usuarioId], (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
}

module.exports = {
    criarCondominio,
    excluirCondominio,
    listarCondominios,
    buscarPorId,
    listarMoradores,
    adicionarMoradorAoCondominio,
    definirMoradorBloco,
    recalcularNumeroMoradores,
    atribuirSindicoCondominio,
    criarBloco,
    listarBlocos,
    atribuirGestor,
    listarGerenciamentosUsuario
};
