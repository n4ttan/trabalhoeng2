//Testes unitários para o serviço de notificações, garantindo que a lógica de negócios funcione corretamente,
// incluindo validação de dados, permissões de usuário e integração com o repositório e o Socket.IO.
jest.mock('../src/repositories/notificacaoRepository', () => ({
    listarPorUsuario: jest.fn(),
    marcarComoLida: jest.fn(),
    publicar: jest.fn(),
    criar: jest.fn(),
    buscarDestinatariosCondominio: jest.fn(),
    buscarTodosUsuarios: jest.fn()
}));

jest.mock('../src/repositories/database', () => ({
    promise: () => ({
        query: jest.fn()
    })
}));

jest.mock('../src/socket', () => ({
    getIO: jest.fn()
}));

const notificacaoRepository = require('../src/repositories/notificacaoRepository');
const { getIO } = require('../src/socket');
const notificacaoService = require('../src/services/notificacaoService');

beforeEach(() => {
    jest.resetAllMocks();
});

describe('notificacaoService', () => {
    it('deve listar notificações do usuário', async () => {
        const notificacoes = [{ id: 1, titulo: 'Aviso de teste' }];
        notificacaoRepository.listarPorUsuario.mockResolvedValue(notificacoes);

        const resultado = await notificacaoService.listarPorUsuario(2);

        expect(notificacaoRepository.listarPorUsuario).toHaveBeenCalledWith(2);
        expect(resultado).toEqual(notificacoes);
    });

    it('deve rejeitar publicação com título inválido', async () => {
        await expect(
            notificacaoService.publicar(
                { titulo: ' ', mensagem: 'Mensagem', escopo: 'PLATAFORMA' },
                { id: 1, perfil: 'ADMIN' }
            )
        ).rejects.toMatchObject({ status: 400 });

        expect(notificacaoRepository.criar).not.toHaveBeenCalled();
    });

    it('deve impedir que morador publique aviso da plataforma', async () => {
        await expect(
            notificacaoService.publicar(
                {
                    titulo: 'Aviso',
                    mensagem: 'Mensagem',
                    escopo: 'PLATAFORMA'
                },
                { id: 2, perfil: 'MORADOR' }
            )
        ).rejects.toMatchObject({ status: 403 });

        expect(notificacaoRepository.criar).not.toHaveBeenCalled();
    });

    it('deve publicar aviso da plataforma e emitir evento aos destinatários', async () => {
        const destinatarios = [2, 5];
        const emit = jest.fn();
        const io = {
            to: jest.fn().mockReturnValue({ emit })
        };

        getIO.mockReturnValue(io);
        notificacaoRepository.buscarTodosUsuarios.mockResolvedValue(destinatarios);
        notificacaoRepository.criar.mockResolvedValue({
            id: 10,
            titulo: 'Aviso',
            mensagem: 'Manutenção amanhã',
            tipo: 'AVISO',
            escopo: 'PLATAFORMA',
            condominio_id: null,
            criado_por: 1,
            destinatarios: 2
        });

        const resultado = await notificacaoService.publicar(
            {
                titulo: 'Aviso',
                mensagem: 'Manutenção amanhã',
                escopo: 'PLATAFORMA'
            },
            { id: 1, perfil: 'ADMIN' }
        );

        expect(notificacaoRepository.criar).toHaveBeenCalled();
        expect(resultado.id).toBe(10);

        expect(io.to).toHaveBeenCalledTimes(2);
        expect(io.to).toHaveBeenNthCalledWith(1, 'usuario:2');
        expect(io.to).toHaveBeenNthCalledWith(2, 'usuario:5');

        expect(emit).toHaveBeenCalledTimes(2);
        expect(emit).toHaveBeenCalledWith(
            'nova_notificacao',
            expect.objectContaining({
                id: 10,
                titulo: 'Aviso'
            })
        );
    });

    it('deve salvar a notificação mesmo se o Socket.IO não estiver disponível', async () => {
        getIO.mockReturnValue(null);
        notificacaoRepository.buscarTodosUsuarios.mockResolvedValue([2]);
        notificacaoRepository.criar.mockResolvedValue({
            id: 11,
            titulo: 'Aviso',
            mensagem: 'Teste',
            tipo: 'AVISO',
            escopo: 'PLATAFORMA',
            condominio_id: null,
            criado_por: 1
        });

        const resultado = await notificacaoService.publicar(
            {
                titulo: 'Aviso',
                mensagem: 'Teste',
                escopo: 'PLATAFORMA'
            },
            { id: 1, perfil: 'ADMIN' }
        );

        expect(resultado.id).toBe(11);
        expect(getIO).toHaveBeenCalled();
    });
});
