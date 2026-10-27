//Teste para o controller de condomínio
jest.mock('../src/services/condominioService', () => ({
    criarCondominio: jest.fn(),
    excluirCondominio: jest.fn(),
    listarCondominios: jest.fn(),
    buscarCondominioPorId: jest.fn(),
    adicionarMorador: jest.fn(),
    definirMoradorBloco: jest.fn(),
    listarMoradores: jest.fn(),
    criarBloco: jest.fn(),
    listarBlocos: jest.fn(),
    atribuirGestao: jest.fn(),
    removerGestao: jest.fn(),
    listarGerenciamentosUsuario: jest.fn()
}));

const condominioService = require('../src/services/condominioService');
const condominioController = require('../src/controllers/condominioController');

let consoleErrorSpy;

function criarResposta() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
}

beforeEach(() => {
    jest.resetAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    consoleErrorSpy.mockRestore();
});

describe('condominioController', () => {
    describe('adicionarCondominio', () => {
        it('deve adicionar um condomínio com sucesso', async () => {
            const req = { body: { nome: 'Residencial Flores' } };
            const res = criarResposta();

            condominioService.criarCondominio.mockResolvedValue({
                id: 1,
                nome: 'Residencial Flores'
            });

            await condominioController.adicionarCondominio(req, res);

            expect(condominioService.criarCondominio).toHaveBeenCalledWith('Residencial Flores');
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                mensagem: 'Condomínio criado com sucesso.',
                condominio: { id: 1, nome: 'Residencial Flores' }
            });
        });

        it('deve retornar erro com status e código quando o serviço os fornecer', async () => {
            const req = { body: { nome: 'Residencial Flores' } };
            const res = criarResposta();
            const erro = Object.assign(new Error('Nome inválido'), {
                status: 400,
                codigo: 'NOME_INVALIDO'
            });

            condominioService.criarCondominio.mockRejectedValue(erro);

            await condominioController.adicionarCondominio(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                erro: 'Nome inválido',
                codigo: 'NOME_INVALIDO'
            });
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });

        it('deve retornar erro 500 em caso de falha inesperada', async () => {
            const req = { body: { nome: 'Residencial Flores' } };
            const res = criarResposta();

            condominioService.criarCondominio.mockRejectedValue(new Error('Falha interna'));

            await condominioController.adicionarCondominio(req, res);

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Erro ao criar condomínio.',
                expect.any(Error)
            );
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                erro: 'Erro ao criar condomínio.'
            });
        });
    });

    describe('retirarCondominio', () => {
        it('deve retirar um condomínio com sucesso', async () => {
            const req = { params: { idCondominio: '1' }, body: {} };
            const res = criarResposta();

            condominioService.excluirCondominio.mockResolvedValue({
                mensagem: 'Condomínio excluído com sucesso.'
            });

            await condominioController.retirarCondominio(req, res);

            expect(condominioService.excluirCondominio).toHaveBeenCalledWith('1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                mensagem: 'Condomínio excluído com sucesso.'
            });
        });

        it('deve usar idCondominio do corpo se não houver parâmetro na rota', async () => {
            const req = { params: {}, body: { idCondominio: '2' } };
            const res = criarResposta();

            condominioService.excluirCondominio.mockResolvedValue({ ok: true });

            await condominioController.retirarCondominio(req, res);

            expect(condominioService.excluirCondominio).toHaveBeenCalledWith('2');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('deve usar id do corpo como alternativa', async () => {
            const req = { params: {}, body: { id: '3' } };
            const res = criarResposta();

            condominioService.excluirCondominio.mockResolvedValue({ ok: true });

            await condominioController.retirarCondominio(req, res);

            expect(condominioService.excluirCondominio).toHaveBeenCalledWith('3');
        });

        it('deve tratar erros inesperados ao retirar condomínio', async () => {
            const req = { params: {}, body: {} };
            const res = criarResposta();

            condominioService.excluirCondominio.mockRejectedValue(new Error('Falha'));

            await condominioController.retirarCondominio(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                erro: 'Erro ao excluir condomínio.'
            });
            expect(consoleErrorSpy).toHaveBeenCalled();
        });
    });

    describe('listarCondominios', () => {
        it('deve listar condomínios com sucesso', async () => {
            const req = {};
            const res = criarResposta();
            const condominios = [{ id: 1, nome: 'Residencial Flores' }];

            condominioService.listarCondominios.mockResolvedValue(condominios);

            await condominioController.listarCondominios(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(condominios);
        });

        it('deve tratar erros ao listar condomínios', async () => {
            const req = {};
            const res = criarResposta();

            condominioService.listarCondominios.mockRejectedValue(new Error('Falha'));

            await condominioController.listarCondominios(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                erro: 'Erro ao listar condomínios.'
            });
        });
    });

    describe('obterCondominio', () => {
        it('deve obter um condomínio pelo identificador', async () => {
            const req = { params: { idCondominio: '7' } };
            const res = criarResposta();
            const condominio = { id: 7, nome: 'Residencial Flores' };

            condominioService.buscarCondominioPorId.mockResolvedValue(condominio);

            await condominioController.obterCondominio(req, res);

            expect(condominioService.buscarCondominioPorId).toHaveBeenCalledWith('7');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(condominio);
        });

        it('deve tratar erros ao obter condomínio', async () => {
            const req = { params: { idCondominio: '7' } };
            const res = criarResposta();

            condominioService.buscarCondominioPorId.mockRejectedValue(new Error('Falha'));

            await condominioController.obterCondominio(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                erro: 'Erro ao obter condomínio.'
            });
        });
    });

    describe('adicionarMorador', () => {
        it('deve adicionar morador ao condomínio usando blocoId', async () => {
            const req = {
                params: { idCondominio: '1' },
                body: { usuarioId: 10, blocoId: 2, unidade: '101' }
            };
            const res = criarResposta();

            condominioService.adicionarMorador.mockResolvedValue({
                mensagem: 'Morador adicionado ao condomínio com sucesso.'
            });

            await condominioController.adicionarMorador(req, res);

            expect(condominioService.adicionarMorador).toHaveBeenCalledWith('1', 10, 2, '101');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('deve usar bloco quando blocoId não estiver informado', async () => {
            const req = {
                params: { idCondominio: '1' },
                body: { usuarioId: 10, bloco: 'Bloco B', unidade: '202' }
            };
            const res = criarResposta();

            condominioService.adicionarMorador.mockResolvedValue({ ok: true });

            await condominioController.adicionarMorador(req, res);

            expect(condominioService.adicionarMorador).toHaveBeenCalledWith(
                '1', 10, 'Bloco B', '202'
            );
        });

        it('deve tratar erros ao adicionar morador', async () => {
            const req = {
                params: { idCondominio: '1' },
                body: { usuarioId: 10 }
            };
            const res = criarResposta();

            condominioService.adicionarMorador.mockRejectedValue(new Error('Falha'));

            await condominioController.adicionarMorador(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                erro: 'Erro ao adicionar morador ao condomínio.'
            });
        });
    });

    describe('definirMoradorBloco', () => {
        it('deve definir o morador em um bloco e unidade', async () => {
            const req = {
                params: { idCondominio: '1', usuarioId: '10' },
                body: { idBloco: 3, bloco: 'Bloco C', unidade: '302' }
            };
            const res = criarResposta();

            condominioService.definirMoradorBloco.mockResolvedValue({
                mensagem: 'Morador atribuído ao bloco com sucesso.'
            });

            await condominioController.definirMoradorBloco(req, res);

            expect(condominioService.definirMoradorBloco).toHaveBeenCalledWith(
                '1', '10', 3, 'Bloco C', '302'
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('deve usar usuarioId do corpo se não houver nos parâmetros', async () => {
            const req = {
                params: { idCondominio: '1' },
                body: { usuarioId: '11', idBloco: 4, bloco: 'Bloco D', unidade: '401' }
            };
            const res = criarResposta();

            condominioService.definirMoradorBloco.mockResolvedValue({ ok: true });

            await condominioController.definirMoradorBloco(req, res);

            expect(condominioService.definirMoradorBloco).toHaveBeenCalledWith(
                '1', '11', 4, 'Bloco D', '401'
            );
        });

        it('deve tratar erros ao definir bloco do morador', async () => {
            const req = {
                params: { idCondominio: '1' },
                body: {}
            };
            const res = criarResposta();

            condominioService.definirMoradorBloco.mockRejectedValue(new Error('Falha'));

            await condominioController.definirMoradorBloco(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                erro: 'Erro ao definir bloco do morador.'
            });
        });
    });

    describe('listarMoradores', () => {
        it('deve listar moradores de um condomínio', async () => {
            const req = { params: { idCondominio: '1' }, query: { blocoId: '2' } };
            const res = criarResposta();
            const moradores = [{ id: 10, nome: 'Carlos' }];

            condominioService.listarMoradores.mockResolvedValue(moradores);

            await condominioController.listarMoradores(req, res);

            expect(condominioService.listarMoradores).toHaveBeenCalledWith('1', '2');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(moradores);
        });

        it('deve listar moradores sem filtro de bloco', async () => {
            const req = { params: { idCondominio: '1' }, query: {} };
            const res = criarResposta();

            condominioService.listarMoradores.mockResolvedValue([]);

            await condominioController.listarMoradores(req, res);

            expect(condominioService.listarMoradores).toHaveBeenCalledWith('1', undefined);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('deve tratar erros ao listar moradores', async () => {
            const req = { params: { idCondominio: '1' }, query: {} };
            const res = criarResposta();

            condominioService.listarMoradores.mockRejectedValue(new Error('Falha'));

            await condominioController.listarMoradores(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                erro: 'Erro ao listar moradores do condomínio.'
            });
        });
    });

    describe('criarBloco', () => {
        it('deve criar um bloco com sucesso', async () => {
            const req = {
                params: { idCondominio: '1' },
                body: { nome: 'Bloco A' }
            };
            const res = criarResposta();
            const bloco = { id: 2, nome: 'Bloco A' };

            condominioService.criarBloco.mockResolvedValue(bloco);

            await condominioController.criarBloco(req, res);

            expect(condominioService.criarBloco).toHaveBeenCalledWith('1', 'Bloco A');
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                mensagem: 'Bloco criado com sucesso.',
                bloco
            });
        });

        it('deve tratar erros ao criar bloco', async () => {
            const req = {
                params: { idCondominio: '1' },
                body: { nome: 'Bloco A' }
            };
            const res = criarResposta();

            condominioService.criarBloco.mockRejectedValue(new Error('Falha'));

            await condominioController.criarBloco(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                erro: 'Erro ao criar bloco.'
            });
        });
    });

    describe('listarBlocos', () => {
        it('deve listar blocos do condomínio', async () => {
            const req = { params: { idCondominio: '1' } };
            const res = criarResposta();
            const blocos = [{ id: 2, nome: 'Bloco A' }];

            condominioService.listarBlocos.mockResolvedValue(blocos);

            await condominioController.listarBlocos(req, res);

            expect(condominioService.listarBlocos).toHaveBeenCalledWith('1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(blocos);
        });

        it('deve tratar erros ao listar blocos', async () => {
            const req = { params: { idCondominio: '1' } };
            const res = criarResposta();

            condominioService.listarBlocos.mockRejectedValue(new Error('Falha'));

            await condominioController.listarBlocos(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                erro: 'Erro ao listar blocos do condomínio.'
            });
        });
    });

    describe('atribuirGerenciamento', () => {
        it('deve atribuir vários condomínios e blocos para gerenciamento', async () => {
            const req = {
                params: { usuarioId: '5' },
                body: {
                    condominios: [
                        { condominioId: 1, blocoId: 2 },
                        { condominioId: 2 }
                    ]
                }
            };
            const res = criarResposta();

            condominioService.atribuirGestao.mockResolvedValue({
                mensagem: 'Gerenciamento atribuído com sucesso.'
            });

            await condominioController.atribuirGerenciamento(req, res);

            expect(condominioService.atribuirGestao).toHaveBeenCalledWith('5', [
                { condominioId: 1, blocoId: 2 },
                { condominioId: 2 }
            ]);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('deve usar usuarioId do corpo como alternativa', async () => {
            const req = {
                params: {},
                body: { usuarioId: '6', condominios: [1, 2] }
            };
            const res = criarResposta();

            condominioService.atribuirGestao.mockResolvedValue({ ok: true });

            await condominioController.atribuirGerenciamento(req, res);

            expect(condominioService.atribuirGestao).toHaveBeenCalledWith('6', [1, 2]);
        });

        it('deve tratar erros ao atribuir gerenciamento', async () => {
            const req = { params: {}, body: { condominios: [] } };
            const res = criarResposta();

            condominioService.atribuirGestao.mockRejectedValue(new Error('Falha'));

            await condominioController.atribuirGerenciamento(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                erro: 'Erro ao atribuir gerenciamento.'
            });
        });
    });

    describe('listarGerenciamentos', () => {
        it('deve listar gerenciamentos usando usuarioId dos parâmetros', async () => {
            const req = { params: { usuarioId: '5' }, usuario: { id: 10, perfil: 'ADMIN' } };
            const res = criarResposta();

            condominioService.listarGerenciamentosUsuario.mockResolvedValue([]);

            await condominioController.listarGerenciamentos(req, res);

            expect(condominioService.listarGerenciamentosUsuario).toHaveBeenCalledWith('5');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([]);
        });

        it('deve permitir que o usuário veja os próprios gerenciamentos', async () => {
            const req = { params: { usuarioId: '10' }, usuario: { id: 10, perfil: 'SINDICO' } };
            const res = criarResposta();

            condominioService.listarGerenciamentosUsuario.mockResolvedValue([]);

            await condominioController.listarGerenciamentos(req, res);

            expect(condominioService.listarGerenciamentosUsuario).toHaveBeenCalledWith('10');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('deve negar a um não admin ver os gerenciamentos de outro usuário', async () => {
            const req = { params: { usuarioId: '5' }, usuario: { id: 10, perfil: 'SINDICO' } };
            const res = criarResposta();

            await condominioController.listarGerenciamentos(req, res);

            expect(condominioService.listarGerenciamentosUsuario).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                erro: 'Acesso negado. Você só pode ver os seus próprios gerenciamentos.',
                codigo: 'ACESSO_NEGADO'
            });
        });

        it('deve usar o id do usuário autenticado como alternativa', async () => {
            const req = { params: {}, usuario: { id: 10 } };
            const res = criarResposta();

            condominioService.listarGerenciamentosUsuario.mockResolvedValue([]);

            await condominioController.listarGerenciamentos(req, res);

            expect(condominioService.listarGerenciamentosUsuario).toHaveBeenCalledWith(10);
        });

        it('deve tratar erros ao listar gerenciamentos', async () => {
            const req = { params: {}, usuario: { id: 10 } };
            const res = criarResposta();

            condominioService.listarGerenciamentosUsuario.mockRejectedValue(new Error('Falha'));

            await condominioController.listarGerenciamentos(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                erro: 'Erro ao listar condomínios gerenciados.'
            });
        });
    });

    describe('removerGerenciamento', () => {
        it('deve remover uma atribuição de gerenciamento', async () => {
            const req = { params: { usuarioId: '5', gerenciamentoId: '9' } };
            const res = criarResposta();

            condominioService.removerGestao.mockResolvedValue({
                mensagem: 'Gerenciamento removido com sucesso.'
            });

            await condominioController.removerGerenciamento(req, res);

            expect(condominioService.removerGestao).toHaveBeenCalledWith('5', '9');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('deve repassar o status do erro de negócio', async () => {
            const req = { params: { usuarioId: '5', gerenciamentoId: '9' } };
            const res = criarResposta();
            const erro = new Error('Gerenciamento não encontrado para este usuário.');
            erro.status = 404;
            erro.codigo = 'GERENCIAMENTO_NAO_ENCONTRADO';

            condominioService.removerGestao.mockRejectedValue(erro);

            await condominioController.removerGerenciamento(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                erro: 'Gerenciamento não encontrado para este usuário.',
                codigo: 'GERENCIAMENTO_NAO_ENCONTRADO'
            });
        });

        it('deve tratar erros inesperados', async () => {
            const req = { params: { usuarioId: '5', gerenciamentoId: '9' } };
            const res = criarResposta();

            condominioService.removerGestao.mockRejectedValue(new Error('Falha'));

            await condominioController.removerGerenciamento(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ erro: 'Erro ao remover gerenciamento.' });
        });
    });

    describe('acessarCondominio', () => {
        it('deve permitir o acesso e retornar o condomínio', async () => {
            const req = { params: { idCondominio: '9' } };
            const res = criarResposta();
            const condominio = { id: 9, nome: 'Residencial Flores' };

            condominioService.buscarCondominioPorId.mockResolvedValue(condominio);

            await condominioController.acessarCondominio(req, res);

            expect(condominioService.buscarCondominioPorId).toHaveBeenCalledWith('9');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                mensagem: 'Acesso ao condomínio autorizado.',
                condominio
            });
        });

        it('deve tratar erros ao acessar condomínio', async () => {
            const req = { params: { idCondominio: '9' } };
            const res = criarResposta();

            condominioService.buscarCondominioPorId.mockRejectedValue(new Error('Falha'));

            await condominioController.acessarCondominio(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                erro: 'Erro ao acessar condomínio.'
            });
        });
    });
});