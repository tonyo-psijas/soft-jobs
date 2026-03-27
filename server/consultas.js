const pool = require("./database/db")
const format = require("pg-format")
const bcrypt = require('bcryptjs')

const getUsers = async ({ limit = 5, order_by = "id_ASC", page = 1 }) => {
    try {
        const [name, orden] = order_by.split("_")

        const currentPage = Number(page)

        const safeLimit = Number(limit)

        const offset = safeLimit * (currentPage - 1)

        const formattedQuery = format("SELECT * FROM usuarios ORDER BY %s %s LIMIT %s OFFSET %s", name, orden, safeLimit, offset)
        
        const result = await pool.query(formattedQuery)

        const resultTotal = await pool.query("SELECT * FROM usuarios")

        const hateoas = result.rows.map((user) => {
            return {
                id: user.id,
                user: user.email,
                rol: user.rol,
                lenguage: user.lenguage,
                url: `http://localhost:3000/softjobs/${user.id}`   
            }
        })

        return {
            total_users: resultTotal.rowCount,
            previous_page: currentPage > 1 ? `http://localhost:3000/softjobs?limit=${safeLimit}&order_by=${order_by}&page=${currentPage-1}` : null,
            next_page: offset + safeLimit < resultTotal.rowCount ? `http://localhost:3000/softjobs?limit=${safeLimit}&order_by=${order_by}&page=${currentPage+1}` : null,
            users: hateoas
        }

    } catch (error) {
        console.error("Error en la consulta GET /softjobs: " + error)
        throw new Error(error.message)
    }
};


const verificarCredenciales = async (email, password) => {

    const consulta = "SELECT * FROM usuarios WHERE email = $1";
    const values = [email];
    const result = await pool.query(consulta, values);

    if (!result.rowCount) throw {
        code: 404,
        message: "No se encontró ningún usuario con estas credenciales"
    };

    const user = result.rows[0]

    const passwordValida = await bcrypt.compare(password, user.password)

    if (!passwordValida) {
        throw {
            code: 401,
            message: "Contraseña incorrecta"
        };
    }

    return user
};


const register = async (email, password, rol, lenguage) => {
    try {
        let consulta = "INSERT INTO usuarios (email, password, rol, lenguage) VALUES ($1, $2, $3, $4) RETURNING *"

        let values = [email, password, rol, lenguage]
        const result = await pool.query(consulta, values)

        return result.rows[0]

    } catch (error) {
        console.error("Error al registrar: ", error)
        throw error
    }
};


module.exports = {
    getUsers,
    verificarCredenciales,
    register
}