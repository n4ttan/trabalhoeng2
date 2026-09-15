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

module.exports = {
    criarUsuario,
    excluirUsuarioEPedido
};