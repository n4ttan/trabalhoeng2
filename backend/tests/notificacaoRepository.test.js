//Testes unitários para o repositório de notificações, garantindo que as operações de criação e associação 
// de destinatários funcionem corretamente, incluindo transações e tratamento de erros.
const mockQuery = jest.fn();
const mockBeginTransaction = jest.fn();
const mockCommit = jest.fn();
const mockRollback = jest.fn();

jest.mock('../src/repositories/database', () => ({
    promise: () => ({
        query: mockQuery,
        beginTransaction: mockBeginTransaction,
        commit: mockCommit,
        rollback: mockRollback
    })
}));

const notificacaoRepository = require('../src/repositories/notificacaoRepository');

describe('notificacaoRepository', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        mockBeginTransaction.mockResolvedValue();
        mockCommit.mockResolvedValue();
        mockRollback.mockResolvedValue();
    });

    describe('criar', () => {
        it('deve criar uma notificação e associar os destinatários', async () => {
            mockQuery
                .mockResolvedValueOnce([{ insertId: 10 }])
                .mockResolvedValueOnce([{ affectedRows: 2 }]);

            const dados = {
                titulo: 'Aviso',
                mensagem: 'Manutenção amanhã',
                tipo: 'AVISO',
                escopo: 'CONDOMINIO',
                condominio_id: 3,
                criado_por: 1
            };

            const resultado = await notificacaoRepository.criar(dados, [2, 5]);

            expect(mockBeginTransaction).toHaveBeenCalledTimes(1);
            expect(mockQuery).toHaveBeenCalledTimes(2);
            expect(mockCommit).toHaveBeenCalledTimes(1);
            expect(mockRollback).not.toHaveBeenCalled();

            expect(resultado).toMatchObject({
                id: 10,
                titulo: 'Aviso',
                destinatarios: 2
            });

            expect(mockQuery).toHaveBeenNthCalledWith(
                2,
                expect.stringContaining('INSERT INTO notificacao_destinatarios'),
                [[[10, 2], [10, 5]]]
            );
        });

        it('deve criar uma notificação sem destinatários', async () => {
            mockQuery.mockResolvedValueOnce([{ insertId: 11 }]);

            const resultado = await notificacaoRepository.criar(
                {
                    titulo: 'Aviso geral',
                    mensagem: 'Teste',
                    tipo: 'AVISO',
                    escopo: 'PLATAFORMA',
                    condominio_id: null,
                    criado_por: 1
                },
                []
            );

            expect(mockQuery).toHaveBeenCalledTimes(1);
            expect(mockCommit).toHaveBeenCalledTimes(1);
            expect(mockRollback).not.toHaveBeenCalled();
            expect(resultado.destinatarios).toBe(0);
        });

        it('deve usar null quando condominio_id não for informado', async () => {
            mockQuery.mockResolvedValueOnce([{ insertId: 15 }]);

            await notificacaoRepository.criar(
                {
                    titulo: 'Aviso',
                    mensagem: 'Teste',
                    tipo: 'AVISO',
                    escopo: 'PLATAFORMA',
                    criado_por: 1
                },
                []
            );

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO notificacoes'),
                ['Aviso', 'Teste', 'AVISO', 'PLATAFORMA', null, 1]
            );
        });

        it('deve desfazer a transação se falhar ao inserir destinatários', async () => {
            mockQuery
                .mockResolvedValueOnce([{ insertId: 12 }])
                .mockRejectedValueOnce(new Error('Falha simulada'));

            await expect(
                notificacaoRepository.criar(
                    {
                        titulo: 'Aviso',
                        mensagem: 'Teste',
                        tipo: 'AVISO',
                        escopo: 'PLATAFORMA',
                        condominio_id: null,
                        criado_por: 1
                    },
                    [2]
                )
            ).rejects.toThrow('Falha simulada');

            expect(mockRollback).toHaveBeenCalledTimes(1);
            expect(mockCommit).not.toHaveBeenCalled();
        });

        it('deve desfazer a transação se falhar ao inserir a notificação', async () => {
            mockQuery.mockRejectedValueOnce(new Error('Falha no INSERT'));

            await expect(
                notificacaoRepository.criar(
                    {
                        titulo: 'Aviso',
                        mensagem: 'Teste',
                        tipo: 'AVISO',
                        escopo: 'PLATAFORMA',
                        criado_por: 1
                    },
                    []
                )
            ).rejects.toThrow('Falha no INSERT');

            expect(mockBeginTransaction).toHaveBeenCalledTimes(1);
            expect(mockRollback).toHaveBeenCalledTimes(1);
            expect(mockCommit).not.toHaveBeenCalled();
        });

        it('deve registrar erro se o rollback também falhar e propagar o erro original', async () => {
            const erroOriginal = new Error('Falha no INSERT');
            const erroRollback = new Error('Falha no rollback');
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            mockQuery.mockRejectedValueOnce(erroOriginal);
            mockRollback.mockRejectedValueOnce(erroRollback);

            try {
                await expect(
                    notificacaoRepository.criar(
                        {
                            titulo: 'Aviso',
                            mensagem: 'Teste',
                            tipo: 'AVISO',
                            escopo: 'PLATAFORMA',
                            criado_por: 1
                        },
                        []
                    )
                ).rejects.toBe(erroOriginal);

                expect(consoleSpy).toHaveBeenCalledWith(
                    'Erro ao desfazer transação:',
                    erroRollback
                );
                expect(mockCommit).not.toHaveBeenCalled();
            } finally {
                consoleSpy.mockRestore();
            }
        });

        it('deve permitir uma nova criação após uma operação anterior falhar', async () => {
            mockQuery
                .mockRejectedValueOnce(new Error('Primeira falha'))
                .mockResolvedValueOnce([{ insertId: 20 }]);

            await expect(
                notificacaoRepository.criar(
                    {
                        titulo: 'Primeiro aviso',
                        mensagem: 'Teste',
                        tipo: 'AVISO',
                        escopo: 'PLATAFORMA',
                        criado_por: 1
                    },
                    []
                )
            ).rejects.toThrow('Primeira falha');

            const resultado = await notificacaoRepository.criar(
                {
                    titulo: 'Segundo aviso',
                    mensagem: 'Teste',
                    tipo: 'AVISO',
                    escopo: 'PLATAFORMA',
                    criado_por: 1
                },
                []
            );

            expect(resultado.id).toBe(20);
            expect(mockCommit).toHaveBeenCalledTimes(1);
        });
    });

    describe('listarPorUsuario', () => {
        it('deve listar somente as notificações destinadas ao usuário', async () => {
            const notificacoes = [{ id: 10, titulo: 'Aviso', lida: 0 }];

            mockQuery.mockResolvedValueOnce([notificacoes]);

            const resultado = await notificacaoRepository.listarPorUsuario(2);

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('WHERE d.usuario_id = ?'),
                [2]
            );
            expect(resultado).toEqual(notificacoes);
        });

        it('deve propagar erros da consulta', async () => {
            mockQuery.mockRejectedValueOnce(new Error('Erro na consulta'));

            await expect(
                notificacaoRepository.listarPorUsuario(2)
            ).rejects.toThrow('Erro na consulta');
        });
    });

    describe('marcarComoLida', () => {
        it('deve marcar como lida a notificação do usuário informado', async () => {
            mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

            const resultado = await notificacaoRepository.marcarComoLida(10, 2);

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('AND usuario_id = ?'),
                [10, 2]
            );
            expect(resultado).toBe(true);
        });

        it('deve retornar false quando nenhuma linha for atualizada', async () => {
            mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }]);

            const resultado = await notificacaoRepository.marcarComoLida(10, 2);

            expect(resultado).toBe(false);
        });

        it('deve propagar erros da consulta', async () => {
            mockQuery.mockRejectedValueOnce(new Error('Erro ao atualizar'));

            await expect(
                notificacaoRepository.marcarComoLida(10, 2)
            ).rejects.toThrow('Erro ao atualizar');
        });
    });

    describe('buscarDestinatariosCondominio', () => {
        it('deve retornar os IDs dos destinatários do condomínio', async () => {
            mockQuery.mockResolvedValueOnce([[
                { id: 2 },
                { id: 5 },
                { id: 8 }
            ]]);

            const resultado = await notificacaoRepository.buscarDestinatariosCondominio(3);

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("u.perfil = 'MORADOR'"),
                [3]
            );
            expect(resultado).toEqual([2, 5, 8]);
        });

        it('deve retornar uma lista vazia quando não houver destinatários', async () => {
            mockQuery.mockResolvedValueOnce([[]]);

            const resultado = await notificacaoRepository.buscarDestinatariosCondominio(3);

            expect(resultado).toEqual([]);
        });

        it('deve propagar erros da consulta', async () => {
            mockQuery.mockRejectedValueOnce(new Error('Erro ao buscar destinatários'));

            await expect(
                notificacaoRepository.buscarDestinatariosCondominio(3)
            ).rejects.toThrow('Erro ao buscar destinatários');
        });
    });

    describe('buscarTodosUsuarios', () => {
        it('deve retornar os IDs de todos os usuários', async () => {
            mockQuery.mockResolvedValueOnce([[
                { id: 1 },
                { id: 4 },
                { id: 7 }
            ]]);

            const resultado = await notificacaoRepository.buscarTodosUsuarios();

            expect(mockQuery).toHaveBeenCalledWith('SELECT id FROM usuarios');
            expect(resultado).toEqual([1, 4, 7]);
        });

        it('deve retornar uma lista vazia quando não houver usuários', async () => {
            mockQuery.mockResolvedValueOnce([[]]);

            const resultado = await notificacaoRepository.buscarTodosUsuarios();

            expect(resultado).toEqual([]);
        });

        it('deve propagar erros da consulta', async () => {
            mockQuery.mockRejectedValueOnce(new Error('Erro ao buscar usuários'));

            await expect(
                notificacaoRepository.buscarTodosUsuarios()
            ).rejects.toThrow('Erro ao buscar usuários');
        });
    });
});