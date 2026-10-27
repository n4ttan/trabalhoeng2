//Teste para o serviço de envio de e-mails
describe('emailService - sendVerificationCode', () => {
    let sendVerificationCode;
    let fetchOriginal;
    let fetchMock;

    beforeEach(() => {
        jest.resetModules();

        fetchOriginal = global.fetch;
        fetchMock = jest.fn();
        global.fetch = fetchMock;

        process.env.BREVO_API_KEY = 'chave-teste';
        process.env.EMAIL_USER = 'sistema@exemplo.com';

        ({ sendVerificationCode } = require('../src/services/emailService'));
    });

    afterEach(() => {
        global.fetch = fetchOriginal;
        delete process.env.BREVO_API_KEY;
        delete process.env.EMAIL_USER;
        jest.resetModules();
    });

    it('deve enviar o e-mail e retornar a resposta da API quando houver sucesso', async () => {
        const respostaApi = {
            messageId: 'mensagem-teste-123'
        };

        fetchMock.mockResolvedValue({
            ok: true,
            status: 201,
            json: jest.fn().mockResolvedValue(respostaApi)
        });

        const resultado = await sendVerificationCode(
            'morador@exemplo.com',
            '123456'
        );

        expect(fetchMock).toHaveBeenCalledTimes(1);

        const [url, opcoes] = fetchMock.mock.calls[0];

        expect(url).toBe('https://api.brevo.com/v3/smtp/email');
        expect(opcoes.method).toBe('POST');
        expect(opcoes.headers).toEqual({
            'api-key': 'chave-teste',
            'content-type': 'application/json',
            accept: 'application/json'
        });

        const corpo = JSON.parse(opcoes.body);

        expect(corpo.sender).toEqual({
            name: 'Sistema Condomínio',
            email: 'sistema@exemplo.com'
        });
        expect(corpo.to).toEqual([
            { email: 'morador@exemplo.com' }
        ]);
        expect(corpo.subject).toBe(
            'Código de Confirmação - Cadastro no Condomínio'
        );
        expect(corpo.htmlContent).toContain('123456');
        expect(resultado).toEqual(respostaApi);
    });

    it('deve lançar erro quando a API retornar uma resposta não bem-sucedida', async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 400,
            text: jest.fn().mockResolvedValue('Dados inválidos')
        });

        await expect(
            sendVerificationCode('morador@exemplo.com', '123456')
        ).rejects.toThrow(
            'Falha ao enviar e-mail (Brevo 400): Dados inválidos'
        );

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('deve propagar o erro quando a requisição falhar', async () => {
        const erro = new Error('Falha de conexão');

        fetchMock.mockRejectedValue(erro);

        await expect(
            sendVerificationCode('morador@exemplo.com', '123456')
        ).rejects.toBe(erro);

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('deve propagar o erro quando a leitura do corpo da resposta falhar', async () => {
        const erro = new Error('Falha ao ler resposta');

        fetchMock.mockResolvedValue({
            ok: false,
            status: 500,
            text: jest.fn().mockRejectedValue(erro)
        });

        await expect(
            sendVerificationCode('morador@exemplo.com', '123456')
        ).rejects.toBe(erro);
    });

    it('deve propagar o erro quando a leitura do JSON de sucesso falhar', async () => {
        const erro = new Error('JSON inválido');

        fetchMock.mockResolvedValue({
            ok: true,
            status: 200,
            json: jest.fn().mockRejectedValue(erro)
        });

        await expect(
            sendVerificationCode('morador@exemplo.com', '123456')
        ).rejects.toBe(erro);
    });
});