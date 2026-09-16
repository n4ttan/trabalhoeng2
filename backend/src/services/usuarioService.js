const bcrypt = require('bcrypt');
const usuarioRepository = require('../repositories/usuarioRepository');

// Criptografa a senha antes de persistir o usuário para não salvar texto puro.
async function criarUsuario(nome, email, senha, perfil) {
    const senhaHash = await bcrypt.hash(senha, 10);

    return usuarioRepository.criarUsuario(
        nome,
        email,
        senhaHash,
        perfil
    );
}

// Repassa a exclusão do usuário para o repositório, mantendo a regra de negócio simples.
async function excluirUsuarioEPedido(usuarioId) {
    return usuarioRepository.excluirUsuarioEPedido(usuarioId);
}

// Gera um código numérico de 6 dígitos para validação de e-mail.
function gerarCodigoValidacao() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Cria o código de validação, define a expiração e salva no usuário informado.
async function gerarESalvarTokenValidacao(usuarioId) {
    const codigo = gerarCodigoValidacao();

    const expiraEm = new Date();
    expiraEm.setMinutes(expiraEm.getMinutes() + 15);

    await usuarioRepository.salvarTokenValidacao(usuarioId, codigo, expiraEm);

    return codigo;
}

// Confirma o código informado pelo usuário e avança o status do cadastro.
async function validarEmail(email, codigoInformado) {
    const usuario = await usuarioRepository.buscarPorEmail(email);

    if (!usuario) {
        throw new Error('USUARIO_NAO_ENCONTRADO');
    }

    if (usuario.token_validacao !== codigoInformado) {
        throw new Error('CODIGO_INVALIDO');
    }

    if (new Date(usuario.token_expira_em) < new Date()) {
        throw new Error('CODIGO_EXPIRADO');
    }

    const linhasAfetadas = await usuarioRepository.confirmarEmail(usuario.id);

    if (linhasAfetadas === 0) {
        throw new Error('CADASTRO_JA_VALIDADO');
    }

    return true;
}

module.exports = {
    criarUsuario,
    excluirUsuarioEPedido,
    gerarESalvarTokenValidacao,
    validarEmail
};
