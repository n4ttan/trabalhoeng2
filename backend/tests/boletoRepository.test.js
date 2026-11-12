const connection = require('../src/repositories/database');
const boletoRepository = require('../src/repositories/boletoRepository');

jest.mock('../src/repositories/database', () => ({
    query: jest.fn()
}));

describe('boletoRepository', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('criarBoleto', () => {
        it('deve inserir boleto e retornar o insertId', async () => {
            connection.query.mockImplementation((sql, params, callback) => {
                callback(null, { insertId: 101 });
            });

            const dados = {
                id_condominio: 1,
                id_usuario: 5,
                mes_referencia: '11/2026',
                valor: 350.00,
                data_vencimento: '2026-11-20',
                status: 'PENDENTE',
                codigo_barras: '12345',
                linha_digitavel: '67890'
            };

            const id = await boletoRepository.criarBoleto(dados);

            expect(id).toBe(101);
            expect(connection.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO boletos'),
                [1, 5, '11/2026', 350.00, '2026-11-20', 'PENDENTE', '12345', '67890'],
                expect.any(Function)
            );
        });

        it('deve rejeitar se der erro na inserção', async () => {
            const erro = new Error('Falha no insert');
            connection.query.mockImplementation((sql, params, callback) => {
                callback(erro, null);
            });

            await expect(
                boletoRepository.criarBoleto({ id_condominio: 1 })
            ).rejects.toBe(erro);
        });
    });

    describe('buscarPorId', () => {
        it('deve retornar o boleto quando encontrado', async () => {
            const boleto = { id: 1, valor: 350 };
            connection.query.mockImplementation((sql, params, callback) => {
                callback(null, [boleto]);
            });

            const resultado = await boletoRepository.buscarPorId(1);

            expect(resultado).toEqual(boleto);
            expect(connection.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT \n                    b.*'),
                [1],
                expect.any(Function)
            );
        });

        it('deve retornar null se não encontrado', async () => {
            connection.query.mockImplementation((sql, params, callback) => {
                callback(null, []);
            });

            const resultado = await boletoRepository.buscarPorId(999);

            expect(resultado).toBeNull();
        });

        it('deve rejeitar em caso de erro na busca', async () => {
            const erro = new Error('Erro na busca');
            connection.query.mockImplementation((sql, params, callback) => {
                callback(erro, null);
            });

            await expect(boletoRepository.buscarPorId(1)).rejects.toBe(erro);
        });
    });

    describe('listarPorCondominio', () => {
        it('deve listar boletos sem filtros', async () => {
            const lista = [{ id: 1 }];
            connection.query.mockImplementation((sql, params, callback) => {
                callback(null, lista);
            });

            const resultado = await boletoRepository.listarPorCondominio(1);

            expect(resultado).toEqual(lista);
            expect(connection.query).toHaveBeenCalledWith(
                expect.not.stringContaining('AND b.status = ?'),
                [1],
                expect.any(Function)
            );
        });

        it('deve aplicar filtros de status, usuario_id e mes_referencia', async () => {
            const lista = [{ id: 1 }];
            connection.query.mockImplementation((sql, params, callback) => {
                callback(null, lista);
            });

            const filtros = { status: 'PAGO', usuario_id: 5, mes_referencia: '11/2026' };
            const resultado = await boletoRepository.listarPorCondominio(1, filtros);

            expect(resultado).toEqual(lista);
            expect(connection.query).toHaveBeenCalledWith(
                expect.stringContaining('AND b.status = ? AND b.id_usuario = ? AND b.mes_referencia = ?'),
                [1, 'PAGO', 5, '11/2026'],
                expect.any(Function)
            );
        });

        it('deve rejeitar em caso de erro na query', async () => {
            const erro = new Error('Falha no select');
            connection.query.mockImplementation((sql, params, callback) => {
                callback(erro, null);
            });

            await expect(boletoRepository.listarPorCondominio(1)).rejects.toBe(erro);
        });
    });

    describe('listarPorUsuarioECondominio', () => {
        it('deve retornar boletos do usuário no condomínio', async () => {
            const lista = [{ id: 1, valor: 350 }];
            connection.query.mockImplementation((sql, params, callback) => {
                callback(null, lista);
            });

            const resultado = await boletoRepository.listarPorUsuarioECondominio(5, 1);

            expect(resultado).toEqual(lista);
            expect(connection.query).toHaveBeenCalledWith(
                expect.stringContaining('WHERE b.id_usuario = ? AND b.id_condominio = ?'),
                [5, 1],
                expect.any(Function)
            );
        });

        it('deve rejeitar em caso de erro', async () => {
            const erro = new Error('Erro');
            connection.query.mockImplementation((sql, params, callback) => {
                callback(erro, null);
            });

            await expect(boletoRepository.listarPorUsuarioECondominio(5, 1)).rejects.toBe(erro);
        });
    });

    describe('registrarPagamento', () => {
        it('deve registrar pagamento com dados informados', async () => {
            connection.query.mockImplementation((sql, params, callback) => {
                callback(null, { affectedRows: 1 });
            });

            const dados = { valor_pago: 350, forma_pagamento: 'PIX', codigo_autenticacao: 'AUTH-123' };
            const resultado = await boletoRepository.registrarPagamento(1, dados);

            expect(resultado).toBe(true);
            expect(connection.query).toHaveBeenCalledWith(
                expect.stringContaining("UPDATE boletos\n                SET \n                    status = 'PAGO'"),
                [350, 'PIX', 'AUTH-123', 1],
                expect.any(Function)
            );
        });

        it('deve usar forma de pagamento padrão se não informada', async () => {
            connection.query.mockImplementation((sql, params, callback) => {
                callback(null, { affectedRows: 1 });
            });

            const dados = { valor_pago: 350, codigo_autenticacao: 'AUTH-123' };
            await boletoRepository.registrarPagamento(1, dados);

            expect(connection.query).toHaveBeenCalledWith(
                expect.any(String),
                [350, 'BOLETO_BANCARIO', 'AUTH-123', 1],
                expect.any(Function)
            );
        });

        it('deve rejeitar em caso de falha', async () => {
            const erro = new Error('Falha no update');
            connection.query.mockImplementation((sql, params, callback) => {
                callback(erro, null);
            });

            await expect(boletoRepository.registrarPagamento(1, {})).rejects.toBe(erro);
        });
    });

    describe('registrarSegundaVia', () => {
        it('deve registrar segunda via com valores atualizados', async () => {
            connection.query.mockImplementation((sql, params, callback) => {
                callback(null, { affectedRows: 1 });
            });

            const resultado = await boletoRepository.registrarSegundaVia(1, '2026-11-25', 'BARRA', 'LINHA');

            expect(resultado).toBe(true);
            expect(connection.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE boletos\n                SET \n                    segunda_via_emitida_em = CURRENT_TIMESTAMP'),
                ['2026-11-25', 'BARRA', 'LINHA', 1],
                expect.any(Function)
            );
        });

        it('deve rejeitar em caso de falha', async () => {
            const erro = new Error('Falha');
            connection.query.mockImplementation((sql, params, callback) => {
                callback(erro, null);
            });

            await expect(boletoRepository.registrarSegundaVia(1)).rejects.toBe(erro);
        });
    });

    describe('obterResumoPagamentos', () => {
        it('deve retornar resumo agregado', async () => {
            const resumo = { total_boletos: 10, total_pagas: 8 };
            connection.query.mockImplementation((sql, params, callback) => {
                callback(null, [resumo]);
            });

            const resultado = await boletoRepository.obterResumoPagamentos(1);

            expect(resultado).toEqual(resumo);
            expect(connection.query).toHaveBeenCalledWith(
                expect.stringContaining('COUNT(*) AS total_boletos'),
                [1],
                expect.any(Function)
            );
        });

        it('deve rejeitar se der erro', async () => {
            const erro = new Error('Erro resumo');
            connection.query.mockImplementation((sql, params, callback) => {
                callback(erro, null);
            });

            await expect(boletoRepository.obterResumoPagamentos(1)).rejects.toBe(erro);
        });
    });

    describe('buscarInadimplentes', () => {
        it('deve retornar lista de inadimplentes', async () => {
            const lista = [{ usuario_id: 5, valor: 300 }];
            connection.query.mockImplementation((sql, params, callback) => {
                callback(null, lista);
            });

            const resultado = await boletoRepository.buscarInadimplentes(1);

            expect(resultado).toEqual(lista);
            expect(connection.query).toHaveBeenCalledWith(
                expect.stringContaining("AND b.status IN ('PENDENTE', 'ATRASADO')"),
                [1],
                expect.any(Function)
            );
        });

        it('deve rejeitar em caso de falha', async () => {
            const erro = new Error('Falha inadimplentes');
            connection.query.mockImplementation((sql, params, callback) => {
                callback(erro, null);
            });

            await expect(boletoRepository.buscarInadimplentes(1)).rejects.toBe(erro);
        });
    });

    describe('buscarMoradoresCondominio', () => {
        it('deve retornar moradores aprovados', async () => {
            const moradores = [{ id: 5, nome: 'Ana' }];
            connection.query.mockImplementation((sql, params, callback) => {
                callback(null, moradores);
            });

            const resultado = await boletoRepository.buscarMoradoresCondominio(1);

            expect(resultado).toEqual(moradores);
            expect(connection.query).toHaveBeenCalledWith(
                expect.stringContaining("AND perfil = 'MORADOR'\n                  AND status_cadastro = 'APROVADO'"),
                [1],
                expect.any(Function)
            );
        });

        it('deve rejeitar se der erro', async () => {
            const erro = new Error('Erro moradores');
            connection.query.mockImplementation((sql, params, callback) => {
                callback(erro, null);
            });

            await expect(boletoRepository.buscarMoradoresCondominio(1)).rejects.toBe(erro);
        });
    });
});
