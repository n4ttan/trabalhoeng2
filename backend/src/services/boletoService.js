const boletoRepository = require('../repositories/boletoRepository');
const notificacaoRepository = require('../repositories/notificacaoRepository');
const { getIO } = require('../socket');

function gerarCodigoBarras(idCondominio, idUsuario, valor) {
    const banco = '033'; // Banco Santander / Genérico
    const moeda = '9';
    const fatorVencimento = '9999';
    const valorFormatado = Math.round(Number(valor) * 100).toString().padStart(10, '0');
    const campoLivre = `${idCondominio.toString().padStart(5, '0')}${idUsuario.toString().padStart(5, '0')}${Date.now().toString().slice(-14)}`;
    return `${banco}${moeda}${fatorVencimento}${valorFormatado}${campoLivre}`.slice(0, 44);
}

function gerarLinhaDigitavel(codigoBarras) {
    if (!codigoBarras || codigoBarras.length < 44) {
        return '03399.12345 67890.123456 78901.234567 1 99990000000000';
    }
    const campo1 = `${codigoBarras.slice(0, 4)}${codigoBarras.slice(19, 24)}`;
    const campo2 = codigoBarras.slice(24, 34);
    const campo3 = codigoBarras.slice(34, 44);
    const campo4 = codigoBarras.slice(4, 5); // Dígito verificador geral
    const campo5 = `${codigoBarras.slice(5, 9)}${codigoBarras.slice(9, 19)}`;

    return `${campo1.slice(0, 5)}.${campo1.slice(5)} ${campo2.slice(0, 5)}.${campo2.slice(5)} ${campo3.slice(0, 5)}.${campo3.slice(5)} ${campo4} ${campo5}`;
}

function gerarCodigoAutenticacao() {
    const timestamp = Date.now().toString(16).toUpperCase();
    const randomHex = Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
    return `AUTH-${timestamp}-${randomHex}`;
}

function formatarDataISO(data) {
    if (!data) return '';
    if (data instanceof Date) {
        return data.toISOString().split('T')[0];
    }
    return String(data).split('T')[0];
}

function calcularMultaEJuros(valorOriginal, dataVencimentoStr) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const vencimento = new Date(dataVencimentoStr);
    vencimento.setHours(0, 0, 0, 0);

    if (hoje <= vencimento) {
        return {
            estaAtrasado: false,
            diasAtraso: 0,
            multa: 0,
            juros: 0,
            valorTotal: Number(valorOriginal)
        };
    }

    const diffTempo = hoje.getTime() - vencimento.getTime();
    const diasAtraso = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));

    // Multa padrão de 2%
    const multa = Number((Number(valorOriginal) * 0.02).toFixed(2));
    // Juros de 1% ao mês (pro-rata die ~ 0.033% ao dia)
    const juros = Number((Number(valorOriginal) * 0.01 * (diasAtraso / 30)).toFixed(2));
    const valorTotal = Number((Number(valorOriginal) + multa + juros).toFixed(2));

    return {
        estaAtrasado: true,
        diasAtraso,
        multa,
        juros,
        valorTotal
    };
}

function gerarTemplateHTML(boleto, dadosCalculo, novaDataVencimento) {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Boleto Condominial - 2ª Via</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .boleto-container { border: 2px solid #000; padding: 20px; max-width: 700px; margin: 0 auto; }
        .cabecalho { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
        .linha-digitavel { font-size: 1.1em; font-weight: bold; text-align: right; letter-spacing: 1px; }
        .campo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
        .campo { border: 1px solid #ccc; padding: 6px; }
        .campo-label { font-size: 0.75em; text-transform: uppercase; color: #666; font-weight: bold; }
        .campo-valor { font-size: 1em; font-weight: bold; margin-top: 3px; }
        .total { background: #f0f4f8; border: 2px solid #0056b3; }
        .instrucoes { border: 1px dashed #666; padding: 10px; margin-top: 15px; font-size: 0.85em; }
        .codigo-barras { margin-top: 20px; text-align: center; letter-spacing: 5px; font-family: monospace; font-size: 1.2em; font-weight: bold; background: #eee; padding: 10px; }
    </style>
</head>
<body>
    <div class="boleto-container">
        <div class="cabecalho">
            <h2>${boleto.condominio_nome || 'Condomínio'} - 2ª Via do Boleto</h2>
            <div class="linha-digitavel">${boleto.linha_digitavel}</div>
        </div>
        <div class="campo-grid">
            <div class="campo">
                <div class="campo-label">Sacado (Morador)</div>
                <div class="campo-valor">${boleto.usuario_nome} - Unidade: ${boleto.unidade || 'N/A'} (Bloco: ${boleto.bloco || 'N/A'})</div>
            </div>
            <div class="campo">
                <div class="campo-label">Vencimento Original</div>
                <div class="campo-valor">${formatarDataISO(boleto.data_vencimento)}</div>
            </div>
            <div class="campo">
                <div class="campo-label">Mês de Referência</div>
                <div class="campo-valor">${boleto.mes_referencia}</div>
            </div>
            <div class="campo">
                <div class="campo-label">Novo Vencimento (2ª Via)</div>
                <div class="campo-valor" style="color: #c00;">${novaDataVencimento}</div>
            </div>
            <div class="campo">
                <div class="campo-label">Valor Original</div>
                <div class="campo-valor">R$ ${Number(boleto.valor).toFixed(2)}</div>
            </div>
            <div class="campo total">
                <div class="campo-label">Valor a Pagar (com Encargos)</div>
                <div class="campo-valor" style="color: #0056b3;">R$ ${dadosCalculo.valorTotal.toFixed(2)}</div>
            </div>
        </div>
        <div class="instrucoes">
            <strong>Instruções de Pagamento:</strong><br>
            • Multa de 2% (R$ ${dadosCalculo.multa.toFixed(2)}) e juros de mora (R$ ${dadosCalculo.juros.toFixed(2)}) inclusos no valor total.<br>
            • Pagável em qualquer banco, casa lotérica ou aplicativo bancário até o novo vencimento.<br>
            • Após o novo vencimento, solicite uma nova atualização de 2ª via pelo portal do condomínio.
        </div>
        <div class="codigo-barras">
            ||| | ||||| |||| || |||||| | |||| ||| |||||||
            <div>${boleto.codigo_barras}</div>
        </div>
    </div>
</body>
</html>
    `.trim();
}

const boletoService = {
    async criarBoleto(dados, solicitante) {
        const { id_condominio, id_usuario, mes_referencia, valor, data_vencimento } = dados;

        if (!id_condominio || !id_usuario || !mes_referencia || !valor || !data_vencimento) {
            const erro = new Error('Campos obrigatórios: id_condominio, id_usuario, mes_referencia, valor, data_vencimento.');
            erro.status = 400;
            throw erro;
        }

        const valorNum = Number(valor);
        if (isNaN(valorNum) || valorNum <= 0) {
            const erro = new Error('Valor do boleto inválido.');
            erro.status = 400;
            throw erro;
        }

        const codigo_barras = dados.codigo_barras || gerarCodigoBarras(id_condominio, id_usuario, valorNum);
        const linha_digitavel = dados.linha_digitavel || gerarLinhaDigitavel(codigo_barras);

        const id = await boletoRepository.criarBoleto({
            id_condominio: Number(id_condominio),
            id_usuario: Number(id_usuario),
            mes_referencia: String(mes_referencia).trim(),
            valor: valorNum,
            data_vencimento: formatarDataISO(data_vencimento),
            status: 'PENDENTE',
            codigo_barras,
            linha_digitavel
        });

        return await boletoRepository.buscarPorId(id);
    },

    async gerarBoletosEmLote(dados, solicitante) {
        const { id_condominio, mes_referencia, valor, data_vencimento } = dados;

        if (!id_condominio || !mes_referencia || !valor || !data_vencimento) {
            const erro = new Error('Campos obrigatórios: id_condominio, mes_referencia, valor, data_vencimento.');
            erro.status = 400;
            throw erro;
        }

        const moradores = await boletoRepository.buscarMoradoresCondominio(Number(id_condominio));

        if (!moradores || moradores.length === 0) {
            return {
                mensagem: 'Nenhum morador aprovado encontrado para este condomínio.',
                total_gerados: 0,
                boletos: []
            };
        }

        const boletosGerados = [];
        for (const morador of moradores) {
            const boleto = await this.criarBoleto(
                {
                    id_condominio,
                    id_usuario: morador.id,
                    mes_referencia,
                    valor,
                    data_vencimento
                },
                solicitante
            );
            boletosGerados.push(boleto);
        }

        return {
            mensagem: `${boletosGerados.length} boletos gerados com sucesso para o mês ${mes_referencia}.`,
            total_gerados: boletosGerados.length,
            boletos: boletosGerados
        };
    },

    async obterSegundaVia(boletoId, usuario) {
        const idNum = Number(boletoId);
        if (!idNum) {
            const erro = new Error('ID do boleto inválido.');
            erro.status = 400;
            throw erro;
        }

        const boleto = await boletoRepository.buscarPorId(idNum);
        if (!boleto) {
            const erro = new Error('Boleto não encontrado.');
            erro.status = 404;
            throw erro;
        }

        // Permissão: Morador só pode emitir segunda via do próprio boleto e do próprio condomínio
        if (usuario.perfil === 'MORADOR') {
            if (Number(usuario.id_condominio) !== Number(boleto.id_condominio) || Number(usuario.id) !== Number(boleto.id_usuario)) {
                const erro = new Error('Acesso negado. Você só pode acessar seus próprios boletos.');
                erro.status = 403;
                throw erro;
            }
        } else if (usuario.perfil === 'SINDICO') {
            if (Number(usuario.id_condominio) !== Number(boleto.id_condominio)) {
                const erro = new Error('Acesso negado. Você só gerencia boletos do seu respectivo condomínio.');
                erro.status = 403;
                throw erro;
            }
        }

        if (boleto.status === 'CANCELADO') {
            const erro = new Error('Boleto cancelado. Não é possível gerar segunda via.');
            erro.status = 400;
            throw erro;
        }

        const calculo = calcularMultaEJuros(boleto.valor, boleto.data_vencimento);

        // Se estiver atrasado, estende o vencimento para daqui a 3 dias úteis (ou hoje se preferir)
        let novaDataVencimento = formatarDataISO(boleto.data_vencimento);
        let novoCodigoBarras = boleto.codigo_barras;
        let novaLinhaDigitavel = boleto.linha_digitavel;

        if (calculo.estaAtrasado && boleto.status !== 'PAGO') {
            const dataProrrogada = new Date();
            dataProrrogada.setDate(dataProrrogada.getDate() + 3);
            novaDataVencimento = formatarDataISO(dataProrrogada);

            novoCodigoBarras = gerarCodigoBarras(boleto.id_condominio, boleto.id_usuario, calculo.valorTotal);
            novaLinhaDigitavel = gerarLinhaDigitavel(novoCodigoBarras);

            await boletoRepository.registrarSegundaVia(
                idNum,
                novaDataVencimento,
                novoCodigoBarras,
                novaLinhaDigitavel
            );
        } else {
            await boletoRepository.registrarSegundaVia(idNum);
        }

        const templateHTML = gerarTemplateHTML(
            {
                ...boleto,
                codigo_barras: novoCodigoBarras,
                linha_digitavel: novaLinhaDigitavel
            },
            calculo,
            novaDataVencimento
        );

        return {
            mensagem: 'Segunda via do boleto gerada com sucesso.',
            boleto: {
                id: boleto.id,
                id_condominio: boleto.id_condominio,
                condominio_nome: boleto.condominio_nome,
                id_usuario: boleto.id_usuario,
                morador_nome: boleto.usuario_nome,
                morador_email: boleto.usuario_email,
                unidade: boleto.unidade,
                bloco: boleto.bloco,
                mes_referencia: boleto.mes_referencia,
                valor_original: Number(boleto.valor),
                multa: calculo.multa,
                juros: calculo.juros,
                valor_total: calculo.valorTotal,
                data_vencimento_original: formatarDataISO(boleto.data_vencimento),
                nova_data_vencimento: novaDataVencimento,
                codigo_barras: novoCodigoBarras,
                linha_digitavel: novaLinhaDigitavel,
                status: boleto.status,
                segunda_via: true,
                template_html: templateHTML
            }
        };
    },

    async pagarBoleto(boletoId, dadosPagamento, usuario) {
        const idNum = Number(boletoId);
        if (!idNum) {
            const erro = new Error('ID do boleto inválido.');
            erro.status = 400;
            throw erro;
        }

        const boleto = await boletoRepository.buscarPorId(idNum);
        if (!boleto) {
            const erro = new Error('Boleto não encontrado.');
            erro.status = 404;
            throw erro;
        }

        // Validação estrita de morador e seu respectivo condomínio
        if (usuario.perfil === 'MORADOR') {
            if (Number(usuario.id_condominio) !== Number(boleto.id_condominio)) {
                const erro = new Error('Acesso negado. Você só pode acessar o seu próprio condomínio.');
                erro.status = 403;
                throw erro;
            }
            if (Number(usuario.id) !== Number(boleto.id_usuario)) {
                const erro = new Error('Acesso negado. Você só pode pagar boletos da sua própria residência.');
                erro.status = 403;
                throw erro;
            }
        }

        if (boleto.status === 'PAGO') {
            const erro = new Error('Este boleto já foi pago.');
            erro.status = 400;
            throw erro;
        }

        if (boleto.status === 'CANCELADO') {
            const erro = new Error('Boleto cancelado não pode ser pago.');
            erro.status = 400;
            throw erro;
        }

        const calculo = calcularMultaEJuros(boleto.valor, boleto.data_vencimento);
        const valorPago = dadosPagamento?.valor_pago ? Number(dadosPagamento.valor_pago) : calculo.valorTotal;
        const formaPagamento = dadosPagamento?.forma_pagamento || 'BOLETO_BANCARIO';
        const codigoAutenticacao = gerarCodigoAutenticacao();

        await boletoRepository.registrarPagamento(idNum, {
            valor_pago: valorPago,
            forma_pagamento: formaPagamento,
            codigo_autenticacao: codigoAutenticacao
        });

        const dataPagamentoAtual = new Date().toISOString();

        return {
            mensagem: 'Pagamento do boleto realizado com sucesso!',
            comprovante: {
                tipo_documento: 'COMPROVANTE DE PAGAMENTO DE CONDOMINIO',
                codigo_autenticacao: codigoAutenticacao,
                boleto_id: boleto.id,
                condominio_id: boleto.id_condominio,
                condominio_nome: boleto.condominio_nome,
                morador_nome: boleto.usuario_nome,
                unidade: boleto.unidade,
                bloco: boleto.bloco,
                mes_referencia: boleto.mes_referencia,
                valor_original: Number(boleto.valor),
                encargos: Number((calculo.multa + calculo.juros).toFixed(2)),
                valor_pago: valorPago,
                forma_pagamento: formaPagamento,
                data_pagamento: dataPagamentoAtual,
                status: 'PAGO'
            }
        };
    },

    async listarMeusBoletos(idCondominio, usuario) {
        const idCond = Number(idCondominio);
        if (!idCond) {
            const erro = new Error('ID do condomínio inválido.');
            erro.status = 400;
            throw erro;
        }

        if (usuario.perfil === 'MORADOR' && Number(usuario.id_condominio) !== idCond) {
            const erro = new Error('Acesso negado. Você só pode acessar o seu próprio condomínio.');
            erro.status = 403;
            throw erro;
        }

        return await boletoRepository.listarPorUsuarioECondominio(usuario.id, idCond);
    },

    async listarBoletosCondominio(idCondominio, filtros, usuario) {
        const idCond = Number(idCondominio);
        if (!idCond) {
            const erro = new Error('ID do condomínio inválido.');
            erro.status = 400;
            throw erro;
        }

        if (usuario.perfil === 'SINDICO' && Number(usuario.id_condominio) !== idCond) {
            const erro = new Error('Acesso negado. Você só tem acesso ao seu respectivo condomínio.');
            erro.status = 403;
            throw erro;
        }

        return await boletoRepository.listarPorCondominio(idCond, filtros);
    },

    async obterEstadoPagamentos(idCondominio, usuario) {
        const idCond = Number(idCondominio);
        if (!idCond) {
            const erro = new Error('ID do condomínio inválido.');
            erro.status = 400;
            throw erro;
        }

        if (usuario.perfil === 'SINDICO' && Number(usuario.id_condominio) !== idCond) {
            const erro = new Error('Acesso negado. Você só pode verificar o estado de pagamentos do seu respectivo condomínio.');
            erro.status = 403;
            throw erro;
        }

        const resumo = await boletoRepository.obterResumoPagamentos(idCond);
        const boletos = await boletoRepository.listarPorCondominio(idCond);

        const totalContas = Number(resumo.total_boletos || 0);
        const totalPagas = Number(resumo.total_pagas || 0);
        const taxaAdimplencia = totalContas > 0 ? Number(((totalPagas / totalContas) * 100).toFixed(1)) : 100.0;

        return {
            condominio_id: idCond,
            total_contas: totalContas,
            total_contas_pagas: totalPagas,
            valor_total_pago: Number(Number(resumo.valor_total_pago || 0).toFixed(2)),
            total_contas_pendentes: Number(resumo.total_pendentes || 0),
            valor_total_pendente: Number(Number(resumo.valor_total_pendente || 0).toFixed(2)),
            total_contas_atrasadas: Number(resumo.total_atrasadas || 0),
            valor_total_atrasado: Number(Number(resumo.valor_total_atrasado || 0).toFixed(2)),
            taxa_adimplencia_percentual: taxaAdimplencia,
            boletos: boletos
        };
    },

    async notificarInadimplentes(idCondominio, dadosNotificacao, usuario) {
        const idCond = Number(idCondominio);
        if (!idCond) {
            const erro = new Error('ID do condomínio inválido.');
            erro.status = 400;
            throw erro;
        }

        if (usuario.perfil === 'SINDICO' && Number(usuario.id_condominio) !== idCond) {
            const erro = new Error('Acesso negado. Você só pode notificar inadimplentes do seu respectivo condomínio.');
            erro.status = 403;
            throw erro;
        }

        const pendencias = await boletoRepository.buscarInadimplentes(idCond);

        if (!pendencias || pendencias.length === 0) {
            return {
                mensagem: 'Nenhum morador com conta pendente ou em atraso para este condomínio.',
                total_notificados: 0,
                destinatarios: []
            };
        }

        // Agrupa por usuário para não enviar duplicidade desnecessária
        const mapaUsuarios = new Map();
        for (const item of pendencias) {
            if (!mapaUsuarios.has(item.usuario_id)) {
                mapaUsuarios.set(item.usuario_id, {
                    usuario_id: item.usuario_id,
                    usuario_nome: item.usuario_nome,
                    usuario_email: item.usuario_email,
                    unidade: item.unidade,
                    bloco: item.bloco,
                    boletos_pendentes: []
                });
            }
            mapaUsuarios.get(item.usuario_id).boletos_pendentes.push({
                boleto_id: item.boleto_id,
                mes_referencia: item.mes_referencia,
                valor: item.valor,
                data_vencimento: item.data_vencimento
            });
        }

        const usuariosNotificados = Array.from(mapaUsuarios.values());
        const destinatariosIds = usuariosNotificados.map(u => u.usuario_id);

        const titulo = dadosNotificacao?.titulo || 'Aviso de Cobrança: Taxa Condominial Pendente';
        const mensagemBase = dadosNotificacao?.mensagem || 
            'Prezado(a) morador(a), identificamos que constam faturas condominiais em aberto em sua unidade. Por favor, acesse o sistema para emitir a segunda via atualizada e regularizar seu pagamento.';

        // Cria a notificação no repositório de notificações
        const notificacaoCriada = await notificacaoRepository.criar(
            {
                titulo: titulo.trim(),
                mensagem: mensagemBase.trim(),
                tipo: 'URGENTE',
                escopo: 'CONDOMINIO',
                condominio_id: idCond,
                criado_por: usuario.id
            },
            destinatariosIds
        );

        // Dispara evento via WebSocket caso conectado
        const io = getIO();
        if (io) {
            for (const usuarioId of destinatariosIds) {
                io.to(`usuario:${usuarioId}`).emit('nova_notificacao', {
                    id: notificacaoCriada.id,
                    titulo: notificacaoCriada.titulo,
                    mensagem: notificacaoCriada.mensagem,
                    tipo: 'URGENTE',
                    escopo: 'CONDOMINIO',
                    condominio_id: idCond,
                    criado_por: usuario.id
                });
            }
        }

        return {
            mensagem: 'Notificações de cobrança enviadas com sucesso para os moradores com contas em aberto.',
            total_notificados: destinatariosIds.length,
            notificacao_id: notificacaoCriada.id,
            usuarios_notificados: usuariosNotificados
        };
    }
};

module.exports = boletoService;
