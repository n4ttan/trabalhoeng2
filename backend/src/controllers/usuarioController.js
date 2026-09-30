const usuarioService = require('../services/usuarioService');
const { sendVerificationCode } = require('../services/emailService');

// Responde com a mensagem do erro só quando ele é de negócio (tem status); senão, texto genérico.
function responderErro(res, error, mensagemGenerica) {
    if (error.status) {
        res.status(error.status).json({ erro: error.message, codigo: error.codigo });
        return;
    }

    res.status(500).json({ erro: mensagemGenerica });
}

// Controla o cadastro de usuário e devolve o ID gerado no banco.
async function criarUsuario(req, res) {
    try {
        const { nome, email, senha, perfil } = req.body;

        const usuarioId = await usuarioService.criarUsuario(
            nome,
            email,
            senha,
            perfil
        );

        res.status(201).json({
            mensagem: 'Usuário criado com sucesso. Verifique seu e-mail para validar o cadastro.',
            usuarioId: usuarioId
        });

    } catch (error) {
        console.error('Erro ao criar usuário:', error);

        if (error.codigo === 'PERFIL_INVALIDO') {
            res.status(400).json({ erro: error.message });
            return;
        }

        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ erro: 'E-mail já cadastrado' });
            return;
        }

        res.status(500).json({
            erro: 'Erro ao criar usuário'
        });
    }
}

// Controla o cadastro de morador com validação de e-mail e devolve o ID gerado no banco.
async function criarMorador(req, res) {
    try {
        const { nome, email, senha, unidade } = req.body;

        const usuario = await usuarioService.criarMorador(nome, email, senha, unidade);

        const codigoValidacao = await usuarioService.gerarESalvarTokenValidacao(usuario.usuarioId);

        // Envia o código por e-mail; se falhar, o morador pode pedir reenvio.
        try {
            await sendVerificationCode(usuario.email, codigoValidacao);
        } catch (erroEmail) {
            console.error('Erro ao enviar e-mail de validação:', erroEmail);
        }

        res.status(201).json({
            mensagem: 'Usuário criado com sucesso. Verifique seu e-mail para validar o cadastro.',
            usuarioId: usuario.usuarioId
        });

    } catch (error) {
        console.error('Erro ao criar morador:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ erro: 'E-mail já cadastrado' });
            return;
        }

        responderErro(res, error, 'Erro ao criar morador');
    }
}

// Remove um usuário informado pela URL e informa quando ele não existe.
async function excluirUsuarioEPedido(req, res) {
    try {
        const { usuarioId } = req.params;

        const resultado = await usuarioService.excluirUsuarioEPedido(usuarioId);

        if (resultado === 0) {
            res.status(404).json({
                erro: 'Usuário não encontrado'
            });
            return;
        }

        res.json({
            mensagem: 'Usuário e pedidos associados excluídos com sucesso'
        });
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);

        res.status(500).json({
            erro: 'Erro ao excluir usuário'
        });
    }
}


// Recebe o e-mail e o código digitado pelo morador e confirma a validação.
async function validarEmail(req, res) {
    try {
        const { email, codigo } = req.body;

        await usuarioService.validarEmail(email, codigo);

        res.json({
            mensagem: 'E-mail validado com sucesso. Aguarde a aprovação do síndico.'
        });
    } catch (error) {
        console.error('Erro ao validar e-mail:', error);

        responderErro(res, error, 'Erro ao validar e-mail');
    }
}

// Gera e envia um novo código; a resposta é a mesma exista ou não o e-mail.
async function reenviarCodigo(req, res) {
    try {
        const novoCodigo = await usuarioService.reenviarCodigo(req.body.email);

        if (novoCodigo) {
            try {
                await sendVerificationCode(novoCodigo.email, novoCodigo.codigo);
            } catch (erroEmail) {
                console.error('Erro ao reenviar e-mail de validação:', erroEmail);
            }
        }

        res.json({
            mensagem: 'Se o e-mail estiver aguardando validação, enviamos um novo código.'
        });
    } catch (error) {
        console.error('Erro ao reenviar código:', error);

        responderErro(res, error, 'Erro ao reenviar código');
    }
}

async function listarPendentes(req, res) {
  try {
    const moradores = await usuarioService.listarPendentes();
    return res.status(200).json(moradores);
  } catch (error) {
    return res.status(error.status || 500).json({ mensagem: error.message });
  }
}

async function aprovarMorador(req, res) {
  try {
    const { usuarioId } = req.params;
    const resultado = await usuarioService.aprovarMorador(usuarioId);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(error.status || 500).json({ mensagem: error.message });
  }
}

async function rejeitarMorador(req, res) {
  try {
    const { usuarioId } = req.params;
    const resultado = await usuarioService.rejeitarMorador(usuarioId);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(error.status || 500).json({ mensagem: error.message });
  }
}

module.exports = {
    criarUsuario,
    criarMorador,
    excluirUsuarioEPedido,
    validarEmail,
    reenviarCodigo,
    listarPendentes,
  aprovarMorador,
  rejeitarMorador
};
