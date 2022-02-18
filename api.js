const express = require('express')
const aplicacion = express()
const mysql = require('mysql')
const bodyParser = require('body-parser')

aplicacion.use(bodyParser.json())
aplicacion.use(bodyParser.urlencoded({ extended: true }))

aplicacion.listen(8080, () => {
  console.log("Servidor iniciado")
})

var pool = mysql.createPool({
  connectionLimit: 20,
  host: 'localhost',
  user: 'root',
  password: '123456789',
  database: 'blog_viajes'
})

/// DESARROLLO API ///

aplicacion.get('/api/v1/publicaciones', (peticion, respuesta) => {
    pool.getConnection((err, connection) => {
        if(err){throw err}
        //console.log( peticion.query.busqueda )
        let consulta
        if(peticion.query.busqueda.length > 0){
            consulta = `SELECT * FROM publicaciones WHERE titulo LIKE '%${peticion.query.busqueda}%' OR resumen LIKE '%${peticion.query.busqueda}%' OR contenido LIKE '%${peticion.query.busqueda}%'`  
        } else {
            consulta = `SELECT * FROM publicaciones`
        }
        //console.log(consulta)
        connection.query(consulta, (error, filas, campos) => {
            if(error){throw err}
            if(filas.length != 0){
                respuesta.status(200)
                respuesta.json({ data: filas })
            } else {
                respuesta.status(404)
                respuesta.json({ errors: 'No hay publicaciones disponibles'})
            }
        })
        connection.release()
    })
})

aplicacion.get('/api/v1/publicaciones/:id', (peticion, respuesta) => {
    pool.getConnection((err, connection) => {
        if(err){throw err}
        const consulta = `SELECT * FROM publicaciones WHERE id=${connection.escape(peticion.params.id)}`
        connection.query(consulta, (error, filas, campos) => {
            if(filas.length == 0){
                respuesta.status(404)
                respuesta.json({ errors: ["Publicacion no encontrada"] })
            } else {
                respuesta.status(200)
                respuesta.json({ data: filas[0] })
            }
        })
        connection.release()
    })
})

aplicacion.get('/api/v1/autores', (peticion, respuesta) => {
    pool.getConnection((err, connection) => {
        if(err){throw err}
        const consulta = `SELECT * FROM autores`
        connection.query(consulta, (error, filas, campos) => {
            if(filas.length != 0){
                respuesta.status(200)
                respuesta.json({ data: filas })
            } else {
                respuesta.status(404)
                respuesta.json({ errors: 'No hay autores disponibles'})
            }
        })
        connection.release()
    })
})

aplicacion.get('/api/v1/autores/:id', (peticion, respuesta) => {
    pool.getConnection((err, connection) => {
        if(err){throw err}
        const consulta = `SELECT * FROM autores WHERE id=${connection.escape(peticion.params.id)}`
        connection.query(consulta, (error, filas, campos) => {
            if(filas.length == 0){
                respuesta.status(404)
                respuesta.json({ errors: ["El autor solicitado no existe"] })
            } else {
                respuesta.status(200)
                respuesta.json({ data: filas[0] })
            }
        })
        connection.release()
    })
})

aplicacion.post('/api/v1/autores', (peticion, respuesta) => {
    pool.getConnection((err, connection) => {
        if(err){throw err}
        //console.log(peticion.body)
        errores = []

        if (!peticion.body.pseudonimo || peticion.body.pseudonimo == "") {
            errores.push("Pseudonimo inválido")
        }
        if (!peticion.body.email || peticion.body.email == "") {
            errores.push("Mail inválido")
        }
        if (!peticion.body.contrasena || peticion.body.contrasena == "") {
            errores.push("Contraseña inválida")
        }

        if (errores.length > 0) {
            respuesta.status(400)
            respuesta.json({ errors: errores })
        } else {
            const consulta_temporal_pseudonimo = `SELECT * FROM autores WHERE pseudonimo LIKE '${peticion.body.pseudonimo}'`
            connection.query(consulta_temporal_pseudonimo, (error, filas, campos) => {
                if(error){throw error}
                if(filas.length > 0){
                    respuesta.status(400)
                    respuesta.json({ errors: ["El pseudonimo ya se encuentra en uso"] })
                } else {
                    const consulta_temporal_mail = `SELECT * FROM autores WHERE email LIKE '${peticion.body.email}'`
                    connection.query(consulta_temporal_mail, (error, filas, campos) => {
                        if(error){throw error}
                        if(filas.length > 0){
                            respuesta.status(400)
                            respuesta.json({ errors: ["El mail ya se encuentra en uso"] })
                        } else {
                            const query = `INSERT INTO autores (pseudonimo, email, contrasena) VALUES (
                                ${connection.escape(peticion.body.pseudonimo)},
                                ${connection.escape(peticion.body.email)},
                                ${connection.escape(peticion.body.contrasena)}
                            )`

                            connection.query(query, (error, filas, campos) => {
                                if(error){throw error}
                                const nuevoId = filas.insertId
                                const queryConsulta = `SELECT * FROM autores WHERE id=${connection.escape(nuevoId)}`
                                connection.query(queryConsulta, (error, filas, campos) => {
                                    respuesta.status(201)
                                    respuesta.json({ data: filas[0] })
                                })
                            })  
                        }
                    })
                }
            })
        }
        connection.release()
    })
})

aplicacion.post('/api/v1/publicaciones', (peticion, respuesta) => {
    pool.getConnection((err, connection) => {
        if(err){throw err}
        errores = []
        //console.log(peticion.query)
        if (!peticion.query.email || peticion.query.email == "") {
            errores.push("Mail inválido")
        }
        if (!peticion.query.contrasena || peticion.query.contrasena == "") {
            errores.push("Contraseña inválida")
        }

        if (errores.length > 0) {
            respuesta.status(400)
            respuesta.json({ errors: errores })
        } else {
            const consulta_temporal_mail = `SELECT id, contrasena FROM autores WHERE email LIKE '${peticion.query.email}'`
            connection.query(consulta_temporal_mail, (error, filas, campos) => {
                if(error){throw error}
                if(filas.length > 0){
                    //console.log(filas[0].contrasena)
                    if(filas[0].contrasena != peticion.query.contrasena){
                        respuesta.status(400)
                        respuesta.json({ errors: ["El mail o la contraseña no coinciden"] })
                    } else {
                        const id_autor = filas[0].id
                        const query = `INSERT INTO publicaciones (titulo, resumen, contenido, autor_id) VALUES (
                            ${connection.escape(peticion.body.titulo)},
                            ${connection.escape(peticion.body.resumen)},
                            ${connection.escape(peticion.body.contenido)},
                            ${id_autor}
                        )`

                        connection.query(query, (error, filas, campos) => {
                            if(error){throw error}
                            const nuevoId = filas.insertId
                            const queryConsulta = `SELECT * FROM publicaciones WHERE id=${connection.escape(nuevoId)}`
                            connection.query(queryConsulta, (error, filas, campos) => {
                                respuesta.status(201)
                                respuesta.json({ data: filas[0] })
                            })
                        })  
                    }
                } else {
                    respuesta.status(400)
                    respuesta.json({ errors: ["El mail no pertenece a ningun usuario registrado"] })
                }
            })
        }
        connection.release()
    })
})

aplicacion.delete('/api/v1/publicaciones/:id', (peticion, respuesta) => {
    pool.getConnection((err, connection) => {
        if(err){throw err}
        errores = []
        //console.log(peticion)
        if (!peticion.query.email || peticion.query.email == "") {
            errores.push("Mail inválido")
        }
        if (!peticion.query.contrasena || peticion.query.contrasena == "") {
            errores.push("Contraseña inválida")
        }

        if (errores.length > 0) {
            respuesta.status(400)
            respuesta.json({ errors: errores })
        } else {
            const consulta_temporal_mail = `SELECT contrasena FROM autores WHERE email LIKE '${peticion.query.email}'`
            connection.query(consulta_temporal_mail, (error, filas, campos) => {
                if(error){throw error}
                if(filas.length > 0){
                    //console.log(filas[0].contrasena)
                    if(filas[0].contrasena != peticion.query.contrasena){
                        respuesta.status(400)
                        respuesta.json({ errors: ["El mail o la contraseña no coinciden"] })
                    } else {
                        const query_check = `SELECT * FROM publicaciones WHERE id = ${peticion.params.id}`
                        connection.query(query_check, (error, filas, campos) => {
                            if(error){throw error}
                            if(filas.length > 0){
                                const query = `DELETE FROM publicaciones WHERE id = ${peticion.params.id}`
                                connection.query(query, (error, filas, campos) => {
                                    if(error){throw error}
                                    respuesta.status(204)
                                    respuesta.json()
                                })
                            } else {
                                respuesta.status(404)
                                respuesta.json({ errors:["No existe una publicacion asociada a ese id"] })
                            }
                        })
                        
                    }
                }
            })   
        }
        connection.release()
    })
})

//////////////////////
