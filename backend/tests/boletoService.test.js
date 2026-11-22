jest.mock('../src/repositories/boletoRepository', () => ({
    criarBoleto: jest.fn(),
    buscarPorId: jest.fn(),
    listarPorCondominio: jest.fn(),
    listarPorUsuarioECondominio: jest.fn(),
    registrarPagamento: jest.fn(),
    registrarSegundaVia: jest.fn(),
    obterResumoPagamentos: jest.fn(),
    buscarInadimplentes: jest.fn(),
    buscarMoradoresCondominio: jest.fn()
}));

jest.mock('../src/repositories/notificacaoRepository', () => ({
    criar: jest.fn()
}));

jest.mock('../src/socket', () => ({
    getIO: jest.fn()
}));

const boletoRepository = require('../src/repositories/boletoRepository');
const notificacaoRepository = require('../src/repositories/notificacaoRepository');
const { getIO } = require('../src/socket');
const boletoService = require('../src/services/boletoService');

describe('boletoService', () => {
    let mockIO;

    beforeEach(() => {
        jest.clearAllMocks();
        mockIO = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn()
        };
        getIO.mockReturnValue(mockIO);
    });

    describe('criarBoleto', () => {
        it('deve criar um boleto com sucesso', async () => {
            const dados = {
                id_condominio: 1,
                id_usuario: 10,
                mes_referencia: '11/2026',
                valor: 350.00,
                data_vencimento: '2026-11-20'
            };

            boletoRepository.criarBoleto.mockResolvedValue(1);
            boletoRepository.buscarPorId.mockResolvedValue({ id: 1, ...dados, status: 'PENDENTE' });

            const resultado = await boletoService.criarBoleto(dados, { id: 2, perfil: 'SINDICO' });

            expect(boletoRepository.criarBoleto).toHaveBeenCalledWith(
                expect.objectContaining({
                    id_condominio: 1,
                    id_usuario: 10,
                    mes_referencia: '11/2026',
                    valor: 350.00,
                    data_vencimento: '2026-11-20',
                    status: 'PENDENTE',
                    codigo_barras: expect.any(String),
                    linha_digitavel: expect.any(String)
                })
            );
            expect(resultado).toBeDefined();
            expect(resultado.id).toBe(1);
        });

        it('deve rejeitar se faltar campos obrigatórios', async () => {
            await expect(
                boletoService.criarBoleto({ id_condominio: 1 }, { id: 2 })
            ).rejects.toMatchObject({
                status: 400,
                message: 'Campos obrigatórios: id_condominio, id_usuario, mes_referencia, valor, data_vencimento.'
            });
        });

        it('deve rejeitar se o valor for inválido', async () => {
            await expect(
                boletoService.criarBoleto(
                    {
                        id_condominio: 1,
                        id_usuario: 10,
                        mes_referencia: '11/2026',
                        valor: -50,
                        data_vencimento: '2026-11-20'
                    },
                    { id: 2 }
                )
            ).rejects.toMatchObject({
                status: 400,
                message: 'Valor do boleto inválido.'
            });
        });
    });

    describe('gerarBoletosEmLote', () => {
        it('deve gerar boletos para todos os moradores aprovados', async () => {
            const moradores = [
                { id: 10, nome: 'Morador 1' },
                { id: 11, nome: 'Morador 2' }
            ];
            boletoRepository.buscarMoradoresCondominio.mockResolvedValue(moradores);
            boletoRepository.criarBoleto.mockResolvedValue(1);
            boletoRepository.buscarPorId.mockResolvedValue({ id: 1, valor: 300 });

            const resultado = await boletoService.gerarBoletosEmLote(
                {
                    id_condominio: 1,
                    mes_referencia: '11/2026',
                    valor: 300,
                    data_vencimento: '2026-11-20'
                },
                { id: 2, perfil: 'SINDICO' }
            );

            expect(resultado.total_gerados).toBe(2);
            expect(resultado.boletos).toHaveLength(2);
        });

        it('deve retornar aviso se não houver moradores cadastrados', async () => {
            boletoRepository.buscarMoradoresCondominio.mockResolvedValue([]);

            const resultado = await boletoService.gerarBoletosEmLote(
                {
                    id_condominio: 1,
                    mes_referencia: '11/2026',
                    valor: 300,
                    data_vencimento: '2026-11-20'
                },
                { id: 2 }
            );

            expect(resultado.total_gerados).toBe(0);
            expect(resultado.mensagem).toBe('Nenhum morador aprovado encontrado para este condomínio.');
        });

        it('deve rejeitar se faltar campos obrigatórios em lote', async () => {
            await expect(
                boletoService.gerarBoletosEmLote({ id_condominio: 1 }, { id: 2 })
            ).rejects.toMatchObject({
                status: 400,
                message: 'Campos obrigatórios: id_condominio, mes_referencia, valor, data_vencimento.'
            });
        });
    });

    describe('obterSegundaVia', () => {
        it('deve emitir segunda via com encargos calculados para boleto vencido', async () => {
            const boleto = {
                id: 1,
                id_condominio: 1,
                id_usuario: 10,
                usuario_nome: 'Carlos Morador',
                usuario_email: 'carlos@email.com',
                unidade: '101',
                bloco: 'A',
                mes_referencia: '10/2026',
                valor: 500.00,
                data_vencimento: '2026-10-10', // Vencido
                status: 'PENDENTE',
                codigo_barras: '03399999900000050000000010001000000000000000',
                linha_digitavel: '03399.12345 67890.123456 78901.234567 1 99990000000000',
                condominio_nome: 'Condomínio Solar'
            };

            boletoRepository.buscarPorId.mockResolvedValue(boleto);
            boletoRepository.registrarSegundaVia.mockResolvedValue(true);

            const usuario = { id: 10, perfil: 'MORADOR', id_condominio: 1 };
            const resultado = await boletoService.obterSegundaVia(1, usuario);

            expect(resultado.mensagem).toBe('Segunda via do boleto gerada com sucesso.');
            expect(resultado.boleto.valor_original).toBe(500);
            expect(resultado.boleto.multa).toBeGreaterThan(0); // Multa de 2% (10 reais)
            expect(resultado.boleto.valor_total).toBeGreaterThan(500);
            expect(resultado.boleto.segunda_via).toBe(true);
            expect(resultado.boleto.template_html).toContain('Boleto Condominial - 2ª Via');
            expect(boletoRepository.registrarSegundaVia).toHaveBeenCalled();
        });

        it('deve bloquear morador tentando emitir segunda via de outro morador', async () => {
            const boleto = {
                id: 1,
                id_condominio: 1,
                id_usuario: 99,
                status: 'PENDENTE'
            };
            boletoRepository.buscarPorId.mockResolvedValue(boleto);

            const usuario = { id: 10, perfil: 'MORADOR', id_condominio: 1 };
            await expect(
                boletoService.obterSegundaVia(1, usuario)
            ).rejects.toMatchObject({
                status: 403,
                message: 'Acesso negado. Você só pode acessar seus próprios boletos.'
            });
        });

        it('deve bloquear morador tentando emitir segunda via de outro condomínio', async () => {
            const boleto = {
                id: 1,
                id_condominio: 2,
                id_usuario: 10,
                status: 'PENDENTE'
            };
            boletoRepository.buscarPorId.mockResolvedValue(boleto);

            const usuario = { id: 10, perfil: 'MORADOR', id_condominio: 1 };
            await expect(
                boletoService.obterSegundaVia(1, usuario)
            ).rejects.toMatchObject({
                status: 403,
                message: 'Acesso negado. Você só pode acessar seus próprios boletos.'
            });
        });

        it('deve retornar 404 se boleto não existir', async () => {
            boletoRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                boletoService.obterSegundaVia(999, { id: 1, perfil: 'ADMIN' })
            ).rejects.toMatchObject({
                status: 404,
                message: 'Boleto não encontrado.'
            });
        });

        it('deve rejeitar se boleto estiver cancelado', async () => {
            const boleto = {
                id: 1,
                id_condominio: 1,
                id_usuario: 10,
                status: 'CANCELADO'
            };
            boletoRepository.buscarPorId.mockResolvedValue(boleto);

            const usuario = { id: 10, perfil: 'MORADOR', id_condominio: 1 };
            await expect(
                boletoService.obterSegundaVia(1, usuario)
            ).rejects.toMatchObject({
                status: 400,
                message: 'Boleto cancelado. Não é possível gerar segunda via.'
            });
        });

        it('deve rejeitar se id do boleto for inválido', async () => {
            await expect(
                boletoService.obterSegundaVia('invalido', { id: 1, perfil: 'ADMIN' })
            ).rejects.toMatchObject({
                status: 400,
                message: 'ID do boleto inválido.'
            });
        });

        it('deve bloquear síndico de outro condomínio ao tentar obter segunda via', async () => {
            const boleto = {
                id: 1,
                id_condominio: 2,
                id_usuario: 10,
                status: 'PENDENTE'
            };
            boletoRepository.buscarPorId.mockResolvedValue(boleto);

            const sindico = { id: 99, perfil: 'SINDICO', id_condominio: 1 };
            await expect(
                boletoService.obterSegundaVia(1, sindico)
            ).rejects.toMatchObject({
                status: 403,
                message: 'Acesso negado. Você só gerencia boletos do seu respectivo condomínio.'
            });
        });

        it('deve emitir segunda via sem encargos se boleto não estiver vencido', async () => {
            const dataFutura = new Date();
            dataFutura.setDate(dataFutura.getDate() + 10);

            const boleto = {
                id: 1,
                id_condominio: 1,
                id_usuario: 10,
                usuario_nome: 'Carlos Morador',
                usuario_email: 'carlos@email.com',
                unidade: '101',
                bloco: 'A',
                mes_referencia: '11/2026',
                valor: 350.00,
                data_vencimento: dataFutura.toISOString().split('T')[0],
                status: 'PENDENTE',
                codigo_barras: '03399999900000035000000010001000000000000000',
                linha_digitavel: '03399.12345 67890.123456 78901.234567 1 99990000000000',
                condominio_nome: 'Condomínio Solar'
            };

            boletoRepository.buscarPorId.mockResolvedValue(boleto);
            boletoRepository.registrarSegundaVia.mockResolvedValue(true);

            const usuario = { id: 10, perfil: 'MORADOR', id_condominio: 1 };
            const resultado = await boletoService.obterSegundaVia(1, usuario);

            expect(resultado.boleto.multa).toBe(0);
            expect(resultado.boleto.juros).toBe(0);
            expect(resultado.boleto.valor_total).toBe(350);
            expect(boletoRepository.registrarSegundaVia).toHaveBeenCalledWith(1);
        });
    });

    describe('pagarBoleto', () => {
        it('deve registrar pagamento com sucesso e emitir comprovante template', async () => {
            const boleto = {
                id: 1,
                id_condominio: 1,
                id_usuario: 10,
                usuario_nome: 'Carlos Morador',
                unidade: '101',
                bloco: 'A',
                mes_referencia: '11/2026',
                valor: 350.00,
                data_vencimento: '2099-12-31',
                status: 'PENDENTE',
                condominio_nome: 'Residencial Flores'
            };

            boletoRepository.buscarPorId.mockResolvedValue(boleto);
            boletoRepository.registrarPagamento.mockResolvedValue(true);

            const usuario = { id: 10, perfil: 'MORADOR', id_condominio: 1 };
            const resultado = await boletoService.pagarBoleto(
                1,
                { forma_pagamento: 'BOLETO_BANCARIO' },
                usuario
            );

            expect(boletoRepository.registrarPagamento).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    forma_pagamento: 'BOLETO_BANCARIO',
                    codigo_autenticacao: expect.stringMatching(/^AUTH-/),
                    valor_pago: 350
                })
            );
            expect(resultado.mensagem).toBe('Pagamento do boleto realizado com sucesso!');
            expect(resultado.comprovante).toBeDefined();
            expect(resultado.comprovante.status).toBe('PAGO');
            expect(resultado.comprovante.codigo_autenticacao).toMatch(/^AUTH-/);
            expect(resultado.comprovante.morador_nome).toBe('Carlos Morador');
        });

        it('deve negar pagamento de boleto que já foi pago', async () => {
            const boleto = {
                id: 1,
                id_condominio: 1,
                id_usuario: 10,
                status: 'PAGO'
            };
            boletoRepository.buscarPorId.mockResolvedValue(boleto);

            const usuario = { id: 10, perfil: 'MORADOR', id_condominio: 1 };
            await expect(
                boletoService.pagarBoleto(1, {}, usuario)
            ).rejects.toMatchObject({
                status: 400,
                message: 'Este boleto já foi pago.'
            });
        });

        it('deve bloquear morador de outro condomínio', async () => {
            const boleto = {
                id: 1,
                id_condominio: 2,
                id_usuario: 10,
                status: 'PENDENTE'
            };
            boletoRepository.buscarPorId.mockResolvedValue(boleto);

            const usuario = { id: 10, perfil: 'MORADOR', id_condominio: 1 };
            await expect(
                boletoService.pagarBoleto(1, {}, usuario)
            ).rejects.toMatchObject({
                status: 403,
                message: 'Acesso negado. Você só pode acessar o seu próprio condomínio.'
            });
        });

        it('deve bloquear morador tentando pagar conta de outro morador', async () => {
            const boleto = {
                id: 1,
                id_condominio: 1,
                id_usuario: 20,
                status: 'PENDENTE'
            };
            boletoRepository.buscarPorId.mockResolvedValue(boleto);

            const usuario = { id: 10, perfil: 'MORADOR', id_condominio: 1 };
            await expect(
                boletoService.pagarBoleto(1, {}, usuario)
            ).rejects.toMatchObject({
                status: 403,
                message: 'Acesso negado. Você só pode pagar boletos da sua própria residência.'
            });
        });

        it('deve rejeitar pagamento se id do boleto for inválido', async () => {
            await expect(
                boletoService.pagarBoleto('invalido', {}, { id: 10 })
            ).rejects.toMatchObject({
                status: 400,
                message: 'ID do boleto inválido.'
            });
        });

        it('deve rejeitar se boleto não for encontrado ao pagar', async () => {
            boletoRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                boletoService.pagarBoleto(999, {}, { id: 10 })
            ).rejects.toMatchObject({
                status: 404,
                message: 'Boleto não encontrado.'
            });
        });

        it('deve rejeitar pagamento de boleto cancelado', async () => {
            const boleto = {
                id: 1,
                id_condominio: 1,
                id_usuario: 10,
                status: 'CANCELADO'
            };
            boletoRepository.buscarPorId.mockResolvedValue(boleto);

            const usuario = { id: 10, perfil: 'MORADOR', id_condominio: 1 };
            await expect(
                boletoService.pagarBoleto(1, {}, usuario)
            ).rejects.toMatchObject({
                status: 400,
                message: 'Boleto cancelado não pode ser pago.'
            });
        });
    });

    describe('listarMeusBoletos', () => {
        it('deve retornar a lista de boletos do morador autenticado', async () => {
            const boletos = [{ id: 1, valor: 350 }];
            boletoRepository.listarPorUsuarioECondominio.mockResolvedValue(boletos);

            const usuario = { id: 10, perfil: 'MORADOR', id_condominio: 1 };
            const resultado = await boletoService.listarMeusBoletos(1, usuario);

            expect(boletoRepository.listarPorUsuarioECondominio).toHaveBeenCalledWith(10, 1);
            expect(resultado).toBe(boletos);
        });

        it('deve rejeitar se idCondominio for inválido', async () => {
            await expect(
                boletoService.listarMeusBoletos('invalido', { id: 1 })
            ).rejects.toMatchObject({
                status: 400,
                message: 'ID do condomínio inválido.'
            });
        });

        it('deve negar morador consultando condomínio diferente', async () => {
            const usuario = { id: 10, perfil: 'MORADOR', id_condominio: 1 };
            await expect(
                boletoService.listarMeusBoletos(2, usuario)
            ).rejects.toMatchObject({
                status: 403,
                message: 'Acesso negado. Você só pode acessar o seu próprio condomínio.'
            });
        });
    });

    describe('listarBoletosCondominio', () => {
        it('deve listar boletos do condomínio com sucesso', async () => {
            const boletos = [{ id: 1 }];
            boletoRepository.listarPorCondominio.mockResolvedValue(boletos);

            const resultado = await boletoService.listarBoletosCondominio(1, {}, { id: 2, perfil: 'ADMIN' });
            expect(resultado).toBe(boletos);
            expect(boletoRepository.listarPorCondominio).toHaveBeenCalledWith(1, {});
        });

        it('deve rejeitar se idCondominio for inválido', async () => {
            await expect(
                boletoService.listarBoletosCondominio('invalido', {}, { id: 2 })
            ).rejects.toMatchObject({
                status: 400,
                message: 'ID do condomínio inválido.'
            });
        });

        it('deve negar síndico de outro condomínio', async () => {
            await expect(
                boletoService.listarBoletosCondominio(1, {}, { id: 2, perfil: 'SINDICO', id_condominio: 99 })
            ).rejects.toMatchObject({
                status: 403,
                message: 'Acesso negado. Você só tem acesso ao seu respectivo condomínio.'
            });
        });
    });

    describe('obterEstadoPagamentos', () => {
        it('deve rejeitar se idCondominio for inválido', async () => {
            await expect(
                boletoService.obterEstadoPagamentos('invalido', { id: 1 })
            ).rejects.toMatchObject({
                status: 400,
                message: 'ID do condomínio inválido.'
            });
        });

        it('deve retornar o estado de pagamentos e o total de contas pagas para o síndico', async () => {
            boletoRepository.obterResumoPagamentos.mockResolvedValue({
                total_boletos: 10,
                total_pagas: 7,
                valor_total_pago: 2800.00,
                total_pendentes: 2,
                valor_total_pendente: 800.00,
                total_atrasadas: 1,
                valor_total_atrasado: 400.00
            });

            boletoRepository.listarPorCondominio.mockResolvedValue([
                { id: 1, status: 'PAGO' }
            ]);

            const sindico = { id: 2, perfil: 'SINDICO', id_condominio: 1 };
            const relatorio = await boletoService.obterEstadoPagamentos(1, sindico);

            expect(relatorio.total_contas).toBe(10);
            expect(relatorio.total_contas_pagas).toBe(7);
            expect(relatorio.valor_total_pago).toBe(2800);
            expect(relatorio.taxa_adimplencia_percentual).toBe(70);
            expect(relatorio.boletos).toHaveLength(1);
        });

        it('deve negar síndico consultando estado de pagamentos de outro condomínio', async () => {
            const sindico = { id: 2, perfil: 'SINDICO', id_condominio: 1 };
            await expect(
                boletoService.obterEstadoPagamentos(2, sindico)
            ).rejects.toMatchObject({
                status: 403,
                message: 'Acesso negado. Você só pode verificar o estado de pagamentos do seu respectivo condomínio.'
            });
        });
    });

    describe('notificarInadimplentes', () => {
        it('deve notificar moradores com faturas pendentes via notificações e websockets', async () => {
            const pendencias = [
                {
                    boleto_id: 1,
                    mes_referencia: '10/2026',
                    valor: 400,
                    data_vencimento: '2026-10-10',
                    usuario_id: 15,
                    usuario_nome: 'Joana Silva',
                    usuario_email: 'joana@email.com',
                    unidade: '202',
                    bloco: 'B'
                }
            ];

            boletoRepository.buscarInadimplentes.mockResolvedValue(pendencias);
            notificacaoRepository.criar.mockResolvedValue({
                id: 101,
                titulo: 'Aviso de Cobrança',
                mensagem: 'Prezado(a) morador(a)...'
            });

            const sindico = { id: 2, perfil: 'SINDICO', id_condominio: 1 };
            const resultado = await boletoService.notificarInadimplentes(1, {}, sindico);

            expect(notificacaoRepository.criar).toHaveBeenCalledWith(
                expect.objectContaining({
                    tipo: 'URGENTE',
                    escopo: 'CONDOMINIO',
                    condominio_id: 1,
                    criado_por: 2
                }),
                [15]
            );
            expect(mockIO.to).toHaveBeenCalledWith('usuario:15');
            expect(mockIO.emit).toHaveBeenCalledWith('nova_notificacao', expect.any(Object));
            expect(resultado.total_notificados).toBe(1);
            expect(resultado.mensagem).toContain('Notificações de cobrança enviadas com sucesso');
        });

        it('deve avisar quando não houver inadimplentes', async () => {
            boletoRepository.buscarInadimplentes.mockResolvedValue([]);

            const sindico = { id: 2, perfil: 'SINDICO', id_condominio: 1 };
            const resultado = await boletoService.notificarInadimplentes(1, {}, sindico);

            expect(resultado.total_notificados).toBe(0);
            expect(resultado.mensagem).toBe('Nenhum morador com conta pendente ou em atraso para este condomínio.');
            expect(notificacaoRepository.criar).not.toHaveBeenCalled();
        });

        it('deve rejeitar se idCondominio for inválido ao notificar', async () => {
            await expect(
                boletoService.notificarInadimplentes('invalido', {}, { id: 1 })
            ).rejects.toMatchObject({
                status: 400,
                message: 'ID do condomínio inválido.'
            });
        });

        it('deve bloquear síndico de outro condomínio', async () => {
            const sindico = { id: 2, perfil: 'SINDICO', id_condominio: 1 };
            await expect(
                boletoService.notificarInadimplentes(2, {}, sindico)
            ).rejects.toMatchObject({
                status: 403,
                message: 'Acesso negado. Você só pode notificar inadimplentes do seu respectivo condomínio.'
            });
        });
    });
});
