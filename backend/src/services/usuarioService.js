const bcrypt = require('bcrypt');
const crypto = require('crypto');
const usuarioRepository = require('../repositories/usuarioRepository');

// Cria um erro de negócio com status HTTP e código, seguro para ser exibido ao cliente.
function erroNegocio(status, codigo, mensagem) {
    const erro = new Error(mensagem);
    erro.status = status;
    erro.codigo = codigo;
    return erro;
}

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Valida os dados do cadastro de morador e devolve os valores já normalizados.
function validarDadosCadastro(nome, email, senha, unidade) {
    const nomeLimpo = typeof nome === 'string' ? nome.trim() : '';
    const emailLimpo = typeof email === 'string' ? email.trim() : '';
    const unidadeLimpa = typeof unidade === 'string' ? unidade.trim() : '';

    if (!nomeLimpo || !emailLimpo || !unidadeLimpa || typeof senha !== 'string' || !senha) {
        throw erroNegocio(400, 'CAMPOS_OBRIGATORIOS', 'Preencha nome, e-mail, senha e unidade.');
    }

    if (!REGEX_EMAIL.test(emailLimpo)) {
        throw erroNegocio(400, 'EMAIL_INVALIDO', 'Informe um e-mail válido.');
    }

    if (senha.length < 6) {
        throw erroNegocio(400, 'SENHA_CURTA', 'A senha deve possuir pelo menos 6 caracteres.');
    }

    return { nome: nomeLimpo, email: emailLimpo, unidade: unidadeLimpa };
}

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

// Valida os dados, criptografa a senha e cadastra sempre como MORADOR.
async function criarMorador(nome, email, senha, unidade) {
    const dados = validarDadosCadastro(nome, email, senha, unidade);
    const senhaHash = await bcrypt.hash(senha, 10);

    const usuarioId = await usuarioRepository.criarMorador(
        dados.nome,
        dados.email,
        senhaHash,
        'MORADOR',
        dados.unidade
    );

    return { usuarioId, email: dados.email };
}

// Repassa a exclusão do usuário para o repositório, mantendo a regra de negócio simples.
async function excluirUsuarioEPedido(usuarioId) {
    return usuarioRepository.excluirUsuarioEPedido(usuarioId);
}

// Gera um código numérico de 6 dígitos para validação de e-mail.
function gerarCodigoValidacao() {
    return crypto.randomInt(100000, 1000000).toString();
}

// Cria o código de validação, define a expiração e salva no usuário informado.
async function gerarESalvarTokenValidacao(usuarioId) {
    const codigo = gerarCodigoValidacao();

    const expiraEm = new Date();
    expiraEm.setMinutes(expiraEm.getMinutes() + 15);

    await usuarioRepository.salvarTokenValidacao(usuarioId, codigo, expiraEm);

    return codigo;
}

const MAX_TENTATIVAS_VALIDACAO = 5;

// Compara dois códigos em tempo constante para não vazar informação por timing.
function codigosIguais(esperado, informado) {
    const bufferEsperado = Buffer.from(esperado);
    const bufferInformado = Buffer.from(informado);

    if (bufferEsperado.length !== bufferInformado.length) {
        return false;
    }

    return crypto.timingSafeEqual(bufferEsperado, bufferInformado);
}

// Confirma o código informado pelo usuário e avança o status do cadastro.
async function validarEmail(email, codigoInformado) {
    const usuario = await usuarioRepository.buscarPorEmail(email);

    if (!usuario) {
        throw erroNegocio(404, 'USUARIO_NAO_ENCONTRADO', 'Usuário não encontrado');
    }

    if (usuario.status_cadastro !== 'AGUARDANDO_EMAIL') {
        throw erroNegocio(400, 'CADASTRO_JA_VALIDADO', 'Este cadastro já foi validado anteriormente');
    }

    const codigo = String(codigoInformado ?? '').trim();

    if (!usuario.token_validacao) {
        throw erroNegocio(400, 'CODIGO_INVALIDO', 'Código de validação incorreto');
    }

    if (usuario.tentativas_validacao >= MAX_TENTATIVAS_VALIDACAO) {
        throw erroNegocio(429, 'CODIGO_BLOQUEADO', 'Muitas tentativas incorretas. Solicite um novo código.');
    }

    if (!usuario.token_expira_em || new Date(usuario.token_expira_em) < new Date()) {
        throw erroNegocio(400, 'CODIGO_EXPIRADO', 'Código de validação expirado');
    }

    // Reserva a tentativa de forma atômica antes de comparar (evita corrida entre requisições).
    const reservada = await usuarioRepository.reservarTentativaValidacao(usuario.id, MAX_TENTATIVAS_VALIDACAO);

    if (!reservada) {
        throw erroNegocio(429, 'CODIGO_BLOQUEADO', 'Muitas tentativas incorretas. Solicite um novo código.');
    }

    if (!codigosIguais(usuario.token_validacao, codigo)) {
        if (usuario.tentativas_validacao + 1 >= MAX_TENTATIVAS_VALIDACAO) {
            throw erroNegocio(429, 'CODIGO_BLOQUEADO', 'Muitas tentativas incorretas. Solicite um novo código.');
        }

        throw erroNegocio(400, 'CODIGO_INVALIDO', 'Código de validação incorreto');
    }

    // confirmarEmail também zera as tentativas.
    const linhasAfetadas = await usuarioRepository.confirmarEmail(usuario.id);

    if (linhasAfetadas === 0) {
        throw erroNegocio(400, 'CADASTRO_JA_VALIDADO', 'Este cadastro já foi validado anteriormente');
    }

    return true;
}

// Gera novo código para cadastros aguardando e-mail. Devolve null se não houver o que reenviar,
// para o controller responder igual e não revelar quem está cadastrado.
async function reenviarCodigo(email) {
    const emailLimpo = typeof email === 'string' ? email.trim() : '';

    if (!REGEX_EMAIL.test(emailLimpo)) {
        throw erroNegocio(400, 'EMAIL_INVALIDO', 'Informe um e-mail válido.');
    }

    const usuario = await usuarioRepository.buscarPorEmail(emailLimpo);

    if (!usuario || usuario.status_cadastro !== 'AGUARDANDO_EMAIL') {
        return null;
    }

    // salvarTokenValidacao zera as tentativas junto com o novo código.
    const codigo = await gerarESalvarTokenValidacao(usuario.id);

    return { email: emailLimpo, codigo };
}

async function listarPendentes() {
  return await usuarioRepository.listarPendentes();
}

async function aprovarMorador(usuarioId) {
  const aprovado = await usuarioRepository.aprovarMorador(usuarioId);
  if (!aprovado) {
    const error = new Error("Usuário não encontrado ou não está pendente de aprovação");
    error.status = 404;
    throw error;
  }
  return { mensagem: "Morador aprovado com sucesso" };
}

async function rejeitarMorador(usuarioId) {
  const rejeitado = await usuarioRepository.rejeitarMorador(usuarioId);
  if (!rejeitado) {
    const error = new Error("Usuário não encontrado ou não está pendente de aprovação");
    error.status = 404;
    throw error;
  }
  return { mensagem: "Morador rejeitado com sucesso" };
}

module.exports = {
    criarUsuario,
    criarMorador,
    excluirUsuarioEPedido,
    gerarCodigoValidacao,
    gerarESalvarTokenValidacao,
    validarEmail,
    reenviarCodigo,
    listarPendentes,
  aprovarMorador,
  rejeitarMorador
};
