jest.mock('../src/repositories/reuniaoRepository', () => ({
    buscarPorCondominio: jest.fn(),
    salvar: jest.fn(),
    remover: jest.fn()
}));

const reuniaoRepository = require('../src/repositories/reuniaoRepository');
const reuniaoService = require('../src/services/reuniaoService');

describe('reuniaoService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('deve listar reuniões por condomínio', async () => {
        const reunioes = [{ id: 1, titulo: 'Assembleia' }];
        reuniaoRepository.buscarPorCondominio.mockResolvedValue(reunioes);

        const resultado = await reuniaoService.listarPorCondominio(1);

        expect(reuniaoRepository.buscarPorCondominio).toHaveBeenCalledWith(1);
        expect(resultado).toBe(reunioes);
    });

    it('deve criar uma nova reunião', async () => {
        const dados = {
            id_condominio: 1,
            titulo: 'Reunião',
            pauta: 'Orçamento',
            data_hora: '2026-11-20 19:00',
            local_link: 'Auditório'
        };
        const criada = { id: 5, ...dados };
        reuniaoRepository.salvar.mockResolvedValue(criada);

        const resultado = await reuniaoService.criar(dados);

        expect(reuniaoRepository.salvar).toHaveBeenCalledWith(dados);
        expect(resultado).toBe(criada);
    });

    it('deve deletar uma reunião', async () => {
        reuniaoRepository.remover.mockResolvedValue(true);

        const resultado = await reuniaoService.deletar(5);

        expect(reuniaoRepository.remover).toHaveBeenCalledWith(5);
        expect(resultado).toBe(true);
    });
});
