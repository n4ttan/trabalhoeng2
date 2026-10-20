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

    if (req.usuario.perfil !== 'SINDICO' || req.usuario.perfil !== 'ADMIN'){
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

function verificarCondominioMorador(req, res, next) {
    
    const idCondominioRota = Number(req.params.idCondominio);

    if (req.usuario.perfil === 'MORADOR' && req.usuario.id_condominio === idCondominioRota) {
        
        return next(); 
    }

    return res.status(403).json({ 
        mensagem: 'Acesso negado. Você só pode acessar o seu próprio condomínio.' 
    });
}

function verificarCondominioSindico(req, res, next){

    const idCondominioRota = Number(req.params.idCondominio);

    if (req.usuario.perfil === 'ADMIN'){
        return next();
    }

    if (req.usuario.perfil === 'SINDICO' && req.usuario.id_condominio === idCondominioRota){
        return next();
    }

    return res.status(403).json({
        mensagem: 'Acesso negado. Somente o sindico desse condominio consegue realizar essa ação'
    })
}

function verificarAdmin(req, res, next) {
    if (req.usuario.perfil !== 'ADMIN') {
        return res.status(403).json({ 
            mensagem: 'Acesso negado: Requer privilégios de administrador geral.' 
        });
    }
    next();
}


module.exports = {
    verificarToken,
    verificarSindico,
    verificarMorador, 
    verificarAdmin, 
    verificarCondominioMorador, 
    verificarCondominioSindico
};
