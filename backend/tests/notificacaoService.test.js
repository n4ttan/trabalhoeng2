jest.mock('../src/repositories/notificacaoRepository', () => ({
    listarPorUsuario: jest.fn(),
    marcarComoLida: jest.fn(),
    buscarTodosUsuarios: jest.fn(),
    buscarDestinatariosCondominio: jest.fn(),
    criar: jest.fn()
}));

jest.mock('../src/repositories/database', () => {
    const mockDb = {
        query: jest.fn()
    };

    return {
        promise: jest.fn(() => mockDb),
        __mockDb: mockDb
    };
});

jest.mock('../src/socket', () => ({
    getIO: jest.fn()
}));

const notificacaoRepository = require('../src/repositories/notificacaoRepository');
const notificacaoService = require('../src/services/notificacaoService');
const connection = require('../src/repositories/database');
const { getIO } = require('../src/socket');

const mockDb = connection.__mockDb;

describe('notificacaoService', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        getIO.mockReturnValue(null);
    });

    describe('listarPorUsuario', () => {
        it('deve listar notificações do usuário', async () => {
            const notificacoes = [
                { id: 1, titulo: 'Aviso 1' },
                { id: 2, titulo: 'Aviso 2' }
            ];

            notificacaoRepository.listarPorUsuario.mockResolvedValue(notificacoes);

            await expect(
                notificacaoService.listarPorUsuario(5)
            ).resolves.toEqual(notificacoes);

            expect(notificacaoRepository.listarPorUsuario).toHaveBeenCalledWith(5);
        });

        it('deve propagar erro do repositório ao listar notificações', async () => {
            const erro = new Error('Falha ao listar');

            notificacaoRepository.listarPorUsuario.mockRejectedValue(erro);

            await expect(
                notificacaoService.listarPorUsuario(5)
            ).rejects.toBe(erro);
        });
    });

    describe('marcarComoLida', () => {
        it('deve encaminhar os IDs ao repositório', async () => {
            notificacaoRepository.marcarComoLida.mockResolvedValue(true);

            await expect(
                notificacaoService.marcarComoLida(10, 5)
            ).resolves.toBe(true);

            expect(notificacaoRepository.marcarComoLida)
                .toHaveBeenCalledWith(10, 5);
        });

        it('deve propagar erro do repositório ao marcar como lida', async () => {
            const erro = new Error('Falha ao marcar como lida');

            notificacaoRepository.marcarComoLida.mockRejectedValue(erro);

            await expect(
                notificacaoService.marcarComoLida(10, 5)
            ).rejects.toBe(erro);
        });
    });

    describe('publicar - validações', () => {
        const usuarioAdmin = { id: 1, perfil: 'ADMIN' };

        const dadosValidos = {
            titulo: 'Aviso importante',
            mensagem: 'Mensagem de teste',
            escopo: 'PLATAFORMA'
        };

        it.each([
            ['título ausente', { mensagem: 'Mensagem', escopo: 'PLATAFORMA' }],
            ['título não textual', { titulo: 123, mensagem: 'Mensagem', escopo: 'PLATAFORMA' }],
            ['título vazio', { titulo: '   ', mensagem: 'Mensagem', escopo: 'PLATAFORMA' }],
            [
                'título acima de 150 caracteres',
                { titulo: 'A'.repeat(151), mensagem: 'Mensagem', escopo: 'PLATAFORMA' }
            ],
            ['mensagem ausente', { titulo: 'Aviso', escopo: 'PLATAFORMA' }],
            ['mensagem não textual', { titulo: 'Aviso', mensagem: 123, escopo: 'PLATAFORMA' }],
            ['mensagem vazia', { titulo: 'Aviso', mensagem: '   ', escopo: 'PLATAFORMA' }]
        ])('deve rejeitar dados inválidos: %s', async (_descricao, dados) => {
            await expect(
                notificacaoService.publicar(dados, usuarioAdmin)
            ).rejects.toMatchObject({
                status: 400,
                message: 'Título ou mensagem inválidos.'
            });

            expect(notificacaoRepository.criar).not.toHaveBeenCalled();
        });

        it('deve rejeitar tipo de notificação inválido', async () => {
            await expect(
                notificacaoService.publicar(
                    { ...dadosValidos, tipo: 'TIPO_INVALIDO' },
                    usuarioAdmin
                )
            ).rejects.toMatchObject({
                status: 400,
                message: 'Tipo de notificação inválido.'
            });

            expect(notificacaoRepository.criar).not.toHaveBeenCalled();
        });

        it('deve impedir que morador publique aviso da plataforma', async () => {
            await expect(
                notificacaoService.publicar(
                    dadosValidos,
                    { id: 2, perfil: 'MORADOR' }
                )
            ).rejects.toMatchObject({
                status: 403,
                message: 'Apenas administradores podem publicar avisos da plataforma.'
            });

            expect(notificacaoRepository.buscarTodosUsuarios).not.toHaveBeenCalled();
            expect(notificacaoRepository.criar).not.toHaveBeenCalled();
        });

        it('deve rejeitar escopo inválido', async () => {
            await expect(
                notificacaoService.publicar(
                    { ...dadosValidos, escopo: 'INVALIDO' },
                    usuarioAdmin
                )
            ).rejects.toMatchObject({
                status: 400,
                message: 'Escopo inválido.'
            });
        });

        it.each([
            ['ID ausente', undefined],
            ['ID não numérico', 'abc'],
            ['ID zero', 0],
            ['ID negativo', -1],
            ['ID decimal', 1.5]
        ])('deve rejeitar condomínio inválido: %s', async (_descricao, condominioId) => {
            await expect(
                notificacaoService.publicar(
                    {
                        titulo: 'Aviso',
                        mensagem: 'Mensagem',
                        escopo: 'CONDOMINIO',
                        condominio_id: condominioId
                    },
                    usuarioAdmin
                )
            ).rejects.toMatchObject({
                status: 400,
                message: 'Condomínio inválido.'
            });

            expect(notificacaoRepository.criar).not.toHaveBeenCalled();
        });

        it('deve impedir que morador publique aviso de condomínio', async () => {
            await expect(
                notificacaoService.publicar(
                    {
                        titulo: 'Aviso',
                        mensagem: 'Mensagem',
                        escopo: 'CONDOMINIO',
                        condominio_id: 10
                    },
                    { id: 2, perfil: 'MORADOR' }
                )
            ).rejects.toMatchObject({
                status: 403,
                message: 'Sem permissão para publicar avisos de condomínio.'
            });

            expect(notificacaoRepository.buscarDestinatariosCondominio)
                .not.toHaveBeenCalled();
        });
    });

    describe('publicar - plataforma', () => {
        const dados = {
            titulo: '  Aviso importante  ',
            mensagem: '  Mensagem de teste  ',
            escopo: 'PLATAFORMA'
        };

        const usuario = { id: 1, perfil: 'ADMIN' };

        it('deve publicar aviso da plataforma e emitir evento aos destinatários', async () => {
            const destinatarios = [2, 5];

            const notificacaoCriada = {
                id: 20,
                titulo: 'Aviso importante',
                mensagem: 'Mensagem de teste',
                tipo: 'AVISO',
                escopo: 'PLATAFORMA',
                condominio_id: null,
                criado_por: 1
            };

            const emit = jest.fn();
            const to = jest.fn(() => ({ emit }));

            getIO.mockReturnValue({ to });

            notificacaoRepository.buscarTodosUsuarios
                .mockResolvedValue(destinatarios);

            notificacaoRepository.criar
                .mockResolvedValue(notificacaoCriada);

            const resultado = await notificacaoService.publicar(dados, usuario);

            expect(resultado).toEqual(notificacaoCriada);

            expect(notificacaoRepository.buscarTodosUsuarios)
                .toHaveBeenCalledTimes(1);

            expect(notificacaoRepository.criar).toHaveBeenCalledWith(
                {
                    titulo: 'Aviso importante',
                    mensagem: 'Mensagem de teste',
                    tipo: 'AVISO',
                    escopo: 'PLATAFORMA',
                    condominio_id: null,
                    criado_por: 1
                },
                destinatarios
            );

            expect(to).toHaveBeenCalledTimes(2);
            expect(to).toHaveBeenNthCalledWith(1, 'usuario:2');
            expect(to).toHaveBeenNthCalledWith(2, 'usuario:5');

            expect(emit).toHaveBeenCalledTimes(2);
            expect(emit).toHaveBeenCalledWith(
                'nova_notificacao',
                expect.objectContaining({
                    id: 20,
                    titulo: 'Aviso importante',
                    mensagem: 'Mensagem de teste',
                    escopo: 'PLATAFORMA'
                })
            );
        });

        it('deve salvar a notificação mesmo sem Socket.IO disponível', async () => {
            const notificacaoCriada = {
                id: 21,
                titulo: 'Aviso',
                mensagem: 'Mensagem',
                tipo: 'AVISO',
                escopo: 'PLATAFORMA',
                condominio_id: null,
                criado_por: 1
            };

            getIO.mockReturnValue(null);

            notificacaoRepository.buscarTodosUsuarios.mockResolvedValue([2]);
            notificacaoRepository.criar.mockResolvedValue(notificacaoCriada);

            await expect(
                notificacaoService.publicar(
                    { titulo: 'Aviso', mensagem: 'Mensagem', escopo: 'PLATAFORMA' },
                    usuario
                )
            ).resolves.toEqual(notificacaoCriada);

            expect(notificacaoRepository.criar).toHaveBeenCalledTimes(1);
        });

        it.each(['MANUTENCAO', 'URGENTE'])(
            'deve aceitar o tipo %s',
            async (tipo) => {
                notificacaoRepository.buscarTodosUsuarios.mockResolvedValue([]);

                notificacaoRepository.criar.mockResolvedValue({
                    id: 22,
                    titulo: 'Aviso',
                    mensagem: 'Mensagem',
                    tipo,
                    escopo: 'PLATAFORMA',
                    condominio_id: null,
                    criado_por: 1
                });

                await notificacaoService.publicar(
                    { titulo: 'Aviso', mensagem: 'Mensagem', tipo, escopo: 'PLATAFORMA' },
                    usuario
                );

                expect(notificacaoRepository.criar).toHaveBeenCalledWith(
                    expect.objectContaining({ tipo }),
                    []
                );
            }
        );

        it('deve propagar erro ao salvar a notificação', async () => {
            const erro = new Error('Falha ao salvar');

            notificacaoRepository.buscarTodosUsuarios.mockResolvedValue([]);
            notificacaoRepository.criar.mockRejectedValue(erro);

            await expect(
                notificacaoService.publicar(
                    { titulo: 'Aviso', mensagem: 'Mensagem', escopo: 'PLATAFORMA' },
                    usuario
                )
            ).rejects.toBe(erro);
        });
    });

    describe('publicar - condomínio', () => {
        const dadosCondominio = {
            titulo: 'Aviso do condomínio',
            mensagem: 'Mensagem para moradores',
            escopo: 'CONDOMINIO',
            condominio_id: 10
        };

        it('deve permitir que ADMIN publique aviso de condomínio', async () => {
            const destinatarios = [4, 5];

            const notificacaoCriada = {
                id: 30,
                titulo: 'Aviso do condomínio',
                mensagem: 'Mensagem para moradores',
                tipo: 'AVISO',
                escopo: 'CONDOMINIO',
                condominio_id: 10,
                criado_por: 1
            };

            notificacaoRepository.buscarDestinatariosCondominio
                .mockResolvedValue(destinatarios);

            notificacaoRepository.criar.mockResolvedValue(notificacaoCriada);

            const resultado = await notificacaoService.publicar(
                dadosCondominio,
                { id: 1, perfil: 'ADMIN' }
            );

            expect(resultado).toEqual(notificacaoCriada);

            expect(notificacaoRepository.buscarDestinatariosCondominio)
                .toHaveBeenCalledWith(10);

            expect(notificacaoRepository.criar).toHaveBeenCalledWith(
                {
                    titulo: 'Aviso do condomínio',
                    mensagem: 'Mensagem para moradores',
                    tipo: 'AVISO',
                    escopo: 'CONDOMINIO',
                    condominio_id: 10,
                    criado_por: 1
                },
                destinatarios
            );
        });

        it('deve rejeitar síndico sem vínculo com o condomínio', async () => {
            mockDb.query.mockResolvedValue([[]]);

            await expect(
                notificacaoService.publicar(
                    dadosCondominio,
                    { id: 3, perfil: 'SINDICO' }
                )
            ).rejects.toMatchObject({
                status: 403,
                message: 'Você não gerencia este condomínio.'
            });

            expect(notificacaoRepository.buscarDestinatariosCondominio)
                .not.toHaveBeenCalled();

            expect(notificacaoRepository.criar).not.toHaveBeenCalled();
        });

        it('deve permitir síndico com vínculo ao condomínio', async () => {
            mockDb.query.mockResolvedValue([[{ id: 10 }]]);

            const destinatarios = [4, 5];

            const notificacaoCriada = {
                id: 31,
                titulo: 'Aviso do condomínio',
                mensagem: 'Mensagem para moradores',
                tipo: 'AVISO',
                escopo: 'CONDOMINIO',
                condominio_id: 10,
                criado_por: 3
            };

            notificacaoRepository.buscarDestinatariosCondominio
                .mockResolvedValue(destinatarios);

            notificacaoRepository.criar.mockResolvedValue(notificacaoCriada);

            const resultado = await notificacaoService.publicar(
                dadosCondominio,
                { id: 3, perfil: 'SINDICO' }
            );

            expect(resultado).toEqual(notificacaoCriada);

            expect(mockDb.query).toHaveBeenCalledWith(
                expect.stringContaining('FROM condominios c'),
                [3, 10, 3]
            );

            expect(notificacaoRepository.buscarDestinatariosCondominio)
                .toHaveBeenCalledWith(10);

            expect(notificacaoRepository.criar).toHaveBeenCalledTimes(1);
        });

        it('deve propagar erro da consulta de vínculo do síndico', async () => {
            const erro = new Error('Falha na consulta');

            mockDb.query.mockRejectedValue(erro);

            await expect(
                notificacaoService.publicar(
                    dadosCondominio,
                    { id: 3, perfil: 'SINDICO' }
                )
            ).rejects.toBe(erro);

            expect(notificacaoRepository.criar).not.toHaveBeenCalled();
        });

        it('deve emitir eventos aos destinatários do condomínio', async () => {
            const destinatarios = [4, 5];

            const notificacaoCriada = {
                id: 32,
                titulo: 'Aviso do condomínio',
                mensagem: 'Mensagem para moradores',
                tipo: 'AVISO',
                escopo: 'CONDOMINIO',
                condominio_id: 10,
                criado_por: 1
            };

            const emit = jest.fn();
            const to = jest.fn(() => ({ emit }));

            getIO.mockReturnValue({ to });

            notificacaoRepository.buscarDestinatariosCondominio
                .mockResolvedValue(destinatarios);

            notificacaoRepository.criar.mockResolvedValue(notificacaoCriada);

            await notificacaoService.publicar(
                dadosCondominio,
                { id: 1, perfil: 'ADMIN' }
            );

            expect(to).toHaveBeenCalledTimes(2);
            expect(to).toHaveBeenNthCalledWith(1, 'usuario:4');
            expect(to).toHaveBeenNthCalledWith(2, 'usuario:5');
            expect(emit).toHaveBeenCalledTimes(2);
            expect(emit).toHaveBeenCalledWith(
                'nova_notificacao',
                expect.objectContaining({
                    id: 32,
                    escopo: 'CONDOMINIO',
                    condominio_id: 10
                })
            );
        });
    });
});