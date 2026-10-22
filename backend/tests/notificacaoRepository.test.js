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

    it('deve criar uma notificação e associar os destinatários', async () => {
        mockQuery
            .mockResolvedValueOnce([{ insertId: 10 }])
            .mockResolvedValueOnce([{ affectedRows: 2 }]);

        const resultado = await notificacaoRepository.criar(
            {
                titulo: 'Aviso',
                mensagem: 'Manutenção amanhã',
                tipo: 'AVISO',
                escopo: 'CONDOMINIO',
                condominio_id: 3,
                criado_por: 1
            },
            [2, 5]
        );

        expect(mockBeginTransaction).toHaveBeenCalledTimes(1);
        expect(mockQuery).toHaveBeenCalledTimes(2);
        expect(mockCommit).toHaveBeenCalledTimes(1);
        expect(mockRollback).not.toHaveBeenCalled();

        expect(resultado).toMatchObject({
            id: 10,
            titulo: 'Aviso',
            destinatarios: 2
        });
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

    
    it('deve listar somente as notificações destinadas ao usuário', async () => {
        const notificacoes = [
            { id: 10, titulo: 'Aviso', lida: 0 }
        ];

        mockQuery.mockResolvedValueOnce([notificacoes]);

        const resultado =
            await notificacaoRepository.listarPorUsuario(2);

        expect(mockQuery).toHaveBeenCalledWith(
            expect.stringContaining('WHERE d.usuario_id = ?'),
            [2]
        );
        expect(resultado).toEqual(notificacoes);
    });

    it('deve marcar como lida apenas a notificação do usuário informado', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

        const resultado =
            await notificacaoRepository.marcarComoLida(10, 2);

        expect(mockQuery).toHaveBeenCalledWith(
            expect.stringContaining('AND usuario_id = ?'),
            [10, 2]
        );
        expect(resultado).toBe(true);
    });
});