const express = require('express');
const cors = require('cors');
const app = express();
const pool = require('./database/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

require('dotenv').config();

const { getUsers, verificarCredenciales ,register } = require('./consultas')

const { authMiddleware } = require('./middlewares/auth')

app.use(express.json());
app.use(cors());

const SECRET = process.env.JWT_SECRET

const PORT = 3000;

const reporte = async (req, res, next) => {
    console.log(req.method + " " + req.url + " En la fecha " + new Date().toLocaleString());
    next()
}

app.use(reporte)

app.listen(PORT, () => {
    console.log("Servidor encendido en el puerto " + PORT)
})

//REGISTRAR USUARIO
app.post('/softjobs/register', async (req, res) => {
    try {
        const { email, password, rol, lenguage } = req.body
        const hashedPassword = await bcrypt.hash(password, 10)

        let user = await register(email, hashedPassword, rol, lenguage)

        const token = jwt.sign({
            id: user.id,
            email: user.email,
            rol: user.rol,
            lenguage: user.lenguage
        }, SECRET)

        res.json({
            message: "Usuario creado con éxito",
            user: user,
            token
        })

    } catch (error) {
        res.status(500).json({
            code: error.code,
            message: error.message
        })
    }
});


//LOGIN USUARIO
app.post("/softjobs/login", async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await verificarCredenciales(email, password)
        console.log("Ese usuario existe")
        const token = jwt.sign({
            id: user.id,
            email: user.email,
            rol: user.rol,
            lenguage: user.lenguage
        }, SECRET)

        res.json({
            message: "Sesión iniciada con éxito",
            token
        })

    } catch (error) {
        console.log("Error al hacer login: ", error)
        res.status(401).send(error)
    }
});


//GET USUARIOS
app.get('/softjobs/users', authMiddleware, async (req, res) => {
    try {
        let queryLimit = req.query
        const result = await getUsers(queryLimit)
        res.json(result)
    } catch (error) {
        console.error("Error en la consulta GET /softjobs: " + error)
        res.status(500).json({
            error: error.code,
            message: error.message
        })
    }
    
});


//GET USUARIO ESPECÍFICO
app.get("/softjobs/users/:id", authMiddleware, async (req, res) => {
    const { id } = req.params
    const result = await pool.query("SELECT * FROM usuarios WHERE id = $1", [id])
    res.json(result.rows)
});


//BORRAR USUARIO
app.delete("/softjobs/users/:id", authMiddleware, async (req, res) => {

    try {
        const { id } = req.params

        const result = await pool.query("DELETE FROM usuarios WHERE id = $1", [id])
    
        res.send("Usuario eliminado con éxito por el usuario: " + req.user.email)

    } catch (error) {
        console.error("Error en la consulta DELETE /items: " + error)
        res.status(500).json({
            error: error.code,
            message: error.message
        })
    }
    
})