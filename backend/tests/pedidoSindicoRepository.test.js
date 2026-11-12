const connection = require('../src/repositories/database');
const pedidoSindicoRepository = require('../src/repositories/pedidoSindicoRepository');

jest.mock('../src/repositories/database', () => ({
    query: jest.fn(),
    beginTransaction: jest.fn(),
    rollback: jest.fn(),
    commit: jest.fn()
}));

describe('pedidoSindicoRepository - unitário', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('criarPedidoSindico', () => {
        it('deve criar pedido com sucesso', async () => {
            connection.query.mockImplementation((sql, params, callback) => {
                callback(null, { insertId: 88 });
            });

            const id = await pedidoSindicoRepository.criarPedidoSindico(5, 1);

            expect(id).toBe(88);
            expect(connection.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO pedidos_sindico'),
                [5, 1],
                expect.any(Function)
            );
        });

        it('deve rejeitar em caso de erro na query', async () => {
            const erro = new Error('Falha no insert');
            connection.query.mockImplementation((sql, params, callback) => {
                callback(erro, null);
            });

            await expect(pedidoSindicoRepository.criarPedidoSindico(5, 1)).rejects.toBe(erro);
        });
    });

    describe('aprovarPedidoSindico', () => {
        it('deve aprovar com sucesso e commitar transação', async () => {
            connection.beginTransaction.mockImplementation((cb) => cb(null));
            connection.rollback.mockImplementation((cb) => cb && cb());
            connection.commit.mockImplementation((cb) => cb(null));

            // Chamadas sucessivas a query:
            // 1: buscarPedido -> [ { usuario_id: 10, condominio_id: 2 } ]
            // 2: atualizarPedido -> ok
            // 3: atualizarUsuario -> ok
            // 4: atualizarCondominio -> ok
            connection.query
                .mockImplementationOnce((sql, params, cb) => cb(null, [{ usuario_id: 10, condominio_id: 2 }]))
                .mockImplementationOnce((sql, params, cb) => cb(null, { affectedRows: 1 }))
                .mockImplementationOnce((sql, params, cb) => cb(null, { affectedRows: 1 }))
                .mockImplementationOnce((sql, params, cb) => cb(null, { affectedRows: 1 }));

            const resultado = await pedidoSindicoRepository.aprovarPedidoSindico(1);

            expect(resultado).toBe(true);
            expect(connection.commit).toHaveBeenCalled();
        });

        it('deve rejeitar se beginTransaction falhar', async () => {
            const erro = new Error('Erro begin');
            connection.beginTransaction.mockImplementation((cb) => cb(erro));

            await expect(pedidoSindicoRepository.aprovarPedidoSindico(1)).rejects.toBe(erro);
        });

        it('deve fazer rollback e rejeitar se buscarPedido falhar', async () => {
            const erro = new Error('Erro buscar');
            connection.beginTransaction.mockImplementation((cb) => cb(null));
            connection.rollback.mockImplementation((cb) => cb && cb());
            connection.query.mockImplementationOnce((sql, params, cb) => cb(erro, null));

            await expect(pedidoSindicoRepository.aprovarPedidoSindico(1)).rejects.toBe(erro);
            expect(connection.rollback).toHaveBeenCalled();
        });

        it('deve retornar false e fazer rollback se pedido não for encontrado', async () => {
            connection.beginTransaction.mockImplementation((cb) => cb(null));
            connection.rollback.mockImplementation((cb) => cb && cb());
            connection.query.mockImplementationOnce((sql, params, cb) => cb(null, []));

            const resultado = await pedidoSindicoRepository.aprovarPedidoSindico(1);

            expect(resultado).toBe(false);
            expect(connection.rollback).toHaveBeenCalled();
        });

        it('deve fazer rollback se atualizarPedido falhar', async () => {
            const erro = new Error('Erro atualizar pedido');
            connection.beginTransaction.mockImplementation((cb) => cb(null));
            connection.rollback.mockImplementation((cb) => cb && cb());
            connection.query
                .mockImplementationOnce((sql, params, cb) => cb(null, [{ usuario_id: 10, condominio_id: 2 }]))
                .mockImplementationOnce((sql, params, cb) => cb(erro, null));

            await expect(pedidoSindicoRepository.aprovarPedidoSindico(1)).rejects.toBe(erro);
            expect(connection.rollback).toHaveBeenCalled();
        });

        it('deve fazer rollback se atualizarUsuario falhar', async () => {
            const erro = new Error('Erro atualizar usuario');
            connection.beginTransaction.mockImplementation((cb) => cb(null));
            connection.rollback.mockImplementation((cb) => cb && cb());
            connection.query
                .mockImplementationOnce((sql, params, cb) => cb(null, [{ usuario_id: 10, condominio_id: 2 }]))
                .mockImplementationOnce((sql, params, cb) => cb(null, {}))
                .mockImplementationOnce((sql, params, cb) => cb(erro, null));

            await expect(pedidoSindicoRepository.aprovarPedidoSindico(1)).rejects.toBe(erro);
            expect(connection.rollback).toHaveBeenCalled();
        });

        it('deve fazer rollback se atualizarCondominio falhar', async () => {
            const erro = new Error('Erro atualizar condominio');
            connection.beginTransaction.mockImplementation((cb) => cb(null));
            connection.rollback.mockImplementation((cb) => cb && cb());
            connection.query
                .mockImplementationOnce((sql, params, cb) => cb(null, [{ usuario_id: 10, condominio_id: 2 }]))
                .mockImplementationOnce((sql, params, cb) => cb(null, {}))
                .mockImplementationOnce((sql, params, cb) => cb(null, {}))
                .mockImplementationOnce((sql, params, cb) => cb(erro, null));

            await expect(pedidoSindicoRepository.aprovarPedidoSindico(1)).rejects.toBe(erro);
            expect(connection.rollback).toHaveBeenCalled();
        });

        it('deve fazer rollback se commit falhar', async () => {
            const erro = new Error('Erro commit');
            connection.beginTransaction.mockImplementation((cb) => cb(null));
            connection.rollback.mockImplementation((cb) => cb && cb());
            connection.commit.mockImplementation((cb) => cb(erro));

            connection.query
                .mockImplementationOnce((sql, params, cb) => cb(null, [{ usuario_id: 10, condominio_id: 2 }]))
                .mockImplementationOnce((sql, params, cb) => cb(null, {}))
                .mockImplementationOnce((sql, params, cb) => cb(null, {}))
                .mockImplementationOnce((sql, params, cb) => cb(null, {}));

            await expect(pedidoSindicoRepository.aprovarPedidoSindico(1)).rejects.toBe(erro);
            expect(connection.rollback).toHaveBeenCalled();
        });
    });

    describe('reprovarPedidoSindico', () => {
        it('deve reprovar pedido com sucesso', async () => {
            connection.query.mockImplementation((sql, params, callback) => {
                callback(null, { affectedRows: 1 });
            });

            const resultado = await pedidoSindicoRepository.reprovarPedidoSindico(1);

            expect(resultado).toBe(true);
            expect(connection.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE pedidos_sindico\n            SET deferido = FALSE'),
                [1],
                expect.any(Function)
            );
        });

        it('deve rejeitar se der erro na query', async () => {
            const erro = new Error('Falha reprovar');
            connection.query.mockImplementation((sql, params, callback) => {
                callback(erro, null);
            });

            await expect(pedidoSindicoRepository.reprovarPedidoSindico(1)).rejects.toBe(erro);
        });
    });
});
