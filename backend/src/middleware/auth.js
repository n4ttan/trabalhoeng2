const jwt = require('jsonwebtoken')

function verificarToken(req, res, next){

    const authHeader = req.headers.authorization;

    if (!authHeader){
        return res.status(401).json({mensagem: 'Token não fornecido'});
    }

    const partes = authHeader.split(' ');

    if (partes.length !== 2 || partes[0] !== 'Bearer') {
        return res.status(401).json({ mensagem: 'Formato de token inválido.' });
    }

    const token = partes[1];

    try{
        const payLoad = jwt.verify(token, process.env.JWT_SECRET);

        req.usuario = payLoad;

        next();
    }
    catch(error){
        return res.status(401).json({mensagem: 'Token inválido ou expirado'});
    }
}

function verificarSindico(req, res, next){

    if (!req.usuario.perfil === 'SINDICO' || !req.usuario.perfil === 'ADMIN'){
        return res.status(403).json({ mensagem: 'Acesso negado. Apenas síndicos podem fazer isso.' });
    }
    next();
}

function verificarMorador(req, res, next){

    if (req.usuario.perfil !== 'MORADOR'){
        return res.status(403).json({ mensagem: 'Acesso negado. Apenas moradores podem fazer isso.' });
    }
    next();
}

function verificarAdmin(req, res, next) {
    if (req.usuario.perfil !== 'ADMIN') {
        return res.status(403).json({ 
            mensagem: 'Acesso negado: Requer privilégios de administrador geral.' 
        });
    }
    next();
}


module.exports = {verificarToken, verificarSindico, verificarMorador, verificarAdmin};
