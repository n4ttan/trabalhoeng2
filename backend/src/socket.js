//esse arquivo é responsável por gerenciar a instância do Socket.IO no backend
//permitindo que outros módulos acessem a mesma instância para enviar eventos em tempo real.
let io = null;

function setIO(instancia) {
    io = instancia;
}

function getIO() {
    return io;
}

module.exports = {
    setIO,
    getIO
};

//cada usuario conectado via WebSocket terá uma sala dedicada, permitindo que notificações 
// sejam enviadas diretamente para o usuário específico