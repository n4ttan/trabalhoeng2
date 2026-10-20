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
    listarGerenciamentosUsuario: jest.fn()
}));

const condominioService = require('../src/services/condominioService');
const condominioController = require('../src/controllers/condominioController');

let consoleErrorSpy;

beforeEach(() => {
    jest.resetAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    consoleErrorSpy.mockRestore();
});

describe('condominioController', () => {
    it('deve adicionar um condomínio com sucesso', async () => {
        const req = { body: { nome: 'Residencial Flores' } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        condominioService.criarCondominio.mockResolvedValue({ id: 1, nome: 'Residencial Flores' });

        await condominioController.adicionarCondominio(req, res);

        expect(condominioService.criarCondominio).toHaveBeenCalledWith('Residencial Flores');
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            mensagem: 'Condomínio criado com sucesso.',
            condominio: { id: 1, nome: 'Residencial Flores' }
        });
    });

    it('deve retirar um condomínio com sucesso', async () => {
        const req = { params: { idCondominio: '1' }, body: {} };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        condominioService.excluirCondominio.mockResolvedValue({ mensagem: 'Condomínio excluído com sucesso.' });

        await condominioController.retirarCondominio(req, res);

        expect(condominioService.excluirCondominio).toHaveBeenCalledWith('1');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ mensagem: 'Condomínio excluído com sucesso.' });
    });

    it('deve listar condomínios com sucesso', async () => {
        const req = {};
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        condominioService.listarCondominios.mockResolvedValue([{ id: 1, nome: 'Residencial Flores' }]);

        await condominioController.listarCondominios(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([{ id: 1, nome: 'Residencial Flores' }]);
    });

    it('deve adicionar morador ao condomínio', async () => {
        const req = {
            params: { idCondominio: '1' },
            body: { usuarioId: 10, blocoId: 2, unidade: '101' }
        };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        condominioService.adicionarMorador.mockResolvedValue({
            mensagem: 'Morador adicionado ao condomínio com sucesso.'
        });

        await condominioController.adicionarMorador(req, res);

        expect(condominioService.adicionarMorador).toHaveBeenCalledWith('1', 10, 2, '101');
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deve definir o morador em um bloco e unidade', async () => {
        const req = {
            params: { idCondominio: '1', usuarioId: '10' },
            body: { idBloco: 3, bloco: 'Bloco C', unidade: '302' }
        };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        condominioService.definirMoradorBloco.mockResolvedValue({
            mensagem: 'Morador atribuído ao bloco com sucesso.'
        });

        await condominioController.definirMoradorBloco(req, res);

        expect(condominioService.definirMoradorBloco).toHaveBeenCalledWith('1', '10', 3, 'Bloco C', '302');
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deve listar moradores de um condomínio', async () => {
        const req = { params: { idCondominio: '1' }, query: { blocoId: '2' } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        condominioService.listarMoradores.mockResolvedValue([{ id: 10, nome: 'Carlos' }]);

        await condominioController.listarMoradores(req, res);

        expect(condominioService.listarMoradores).toHaveBeenCalledWith('1', '2');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([{ id: 10, nome: 'Carlos' }]);
    });

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
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

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
});
