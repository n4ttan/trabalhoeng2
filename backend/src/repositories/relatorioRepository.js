const connection = require('./database');

function consultar(sql, params) {
    return new Promise((resolve, reject) => {
        connection.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
    });
}

const relatorioRepository = {
    moradoresPorStatus(idCondominio) {
        return consultar(
            `SELECT status_cadastro AS status, COUNT(*) AS total
             FROM usuarios WHERE id_condominio = ? AND perfil = 'MORADOR'
             GROUP BY status_cadastro`,
            [idCondominio]
        );
    },

    // Separa PENDENTE em "a vencer" e "vencido" (vencimento passado); ATRASADO conta como vencido.
    boletosPorStatus(idCondominio) {
        return consultar(
            `SELECT
                CASE
                    WHEN status = 'ATRASADO' OR (status = 'PENDENTE' AND data_vencimento < CURDATE()) THEN 'VENCIDO'
                    ELSE status
                END AS situacao,
                COUNT(*) AS quantidade,
                COALESCE(SUM(valor), 0) AS valor_total
             FROM boletos WHERE id_condominio = ? AND status <> 'CANCELADO'
             GROUP BY situacao`,
            [idCondominio]
        );
    },

    // data_reserva é VARCHAR 'YYYY-MM-DD': o mês é o prefixo de 7 caracteres.
    reservasPorMes(idCondominio, tabela) {
        if (tabela !== 'reservas_churrasqueira' && tabela !== 'reservas_salao') {
            throw new Error('Tabela de reservas inválida.');
        }
        return consultar(
            `SELECT SUBSTRING(data_reserva, 1, 7) AS mes, COUNT(*) AS total
             FROM ${tabela} WHERE id_condominio = ? AND status <> 'CANCELADA'
             GROUP BY mes ORDER BY mes`,
            [idCondominio]
        );
    },

    reunioesFuturas(idCondominio, agora) {
        return consultar(
            'SELECT * FROM reunioes WHERE id_condominio = ? AND data_hora >= ? ORDER BY data_hora',
            [idCondominio, agora]
        );
    },

    notificacoesPorTipo(idCondominio) {
        return consultar(
            `SELECT tipo, COUNT(*) AS total
             FROM notificacoes WHERE escopo = 'CONDOMINIO' AND condominio_id = ? GROUP BY tipo`,
            [idCondominio]
        );
    }
};

module.exports = relatorioRepository;
