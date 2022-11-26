const mongoose = require('mongoose')
const Usuario = require('./modelos/Usuario')

const primerUsuario = async function(callback) {
  try {
    const usuarios = await Usuario.find({})
    if (usuarios.length == 0) {
      await Usuario.create({
        nombre: 'Super',
        apellido: 'Admin',
        telefono: null,
        email: null,
        direccion: null,
        usuario: 'admin',
        clave: 'admin',
        rol: 'Administrador'
      })
      console.log('Creado usuario admin')
    }
  } finally {
    callback()
  }
}

const idValido = function(id) {
  return mongoose.Types.ObjectId.isValid(id)
}

const errorBD = function(error, res) {
  if (error.code == 11000) {
    let errors = [
      {
        value: error.keyValue[Object.keys(error.keyValue)[0]],
        msg: 'No se permiten duplicados',
        param: Object.keys(error.keyValue)[0],
        location: 'body'
      }
    ]
    return res.status(422).json({
      error: true,
      mensaje: 'Registro duplicado',
      datos: errors
    })
  } else if (error.name === "ValidationError") {
    let errors = []
    Object.keys(error.errors).forEach((key) => {
      errors.push({
        value: null,
        msg: 'Campo requerido',
        param: key,
        location: 'body'
      })
    })
    return res.status(422).json({
      error: true,
      mensaje: 'Registro inválido',
      datos: errors
    })
  } else {
    console.log(error)
    return res.status(500).json({
      error: true,
      mensaje: 'Error en el servidor',
      datos: []
    })
  }
}

exports.primerUsuario = primerUsuario
exports.idValido = idValido
exports.errorBD = errorBD