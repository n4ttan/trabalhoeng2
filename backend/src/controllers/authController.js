const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const connection = require('../repositories/database');

async function login(req, res){

    const {email, senha} = req.body
    
    try{

        const [rows] = await connection.promise().query(
            'SELECT * FROM usuarios WHERE email = ?', 
            [email]
        );

        const usuario = rows[0];
        
        if (!usuario) {
            return res.status(401).json({ mensagem: 'E-mail incorreto' });
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senha);

        if (!senhaValida) {
            return res.status(401).json({ mensagem: 'Senha incorreta' });
        }

        const token = jwt.sign(
            {
                id: usuario.id,
                perfil: usuario.perfil
            },
            process.env.JWT_SECRET,
            {expiresIn: '1d'}
        );

        return res.json({
            mensagem: 'Login realizado com sucesso!',
            token: token
        });
    }
    catch(error){
        return res.status(500).json({ mensagem: 'Erro interno no servidor' });
    }
}

module.exports = { login };