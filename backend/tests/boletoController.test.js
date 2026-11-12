jest.mock('../src/services/boletoService', () => ({
    criarBoleto: jest.fn(),
    gerarBoletosEmLote: jest.fn(),
    obterSegundaVia: jest.fn(),
    pagarBoleto: jest.fn(),
    listarMeusBoletos: jest.fn(),
    listarBoletosCondominio: jest.fn(),
    obterEstadoPagamentos: jest.fn(),
    notificarInadimplentes: jest.fn()
}));

const boletoService = require('../src/services/boletoService');
const boletoController = require('../src/controllers/boletoController');

function criarResposta() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
}

describe('boletoController', () => {
    let consoleErrorSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    describe('criar', () => {
        it('deve criar um boleto com status 201', async () => {
            const req = {
                params: { idCondominio: '1' },
                body: { id_usuario: 5, mes_referencia: '11/2026', valor: 300, data_vencimento: '2026-11-20' },
                usuario: { id: 2, perfil: 'SINDICO' }
            };
            const res = criarResposta();
            const boletoCriado = { id: 1, ...req.body };

            boletoService.criarBoleto.mockResolvedValue(boletoCriado);

            await boletoController.criar(req, res);

            expect(boletoService.criarBoleto).toHaveBeenCalledWith(
                {
                    id_condominio: 1,
                    id_usuario: 5,
                    mes_referencia: '11/2026',
                    valor: 300,
                    data_vencimento: '2026-11-20'
                },
                req.usuario
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                mensagem: 'Boleto criado com sucesso.',
                boleto: boletoCriado
            });
        });

        it('deve retornar status de erro correspondente se o serviço rejeitar', async () => {
            const req = {
                params: { idCondominio: '1' },
                body: {},
                usuario: { id: 2 }
            };
            const res = criarResposta();
            const erro = Object.assign(new Error('Campos obrigatórios'), { status: 400 });

            boletoService.criarBoleto.mockRejectedValue(erro);

            await boletoController.criar(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ erro: 'Campos obrigatórios' });
        });
    });

    describe('gerarEmLote', () => {
        it('deve gerar boletos em lote com status 201', async () => {
            const req = {
                params: { idCondominio: '1' },
                body: { mes_referencia: '11/2026', valor: 350, data_vencimento: '2026-11-20' },
                usuario: { id: 2, perfil: 'SINDICO' }
            };
            const res = criarResposta();

            boletoService.gerarBoletosEmLote.mockResolvedValue({
                mensagem: '2 boletos gerados com sucesso',
                total_gerados: 2,
                boletos: []
            });

            await boletoController.gerarEmLote(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ total_gerados: 2 })
            );
        });
    });

    describe('obterSegundaVia', () => {
        it('deve retornar segunda via com status 200', async () => {
            const req = {
                params: { idCondominio: '1', id: '10' },
                usuario: { id: 5, perfil: 'MORADOR', id_condominio: 1 }
            };
            const res = criarResposta();
            const retorno = { mensagem: 'Segunda via gerada', boleto: { id: 10 } };

            boletoService.obterSegundaVia.mockResolvedValue(retorno);

            await boletoController.obterSegundaVia(req, res);

            expect(boletoService.obterSegundaVia).toHaveBeenCalledWith(10, req.usuario);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(retorno);
        });
    });

    describe('pagar', () => {
        it('deve processar o pagamento com status 200', async () => {
            const req = {
                params: { idCondominio: '1', id: '10' },
                body: { forma_pagamento: 'BOLETO' },
                usuario: { id: 5, perfil: 'MORADOR', id_condominio: 1 }
            };
            const res = criarResposta();
            const retorno = { mensagem: 'Pagamento realizado com sucesso!', comprovante: {} };

            boletoService.pagarBoleto.mockResolvedValue(retorno);

            await boletoController.pagar(req, res);

            expect(boletoService.pagarBoleto).toHaveBeenCalledWith(10, req.body, req.usuario);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(retorno);
        });
    });

    describe('listarMeusBoletos', () => {
        it('deve listar boletos do morador autenticado', async () => {
            const req = {
                params: { idCondominio: '1' },
                usuario: { id: 5, perfil: 'MORADOR', id_condominio: 1 }
            };
            const res = criarResposta();
            const lista = [{ id: 1, valor: 300 }];

            boletoService.listarMeusBoletos.mockResolvedValue(lista);

            await boletoController.listarMeusBoletos(req, res);

            expect(boletoService.listarMeusBoletos).toHaveBeenCalledWith(1, req.usuario);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(lista);
        });
    });

    describe('listar', () => {
        it('deve listar boletos do condomínio com filtros opcionais', async () => {
            const req = {
                params: { idCondominio: '1' },
                query: { status: 'PENDENTE' },
                usuario: { id: 2, perfil: 'SINDICO', id_condominio: 1 }
            };
            const res = criarResposta();
            const lista = [{ id: 1, status: 'PENDENTE' }];

            boletoService.listarBoletosCondominio.mockResolvedValue(lista);

            await boletoController.listar(req, res);

            expect(boletoService.listarBoletosCondominio).toHaveBeenCalledWith(
                1,
                { status: 'PENDENTE', usuario_id: undefined, mes_referencia: undefined },
                req.usuario
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(lista);
        });
    });

    describe('obterEstadoPagamentos', () => {
        it('deve retornar o resumo e total de contas pagas', async () => {
            const req = {
                params: { idCondominio: '1' },
                usuario: { id: 2, perfil: 'SINDICO', id_condominio: 1 }
            };
            const res = criarResposta();
            const relatorio = {
                total_contas: 10,
                total_contas_pagas: 7,
                valor_total_pago: 2800,
                taxa_adimplencia_percentual: 70
            };

            boletoService.obterEstadoPagamentos.mockResolvedValue(relatorio);

            await boletoController.obterEstadoPagamentos(req, res);

            expect(boletoService.obterEstadoPagamentos).toHaveBeenCalledWith(1, req.usuario);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(relatorio);
        });
    });

    describe('notificarInadimplentes', () => {
        it('deve notificar moradores com sucesso', async () => {
            const req = {
                params: { idCondominio: '1' },
                body: { titulo: 'Cobrança Urgente' },
                usuario: { id: 2, perfil: 'SINDICO', id_condominio: 1 }
            };
            const res = criarResposta();
            const retorno = {
                mensagem: 'Notificações de cobrança enviadas com sucesso.',
                total_notificados: 3
            };

            boletoService.notificarInadimplentes.mockResolvedValue(retorno);

            await boletoController.notificarInadimplentes(req, res);

            expect(boletoService.notificarInadimplentes).toHaveBeenCalledWith(1, req.body, req.usuario);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(retorno);
        });

        it('deve retornar 500 em caso de erro inesperado sem status', async () => {
            const req = {
                params: { idCondominio: '1' },
                body: {},
                usuario: { id: 2, perfil: 'SINDICO', id_condominio: 1 }
            };
            const res = criarResposta();

            boletoService.notificarInadimplentes.mockRejectedValue(new Error('Erro BD'));

            await boletoController.notificarInadimplentes(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ erro: 'Erro ao notificar moradores com pendências.' });
        });
    });

    describe('erros 500 gerais no controller', () => {
        it('deve retornar 500 em gerarEmLote, obterSegundaVia, pagar, listarMeusBoletos, listar e obterEstadoPagamentos', async () => {
            const req = { params: { idCondominio: '1', id: '1' }, body: {}, query: {}, usuario: { id: 1 } };
            const erroInesperado = new Error('Falha geral');

            boletoService.gerarBoletosEmLote.mockRejectedValue(erroInesperado);
            let res = criarResposta();
            await boletoController.gerarEmLote(req, res);
            expect(res.status).toHaveBeenCalledWith(500);

            boletoService.obterSegundaVia.mockRejectedValue(erroInesperado);
            res = criarResposta();
            await boletoController.obterSegundaVia(req, res);
            expect(res.status).toHaveBeenCalledWith(500);

            boletoService.pagarBoleto.mockRejectedValue(erroInesperado);
            res = criarResposta();
            await boletoController.pagar(req, res);
            expect(res.status).toHaveBeenCalledWith(500);

            boletoService.listarMeusBoletos.mockRejectedValue(erroInesperado);
            res = criarResposta();
            await boletoController.listarMeusBoletos(req, res);
            expect(res.status).toHaveBeenCalledWith(500);

            boletoService.listarBoletosCondominio.mockRejectedValue(erroInesperado);
            res = criarResposta();
            await boletoController.listar(req, res);
            expect(res.status).toHaveBeenCalledWith(500);

            boletoService.obterEstadoPagamentos.mockRejectedValue(erroInesperado);
            res = criarResposta();
            await boletoController.obterEstadoPagamentos(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});
