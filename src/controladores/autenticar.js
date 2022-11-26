const jwt = require('jsonwebtoken')
const express = require('express')
const router = express.Router()
const Usuario = require('../modelos/Usuario')
const utiles = require('../utiles')
const { body, validationResult } = require('express-validator')

router.get('/', async (req, res, next) => {
  const usuario = await Usuario.findById(req.usuario._id)
  return res.status(200).json({
    error: false,
    mensaje: 'Usuario actual',
    datos: {
      usuario: usuario
    }
  })
})

router.patch(
  '/:id',
  body('clave').isLength({ min: 5 }).withMessage('Mínimo 5 caracteres'),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(422).json({
        datos: errors.array()
      })
    }
    if (!utiles.idValido(req.params.id)) {
      return res.status(404).json({
        error: true,
        mensaje: 'Registro inexistente',
        datos: []
      })
    }

    if (req.params.id == req.usuario._id) {
      const usuario = await Usuario.findOneAndUpdate({
        _id: req.params.id
      }, {
        clave: req.body.clave
      }, {
        new: true
      })
      if (!usuario) {
        return res.status(404).json({
          error: true,
          mensaje: 'Registro inexistente',
          datos: []
        })
      } else {
        usuario.clave = undefined
        res.status(200).json({
          error: false,
          mensaje: 'Registro actualizado',
          datos: {
            usuario: usuario
          }
        })
      }
    } else {
      return res.status(401).json({
        error: true,
        mensaje: 'Acceso denegado',
        datos: []
      })
    }
  }
)

router.post(
  '/',
  body('usuario').trim().isLength({ min: 3 }).withMessage('Mínimo 3 caracteres'),
  body('clave').isLength({ min: 5 }).withMessage('Mínimo 5 caracteres'),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(422).json({
        datos: errors.array()
      })
    }
    Usuario.findOne({
      usuario: req.body.usuario
    }).select('+clave').exec(function(error, usuario) {
      if (error) {
        return res.status(500).json({
          error: true,
          mensaje: 'Error de conexión con la base de datos',
          datos: []
        })
      } else if (!usuario) {
        return res.status(404).json({
          error: true,
          mensaje: 'Credenciales inválidas',
          datos: [
            {
              value: null,
              msg: 'Usuario inexistente',
              param: 'usuario',
              location: 'body'
            }
          ]
        })
      } else {
        usuario.verificarClave(req.body.clave, function(errorVerificacion, verificado) {
          if (errorVerificacion) {
            return res.status(500).json({
              error: true,
              mensaje: 'Error de conexión con la base de datos',
              datos: []
            })
          } else if (!verificado) {
            return res.status(403).json({
              error: true,
              mensaje: 'Credenciales inválidas',
              datos: [
                {
                  value: null,
                  msg: 'Contraseña incorrecta',
                  param: 'clave',
                  location: 'body'
                }
              ]
            })
          } else {
            usuario.clave = undefined
            return res.status(200).json({
              error: false,
              mensaje: 'Ingreso correcto',
              datos: {
                usuario: usuario.usuario,
                rol: usuario.rol,
                token: jwt.sign({
                  _id: usuario._id,
                  usuario: usuario.usuario,
                  rol: usuario.rol
                }, process.env.TOKEN_LLAVE, {
                  expiresIn: process.env.TOKEN_EXPIRACION
                })
              }
            })
          }
        })
      }
    })
  }
)

module.exports = router