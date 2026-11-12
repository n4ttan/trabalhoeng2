const connection = require('./database');

const boletoRepository = {
    criarBoleto(dados) {
        return new Promise((resolve, reject) => {
            const {
                id_condominio,
                id_usuario,
                mes_referencia,
                valor,
                data_vencimento,
                status = 'PENDENTE',
                codigo_barras,
                linha_digitavel
            } = dados;

            const query = `
                INSERT INTO boletos (
                    id_condominio,
                    id_usuario,
                    mes_referencia,
                    valor,
                    data_vencimento,
                    status,
                    codigo_barras,
                    linha_digitavel
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            connection.query(
                query,
                [
                    id_condominio,
                    id_usuario,
                    mes_referencia,
                    valor,
                    data_vencimento,
                    status,
                    codigo_barras,
                    linha_digitavel
                ],
                (error, results) => {
                    if (error) return reject(error);
                    resolve(results.insertId);
                }
            );
        });
    },

    buscarPorId(id) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    b.*,
                    u.nome AS usuario_nome,
                    u.email AS usuario_email,
                    u.unidade,
                    u.bloco,
                    c.nome AS condominio_nome
                FROM boletos b
                JOIN usuarios u ON b.id_usuario = u.id
                JOIN condominios c ON b.id_condominio = c.id
                WHERE b.id = ?
            `;
            connection.query(query, [id], (error, results) => {
                if (error) return reject(error);
                resolve(results.length > 0 ? results[0] : null);
            });
        });
    },

    listarPorCondominio(id_condominio, filtros = {}) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT 
                    b.*,
                    u.nome AS usuario_nome,
                    u.email AS usuario_email,
                    u.unidade,
                    u.bloco,
                    c.nome AS condominio_nome
                FROM boletos b
                JOIN usuarios u ON b.id_usuario = u.id
                JOIN condominios c ON b.id_condominio = c.id
                WHERE b.id_condominio = ?
            `;
            const params = [id_condominio];

            if (filtros.status) {
                query += ' AND b.status = ?';
                params.push(filtros.status);
            }

            if (filtros.usuario_id) {
                query += ' AND b.id_usuario = ?';
                params.push(filtros.usuario_id);
            }

            if (filtros.mes_referencia) {
                query += ' AND b.mes_referencia = ?';
                params.push(filtros.mes_referencia);
            }

            query += ' ORDER BY b.data_vencimento DESC, b.id DESC';

            connection.query(query, params, (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });
    },

    listarPorUsuarioECondominio(id_usuario, id_condominio) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    b.*,
                    u.nome AS usuario_nome,
                    u.email AS usuario_email,
                    u.unidade,
                    u.bloco,
                    c.nome AS condominio_nome
                FROM boletos b
                JOIN usuarios u ON b.id_usuario = u.id
                JOIN condominios c ON b.id_condominio = c.id
                WHERE b.id_usuario = ? AND b.id_condominio = ?
                ORDER BY b.data_vencimento DESC, b.id DESC
            `;
            connection.query(query, [id_usuario, id_condominio], (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });
    },

    registrarPagamento(id, dadosPagamento) {
        return new Promise((resolve, reject) => {
            const { valor_pago, forma_pagamento, codigo_autenticacao } = dadosPagamento;
            const query = `
                UPDATE boletos
                SET 
                    status = 'PAGO',
                    data_pagamento = CURRENT_TIMESTAMP,
                    valor_pago = ?,
                    forma_pagamento = ?,
                    codigo_autenticacao = ?
                WHERE id = ?
            `;
            connection.query(
                query,
                [valor_pago, forma_pagamento || 'BOLETO_BANCARIO', codigo_autenticacao, id],
                (error, results) => {
                    if (error) return reject(error);
                    resolve(results.affectedRows > 0);
                }
            );
        });
    },

    registrarSegundaVia(id, novaDataVencimento = null, codigoBarras = null, linhaDigitavel = null) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE boletos
                SET 
                    segunda_via_emitida_em = CURRENT_TIMESTAMP,
                    data_vencimento = COALESCE(?, data_vencimento),
                    codigo_barras = COALESCE(?, codigo_barras),
                    linha_digitavel = COALESCE(?, linha_digitavel)
                WHERE id = ?
            `;
            connection.query(
                query,
                [novaDataVencimento, codigoBarras, linhaDigitavel, id],
                (error, results) => {
                    if (error) return reject(error);
                    resolve(results.affectedRows > 0);
                }
            );
        });
    },

    obterResumoPagamentos(id_condominio) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    COUNT(*) AS total_boletos,
                    COALESCE(SUM(CASE WHEN status = 'PAGO' THEN 1 ELSE 0 END), 0) AS total_pagas,
                    COALESCE(SUM(CASE WHEN status = 'PAGO' THEN valor_pago ELSE 0 END), 0) AS valor_total_pago,
                    COALESCE(SUM(CASE WHEN status = 'PENDENTE' AND data_vencimento >= CURDATE() THEN 1 ELSE 0 END), 0) AS total_pendentes,
                    COALESCE(SUM(CASE WHEN status = 'PENDENTE' AND data_vencimento >= CURDATE() THEN valor ELSE 0 END), 0) AS valor_total_pendente,
                    COALESCE(SUM(CASE WHEN status = 'ATRASADO' OR (status = 'PENDENTE' AND data_vencimento < CURDATE()) THEN 1 ELSE 0 END), 0) AS total_atrasadas,
                    COALESCE(SUM(CASE WHEN status = 'ATRASADO' OR (status = 'PENDENTE' AND data_vencimento < CURDATE()) THEN valor ELSE 0 END), 0) AS valor_total_atrasado
                FROM boletos
                WHERE id_condominio = ?
            `;
            connection.query(query, [id_condominio], (error, results) => {
                if (error) return reject(error);
                resolve(results[0]);
            });
        });
    },

    buscarInadimplentes(id_condominio) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    b.id AS boleto_id,
                    b.mes_referencia,
                    b.valor,
                    b.data_vencimento,
                    b.status,
                    u.id AS usuario_id,
                    u.nome AS usuario_nome,
                    u.email AS usuario_email,
                    u.unidade,
                    u.bloco
                FROM boletos b
                JOIN usuarios u ON b.id_usuario = u.id
                WHERE b.id_condominio = ?
                  AND b.status IN ('PENDENTE', 'ATRASADO')
                ORDER BY u.id ASC, b.data_vencimento ASC
            `;
            connection.query(query, [id_condominio], (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });
    },

    buscarMoradoresCondominio(id_condominio) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT id, nome, email, unidade, bloco
                FROM usuarios
                WHERE id_condominio = ?
                  AND perfil = 'MORADOR'
                  AND status_cadastro = 'APROVADO'
            `;
            connection.query(query, [id_condominio], (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });
    }
};

module.exports = boletoRepository;
