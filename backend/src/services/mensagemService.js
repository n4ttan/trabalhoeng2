const mensagemRepository = require('../repositories/mensagemRepository');

function obterMensagem() {
    return mensagemRepository.buscarMensagem();
}

module.exports = {
    obterMensagem
};