const usuarioService = require('../services/usuarioService');

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

	const codigoValidacao = await usuarioService.gerarESalvarTokenValidacao(usuarioId);

        console.log(`Código de validação para ${email}: ${codigoValidacao}`);

        res.status(201).json({
            mensagem: 'Usuário criado com sucesso. Verifique seu e-mail para validar o cadastro.',
            usuarioId: usuarioId
        });

    } catch (error) {
        console.error('Erro ao criar usuário:', error);

        res.status(500).json({
            erro: 'Erro ao criar usuário'
        });
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

        if (error.message === 'USUARIO_NAO_ENCONTRADO') {
            res.status(404).json({ erro: 'Usuário não encontrado' });
            return;
        }

        if (error.message === 'CODIGO_INVALIDO') {
            res.status(400).json({ erro: 'Código de validação incorreto' });
            return;
        }

        if (error.message === 'CODIGO_EXPIRADO') {
            res.status(400).json({ erro: 'Código de validação expirado' });
            return;
        }

        if (error.message === 'CADASTRO_JA_VALIDADO') {
            res.status(400).json({ erro: 'Este cadastro já foi validado anteriormente' });
            return;
        }

        res.status(500).json({ erro: 'Erro ao validar e-mail' });
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
    excluirUsuarioEPedido,
    validarEmail,
    listarPendentes,
  aprovarMorador,
  rejeitarMorador
};
