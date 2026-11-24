const relatorioRepository = require('../repositories/relatorioRepository');

function erro(mensagem, status) {
    const e = new Error(mensagem);
    e.status = status;
    return e;
}

function agoraLocal() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

const relatorioService = {
    async obterRelatorio(idCondominio, usuario) {
        const id = Number(idCondominio);
        if (!Number.isInteger(id) || id <= 0) {
            throw erro('Condomínio inválido.', 400);
        }
        if (!usuario || (usuario.perfil !== 'ADMIN' && usuario.perfil !== 'SINDICO')) {
            throw erro('Acesso negado. Apenas síndicos podem ver relatórios.', 403);
        }
        if (usuario.perfil === 'SINDICO' && Number(usuario.id_condominio) !== id) {
            throw erro('Acesso negado. Você só acessa relatórios do seu condomínio.', 403);
        }

        const [moradores, boletos, churrasqueira, salao, reunioes, notificacoes] = await Promise.all([
            relatorioRepository.moradoresPorStatus(id),
            relatorioRepository.boletosPorStatus(id),
            relatorioRepository.reservasPorMes(id, 'reservas_churrasqueira'),
            relatorioRepository.reservasPorMes(id, 'reservas_salao'),
            relatorioRepository.reunioesFuturas(id, agoraLocal()),
            relatorioRepository.notificacoesPorTipo(id)
        ]);

        const boleto = (situacao) => {
            const b = boletos.find((x) => x.situacao === situacao);
            return { quantidade: Number(b?.quantidade || 0), valor: Number(b?.valor_total || 0) };
        };

        const meses = [...new Set([...churrasqueira, ...salao].map((r) => r.mes))].sort();
        const total = (lista, mes) => Number(lista.find((r) => r.mes === mes)?.total || 0);

        const porTipo = notificacoes.map((n) => ({ tipo: n.tipo, total: Number(n.total) }));

        return {
            id_condominio: id,
            moradoresPorStatus: moradores.map((m) => ({ status: m.status, total: Number(m.total) })),
            boletos: {
                pagos: boleto('PAGO'),
                pendentes: boleto('PENDENTE'),
                vencidos: boleto('VENCIDO')
            },
            reservasPorMes: meses.map((mes) => ({
                mes,
                churrasqueira: total(churrasqueira, mes),
                salao: total(salao, mes)
            })),
            reunioesFuturas: reunioes,
            notificacoes: {
                total: porTipo.reduce((s, n) => s + n.total, 0),
                porTipo
            }
        };
    }
};

module.exports = relatorioService;
