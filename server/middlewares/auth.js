const jwt = require('jsonwebtoken')
require('dotenv').config()

const SECRET = process.env.JWT_SECRET

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
        return res.status(401).json({
            message: "No tienes sesión activa"
        })
    }

    try {
        const decoded = jwt.verify(token, SECRET)
        req.user = decoded
        next()
        
    } catch (error) {
        return res.sendStatus(403).json({
            message: "Token inválido"
        })
    }
}



module.exports = {authMiddleware}