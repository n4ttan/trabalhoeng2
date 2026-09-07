const connection = require('./database');

function buscarMensagem() {
    return new Promise((resolve, reject) => {
        connection.query(
            'SELECT * FROM mensagens LIMIT 1',
            (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(results[0]);
            }
        );
    });
}

module.exports = {
    buscarMensagem
};