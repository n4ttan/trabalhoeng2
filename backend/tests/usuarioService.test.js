jest.mock('../src/repositories/usuarioRepository', () => ({
    criarUsuario: jest.fn(),
    criarMorador: jest.fn(),
    excluirUsuarioEPedido: jest.fn(),
    salvarTokenValidacao: jest.fn(),
    buscarPorEmail: jest.fn(),
    reservarTentativaValidacao: jest.fn(),
    confirmarEmail: jest.fn(),
    listarPendentes: jest.fn(),
    aprovarMorador: jest.fn(),
    rejeitarMorador: jest.fn(),
}));

jest.mock('../src/services/emailService', () => ({
    sendVerificationCode: jest.fn(),
}));

const usuarioRepository = require('../src/repositories/usuarioRepository');
const usuarioService = require('../src/services/usuarioService');

beforeEach(() => {
    jest.resetAllMocks();
});

describe('criarUsuario', () => {
    test('repassa o perfil recebido, sem unidade, e devolve o id', async () => {
        usuarioRepository.criarUsuario.mockResolvedValue(7);

        const id = await usuarioService.criarUsuario('Ana', 'ana@x.com', 'segredo', 'CANDIDATO');

        expect(id).toBe(7);
        const [nome, email, hash, perfil, extra] = usuarioRepository.criarUsuario.mock.calls[0];
        expect([nome, email, perfil, extra]).toEqual(['Ana', 'ana@x.com', 'CANDIDATO', undefined]);
        expect(hash).not.toBe('segredo');
        expect(usuarioRepository.criarMorador).not.toHaveBeenCalled();
    });

    test.each(['SINDICO', 'ADMIN_PLATAFORMA', 'MORADOR', '', undefined])(
        'rejeita perfil %p com 400 PERFIL_INVALIDO e não grava',
        async (perfil) => {
            await expect(
                usuarioService.criarUsuario('Ana', 'ana@x.com', 'segredo', perfil)
            ).rejects.toMatchObject({ status: 400, codigo: 'PERFIL_INVALIDO', message: 'Perfil inválido.' });
            expect(usuarioRepository.criarUsuario).not.toHaveBeenCalled();
        }
    );
});

describe('listarPendentes', () => {
    it('deve listar os moradores pendentes', async () => {
        const pendentes = [
            {
                id: 1,
                nome: 'João da Silva',
                email: 'joao@email.com'
            }
        ];

        usuarioRepository.listarPendentes.mockResolvedValue(pendentes);

        const resultado = await usuarioService.listarPendentes();

        expect(usuarioRepository.listarPendentes).toHaveBeenCalledTimes(1);
        expect(resultado).toEqual(pendentes);
    });
});

describe('aprovarMorador', () => {
    it('deve aprovar o morador', async () => {
        usuarioRepository.aprovarMorador.mockResolvedValue(true);

        const resultado = await usuarioService.aprovarMorador(1);

        expect(usuarioRepository.aprovarMorador).toHaveBeenCalledWith(1, undefined);
        expect(resultado).toEqual({
            mensagem: 'Morador aprovado com sucesso'
        });
    });

    it('deve lançar erro quando o morador não puder ser aprovado', async () => {
        usuarioRepository.aprovarMorador.mockResolvedValue(false);

        await expect(
            usuarioService.aprovarMorador(1)
        ).rejects.toMatchObject({
            status: 404
        });

        expect(usuarioRepository.aprovarMorador).toHaveBeenCalledWith(1, undefined);
    });

    it('repassa o condomínio ao repositório para limitar a aprovação', async () => {
        usuarioRepository.aprovarMorador.mockResolvedValue(true);

        await usuarioService.aprovarMorador(1, 4);

        expect(usuarioRepository.aprovarMorador).toHaveBeenCalledWith(1, 4);
    });

    it('devolve 404 quando o morador pendente é de outro condomínio', async () => {
        usuarioRepository.aprovarMorador.mockResolvedValue(false);

        await expect(usuarioService.aprovarMorador(1, 4)).rejects.toMatchObject({ status: 404 });
    });
});

describe('rejeitarMorador', () => {
    it('deve rejeitar o morador', async () => {
        usuarioRepository.rejeitarMorador.mockResolvedValue(true);

        const resultado = await usuarioService.rejeitarMorador(1);

        expect(usuarioRepository.rejeitarMorador).toHaveBeenCalledWith(1, undefined);
        expect(resultado).toEqual({
            mensagem: 'Morador rejeitado com sucesso'
        });
    });

    it('deve lançar erro quando o morador não puder ser rejeitado', async () => {
        usuarioRepository.rejeitarMorador.mockResolvedValue(false);

        await expect(
            usuarioService.rejeitarMorador(1)
        ).rejects.toMatchObject({
            status: 404
        });

        expect(usuarioRepository.rejeitarMorador).toHaveBeenCalledWith(1, undefined);
    });

    it('repassa o condomínio ao repositório para limitar a rejeição', async () => {
        usuarioRepository.rejeitarMorador.mockResolvedValue(true);

        await usuarioService.rejeitarMorador(1, 4);

        expect(usuarioRepository.rejeitarMorador).toHaveBeenCalledWith(1, 4);
    });

    it('devolve 404 quando o morador pendente é de outro condomínio', async () => {
        usuarioRepository.rejeitarMorador.mockResolvedValue(false);

        await expect(usuarioService.rejeitarMorador(1, 4)).rejects.toMatchObject({ status: 404 });
    });
});

describe('criarMorador', () => {
    test('ignora qualquer perfil enviado de fora e grava MORADOR', async () => {
        usuarioRepository.criarMorador.mockResolvedValue(3);

        // Um 5º argumento (perfil) vindo de fora não deve influenciar o resultado.
        await usuarioService.criarMorador('Ana', 'ana@x.com', 'segredo', 'A1', 'SINDICO');

        expect(usuarioRepository.criarMorador.mock.calls[0][3]).toBe('MORADOR');
    });

    test('cadastra como MORADOR com unidade e devolve id e e-mail normalizado', async () => {
        usuarioRepository.criarMorador.mockResolvedValue(9);

        const r = await usuarioService.criarMorador(' Ana ', ' ana@x.com ', 'segredo', ' A-101 ');

        expect(r).toEqual({ usuarioId: 9, email: 'ana@x.com' });
        const [nome, email, hash, perfil, unidade] = usuarioRepository.criarMorador.mock.calls[0];
        expect([nome, email, perfil, unidade]).toEqual(['Ana', 'ana@x.com', 'MORADOR', 'A-101']);
        expect(hash).not.toBe('segredo');
        expect(usuarioRepository.criarUsuario).not.toHaveBeenCalled();
    });

    test.each([
        ['campos vazios', ['', 'a@x.com', 'segredo', 'A1'], 'CAMPOS_OBRIGATORIOS'],
        ['sem unidade', ['Ana', 'a@x.com', 'segredo', ''], 'CAMPOS_OBRIGATORIOS'],
        ['e-mail inválido', ['Ana', 'invalido', 'segredo', 'A1'], 'EMAIL_INVALIDO'],
        ['senha curta', ['Ana', 'a@x.com', '123', 'A1'], 'SENHA_CURTA'],
        ['senha vazia', ['Ana', 'a@x.com', '', 'A1'], 'CAMPOS_OBRIGATORIOS'],
        ['nome com mais de 100 caracteres', ['a'.repeat(101), 'a@x.com', 'segredo', 'A1'], 'NOME_LONGO'],
        ['e-mail com mais de 255 caracteres', ['Ana', `${'a'.repeat(250)}@x.com`, 'segredo', 'A1'], 'EMAIL_LONGO'],
        ['unidade com mais de 20 caracteres', ['Ana', 'a@x.com', 'segredo', 'U'.repeat(21)], 'UNIDADE_LONGA'],
        ['senha com mais de 72 caracteres', ['Ana', 'a@x.com', 's'.repeat(73), 'A1'], 'SENHA_LONGA'],
    ])('rejeita %s', async (_, args, codigo) => {
        await expect(usuarioService.criarMorador(...args)).rejects.toMatchObject({ status: 400, codigo });
        expect(usuarioRepository.criarMorador).not.toHaveBeenCalled();
    });
});

describe('gerarCodigoValidacao', () => {
    test('retorna string com 6 dígitos numéricos em 50 execuções', () => {
        for (let i = 0; i < 50; i++) {
            const codigo = usuarioService.gerarCodigoValidacao();
            expect(typeof codigo).toBe('string');
            expect(codigo).toMatch(/^\d{6}$/);
        }
    });
});

describe('gerarESalvarTokenValidacao', () => {
    test('chama salvarTokenValidacao com o código e expiração ~15 minutos no futuro', async () => {
        usuarioRepository.salvarTokenValidacao.mockResolvedValue();

        const antes = Date.now();
        const codigo = await usuarioService.gerarESalvarTokenValidacao(42);
        const depois = Date.now();

        expect(codigo).toMatch(/^\d{6}$/);
        expect(usuarioRepository.salvarTokenValidacao).toHaveBeenCalledTimes(1);
        const [usuarioId, codigoSalvo, expiraEm] =
            usuarioRepository.salvarTokenValidacao.mock.calls[0];

        expect(usuarioId).toBe(42);
        expect(codigoSalvo).toBe(codigo);
        expect(expiraEm).toBeInstanceOf(Date);

        const quinzeMin = 15 * 60 * 1000;
        expect(expiraEm.getTime()).toBeGreaterThanOrEqual(antes + quinzeMin);
        expect(expiraEm.getTime()).toBeLessThanOrEqual(depois + quinzeMin);
    });
});

describe('validarEmail', () => {
    const futuro = () => new Date(Date.now() + 10 * 60 * 1000);
    const passado = () => new Date(Date.now() - 10 * 60 * 1000);

    const usuarioBase = (extra = {}) => ({
        id: 7,
        status_cadastro: 'AGUARDANDO_EMAIL',
        token_validacao: '123456',
        token_expira_em: futuro(),
        tentativas_validacao: 0,
        ...extra,
    });

    async function capturarErro(promessa) {
        try {
            await promessa;
        } catch (erro) {
            return erro;
        }
        throw new Error('Era esperado que a promessa fosse rejeitada');
    }

    test('sucesso quando o código está correto e não expirou', async () => {
        usuarioRepository.buscarPorEmail.mockResolvedValue(usuarioBase());
        usuarioRepository.reservarTentativaValidacao.mockResolvedValue(true);
        usuarioRepository.confirmarEmail.mockResolvedValue(1);

        await expect(
            usuarioService.validarEmail('a@b.com', '123456')
        ).resolves.toBe(true);
        expect(usuarioRepository.buscarPorEmail).toHaveBeenCalledWith('a@b.com');
        expect(usuarioRepository.confirmarEmail).toHaveBeenCalledWith(7);
    });

    test('sucesso avança o status via confirmarEmail (que zera as tentativas no banco)', async () => {
        usuarioRepository.buscarPorEmail.mockResolvedValue(
            usuarioBase({ tentativas_validacao: 3 })
        );
        usuarioRepository.reservarTentativaValidacao.mockResolvedValue(true);
        usuarioRepository.confirmarEmail.mockResolvedValue(1);

        await usuarioService.validarEmail('a@b.com', '123456');

        expect(usuarioRepository.confirmarEmail).toHaveBeenCalledTimes(1);
        expect(usuarioRepository.confirmarEmail).toHaveBeenCalledWith(7);
    });

    test('aceita o código enviado como número', async () => {
        usuarioRepository.buscarPorEmail.mockResolvedValue(usuarioBase());
        usuarioRepository.reservarTentativaValidacao.mockResolvedValue(true);
        usuarioRepository.confirmarEmail.mockResolvedValue(1);

        await expect(
            usuarioService.validarEmail('a@b.com', 123456)
        ).resolves.toBe(true);
    });

    test('aceita o código com espaços nas pontas', async () => {
        usuarioRepository.buscarPorEmail.mockResolvedValue(usuarioBase());
        usuarioRepository.reservarTentativaValidacao.mockResolvedValue(true);
        usuarioRepository.confirmarEmail.mockResolvedValue(1);

        await expect(
            usuarioService.validarEmail('a@b.com', ' 123456 ')
        ).resolves.toBe(true);
    });

    test('lança USUARIO_NAO_ENCONTRADO (404) quando o e-mail não existe', async () => {
        usuarioRepository.buscarPorEmail.mockResolvedValue(null);

        const erro = await capturarErro(
            usuarioService.validarEmail('x@y.com', '123456')
        );

        expect(erro.codigo).toBe('USUARIO_NAO_ENCONTRADO');
        expect(erro.status).toBe(404);
        expect(usuarioRepository.confirmarEmail).not.toHaveBeenCalled();
    });

    test('lança CODIGO_INVALIDO (400) quando o código não confere', async () => {
        usuarioRepository.buscarPorEmail.mockResolvedValue(usuarioBase());
        usuarioRepository.reservarTentativaValidacao.mockResolvedValue(true);

        const erro = await capturarErro(
            usuarioService.validarEmail('a@b.com', '000000')
        );

        expect(erro.codigo).toBe('CODIGO_INVALIDO');
        expect(erro.status).toBe(400);
        expect(usuarioRepository.reservarTentativaValidacao).toHaveBeenCalledTimes(1);
        expect(usuarioRepository.confirmarEmail).not.toHaveBeenCalled();
    });

    test('rejeita quando o token no banco é null, sem gastar tentativa', async () => {
        usuarioRepository.buscarPorEmail.mockResolvedValue(
            usuarioBase({ token_validacao: null })
        );

        const erro = await capturarErro(
            usuarioService.validarEmail('a@b.com', null)
        );

        expect(erro.codigo).toBe('CODIGO_INVALIDO');
        expect(usuarioRepository.reservarTentativaValidacao).not.toHaveBeenCalled();
        expect(usuarioRepository.confirmarEmail).not.toHaveBeenCalled();
    });

    test('lança CODIGO_EXPIRADO (400) quando o código correto expirou, sem gastar tentativa', async () => {
        usuarioRepository.buscarPorEmail.mockResolvedValue(
            usuarioBase({ token_expira_em: passado() })
        );

        const erro = await capturarErro(
            usuarioService.validarEmail('a@b.com', '123456')
        );

        expect(erro.codigo).toBe('CODIGO_EXPIRADO');
        expect(erro.status).toBe(400);
        expect(usuarioRepository.reservarTentativaValidacao).not.toHaveBeenCalled();
        expect(usuarioRepository.confirmarEmail).not.toHaveBeenCalled();
    });

    test('lança CADASTRO_JA_VALIDADO quando o status não é AGUARDANDO_EMAIL', async () => {
        usuarioRepository.buscarPorEmail.mockResolvedValue(
            usuarioBase({ status_cadastro: 'PENDENTE_APROVACAO', token_validacao: null })
        );

        const erro = await capturarErro(
            usuarioService.validarEmail('a@b.com', '123456')
        );

        expect(erro.codigo).toBe('CADASTRO_JA_VALIDADO');
        expect(usuarioRepository.confirmarEmail).not.toHaveBeenCalled();
    });

    test('lança CADASTRO_JA_VALIDADO quando confirmarEmail afeta 0 linhas', async () => {
        usuarioRepository.buscarPorEmail.mockResolvedValue(usuarioBase());
        usuarioRepository.reservarTentativaValidacao.mockResolvedValue(true);
        usuarioRepository.confirmarEmail.mockResolvedValue(0);

        const erro = await capturarErro(
            usuarioService.validarEmail('a@b.com', '123456')
        );

        expect(erro.codigo).toBe('CADASTRO_JA_VALIDADO');
    });

    test('a 5ª tentativa errada retorna CODIGO_BLOQUEADO (429)', async () => {
        usuarioRepository.buscarPorEmail.mockResolvedValue(
            usuarioBase({ tentativas_validacao: 4 })
        );
        usuarioRepository.reservarTentativaValidacao.mockResolvedValue(true);

        const erro = await capturarErro(
            usuarioService.validarEmail('a@b.com', '000000')
        );

        expect(erro.codigo).toBe('CODIGO_BLOQUEADO');
        expect(erro.status).toBe(429);
    });

    test('5 tentativas erradas seguidas terminam em CODIGO_BLOQUEADO', async () => {
        let tentativas = 0;
        usuarioRepository.buscarPorEmail.mockImplementation(async () =>
            usuarioBase({ tentativas_validacao: tentativas })
        );
        usuarioRepository.reservarTentativaValidacao.mockImplementation(
            async (id, maximo) => {
                if (tentativas >= maximo) return false;
                tentativas += 1;
                return true;
            }
        );

        const codigos = [];
        for (let i = 0; i < 5; i++) {
            const erro = await capturarErro(
                usuarioService.validarEmail('a@b.com', '000000')
            );
            codigos.push(erro.codigo);
        }

        expect(codigos).toEqual([
            'CODIGO_INVALIDO',
            'CODIGO_INVALIDO',
            'CODIGO_INVALIDO',
            'CODIGO_INVALIDO',
            'CODIGO_BLOQUEADO',
        ]);

        const erroCorreto = await capturarErro(
            usuarioService.validarEmail('a@b.com', '123456')
        );
        expect(erroCorreto.codigo).toBe('CODIGO_BLOQUEADO');
        expect(erroCorreto.status).toBe(429);
        expect(usuarioRepository.confirmarEmail).not.toHaveBeenCalled();
    });

    test('CODIGO_BLOQUEADO quando já havia 5 tentativas, mesmo com o código certo', async () => {
        usuarioRepository.buscarPorEmail.mockResolvedValue(
            usuarioBase({ tentativas_validacao: 5 })
        );

        const erro = await capturarErro(
            usuarioService.validarEmail('a@b.com', '123456')
        );

        expect(erro.codigo).toBe('CODIGO_BLOQUEADO');
        expect(usuarioRepository.reservarTentativaValidacao).not.toHaveBeenCalled();
        expect(usuarioRepository.confirmarEmail).not.toHaveBeenCalled();
    });

    test('CODIGO_BLOQUEADO quando a reserva atômica da tentativa é negada', async () => {
        usuarioRepository.buscarPorEmail.mockResolvedValue(usuarioBase());
        usuarioRepository.reservarTentativaValidacao.mockResolvedValue(false);

        const erro = await capturarErro(
            usuarioService.validarEmail('a@b.com', '123456')
        );

        expect(erro.codigo).toBe('CODIGO_BLOQUEADO');
        expect(usuarioRepository.confirmarEmail).not.toHaveBeenCalled();
    });
});

describe('reenviarCodigo', () => {
    test('para AGUARDANDO_EMAIL gera e salva novo código (o repositório zera as tentativas)', async () => {
        usuarioRepository.buscarPorEmail.mockResolvedValue({
            id: 9,
            status_cadastro: 'AGUARDANDO_EMAIL',
            tentativas_validacao: 5,
        });
        usuarioRepository.salvarTokenValidacao.mockResolvedValue(1);

        const resultado = await usuarioService.reenviarCodigo(' a@b.com ');

        expect(usuarioRepository.buscarPorEmail).toHaveBeenCalledWith('a@b.com');
        expect(resultado.email).toBe('a@b.com');
        expect(resultado.codigo).toMatch(/^\d{6}$/);

        expect(usuarioRepository.salvarTokenValidacao).toHaveBeenCalledTimes(1);
        const [usuarioId, codigoSalvo, expiraEm] =
            usuarioRepository.salvarTokenValidacao.mock.calls[0];
        expect(usuarioId).toBe(9);
        expect(codigoSalvo).toBe(resultado.codigo);
        expect(expiraEm.getTime()).toBeGreaterThan(Date.now());
    });

    test.each(['PENDENTE_APROVACAO', 'APROVADO', 'REJEITADO'])(
        'devolve null e não gera código para status %s',
        async (status) => {
            usuarioRepository.buscarPorEmail.mockResolvedValue({
                id: 9,
                status_cadastro: status,
            });

            await expect(usuarioService.reenviarCodigo('a@b.com')).resolves.toBeNull();
            expect(usuarioRepository.salvarTokenValidacao).not.toHaveBeenCalled();
        }
    );

    const codigoCriadoHa = (segundos) => new Date(Date.now() - segundos * 1000 + 15 * 60 * 1000);

    test('dentro de 60 s do último código não gera nem devolve novo código', async () => {
        usuarioRepository.buscarPorEmail.mockResolvedValue({
            id: 9,
            status_cadastro: 'AGUARDANDO_EMAIL',
            token_expira_em: codigoCriadoHa(30),
        });

        await expect(usuarioService.reenviarCodigo('a@b.com')).resolves.toBeNull();
        expect(usuarioRepository.salvarTokenValidacao).not.toHaveBeenCalled();
    });

    test('após 60 s do último código gera e devolve novo código', async () => {
        usuarioRepository.buscarPorEmail.mockResolvedValue({
            id: 9,
            status_cadastro: 'AGUARDANDO_EMAIL',
            token_expira_em: codigoCriadoHa(61),
        });
        usuarioRepository.salvarTokenValidacao.mockResolvedValue(1);

        const resultado = await usuarioService.reenviarCodigo('a@b.com');

        expect(resultado).toMatchObject({ email: 'a@b.com' });
        expect(resultado.codigo).toMatch(/^\d{6}$/);
        expect(usuarioRepository.salvarTokenValidacao).toHaveBeenCalledTimes(1);
    });

    test('devolve null quando o e-mail não existe (sem revelar cadastro)', async () => {
        usuarioRepository.buscarPorEmail.mockResolvedValue(undefined);

        await expect(usuarioService.reenviarCodigo('x@y.com')).resolves.toBeNull();
        expect(usuarioRepository.salvarTokenValidacao).not.toHaveBeenCalled();
    });

    test('lança EMAIL_INVALIDO (400) para e-mail malformado', async () => {
        let erro;
        try {
            await usuarioService.reenviarCodigo('sem-arroba');
        } catch (e) {
            erro = e;
        }

        expect(erro.codigo).toBe('EMAIL_INVALIDO');
        expect(erro.status).toBe(400);
        expect(usuarioRepository.buscarPorEmail).not.toHaveBeenCalled();
    });
});
