const express = require('express')
const router = express.Router()
const Usuario = require('../modelos/Usuario')
const utiles = require('../utiles')
const { body, validationResult } = require('express-validator')

router.get('/', async (req, res) => {
  let buscar = {
    _id: {
      $ne: req.usuario._id
    }
  }
  if (req.query.buscar != null && req.query.buscar != '') {
    buscar = { ...buscar, $or: [
      {
        nombre: {
          $regex: req.query.buscar,
          $options: 'i'
        }
      }, {
        apellido: {
          $regex: req.query.buscar,
          $options: 'i'
        }
      }, {
        usuario: {
          $regex: req.query.buscar,
          $options: 'i'
        }
      }
    ]}
  }
  if (req.usuario.rol != 'Administrador') {
    buscar = {
      ...buscar,
      rol: {
        $ne: 'Administrador'
      }
    }
  }
  const datos = await Usuario.paginate(buscar, {
    sort: {
      nombre: 1
    },
    page: req.query.page || 1,
    limit: req.query.limit || 10
  })
  return res.status(200).json({
    error: false,
    mensaje: 'Lista de registros',
    datos: datos
  })
})

router.get('/:id', async (req, res) => {
  if (!utiles.idValido(req.params.id)) {
    return res.status(404).json({
      error: true,
      mensaje: 'Registro inexistente',
      datos: []
    })
  }

  const usuario = await Usuario.findById(req.params.id)
  if (!usuario) {
    return res.status(404).json({
      error: true,
      mensaje: 'Registro inexistente',
      datos: []
    })
  } else {
    res.status(200).json({
      error: false,
      mensaje: 'Registro encontrado',
      datos: {
        usuario: usuario
      }
    })
  }
})

router.patch(
  '/:id',
  body('nombre').trim().isLength({ min: 3 }).withMessage('Mínimo 3 caracteres'),
  body('apellido').trim().isLength({ min: 3 }).withMessage('Mínimo 3 caracteres'),
  body('usuario').trim().isLength({ min: 3 }).withMessage('Mínimo 3 caracteres'),
  body('clave').trim().isLength({ min: 3 }).withMessage('Mínimo 3 caracteres'),
  body('rol').trim().isIn(['Administrador', 'Gerente']),
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

    let usuario = await Usuario.exists({
      _id: { $ne: req.params.id },
      nombre: req.body.nombre,
      apellido: req.body.apellido,
    })
    if (usuario) {
      return res.status(422).json({
        error: true,
        mensaje: 'Datos inválidos',
        datos: [
          {
            value: null,
            msg: 'No se permiten duplicados',
            param: 'nombre',
            location: 'body'
          }, {
            value: null,
            msg: 'No se permiten duplicados',
            param: 'apellido',
            location: 'body'
          }
        ]
      })
    }

    usuario = await Usuario.exists({
      _id: { $ne: req.params.id },
      usuario: req.body.usuario
    })
    if (usuario) {
      return res.status(422).json({
        error: true,
        mensaje: 'Datos inválidos',
        datos: [{
          value: null,
          msg: 'No se permiten duplicados',
          param: 'usuario',
          location: 'body'
        }]
      })
    }

    usuario = await Usuario.findByIdAndUpdate(req.params.id, req.body, {
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
  }
)

router.post(
  '/',
  body('nombre').trim().isLength({ min: 3 }).withMessage('Mínimo 3 caracteres'),
  body('apellido').trim().isLength({ min: 3 }).withMessage('Mínimo 3 caracteres'),
  body('email').isEmail().withMessage('Formato de email inválido').optional({ nullable: true }),
  body('telefono').isInt({ min: 60000000, max: 79999999 }).withMessage('El teléfono debe estar en el rango de 60000000 a 79999999').optional({ nullable: true }),
  body('direccion').trim().optional({ nullable: true }),
  body('usuario').trim().isLength({ min: 3 }).withMessage('Mínimo 3 caracteres'),
  body('clave').trim().isLength({ min: 3 }).withMessage('Mínimo 3 caracteres'),
  body('rol').trim().isIn(['Administrador', 'Gerente']),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(422).json({
        datos: errors.array()
      })
    }
    try {
      let usuario = await Usuario.exists({
        nombre: req.body.nombre,
        apellido: req.body.apellido,
      })
      if (usuario) {
        return res.status(422).json({
          error: true,
          mensaje: 'Datos inválidos',
          datos: [
            {
              value: null,
              msg: 'No se permiten duplicados',
              param: 'nombre',
              location: 'body'
            }, {
              value: null,
              msg: 'No se permiten duplicados',
              param: 'apellido',
              location: 'body'
            }
          ]
        })
      }

      usuario = await Usuario.create(req.body)
      usuario.clave = undefined
      return res.status(200).json({
        error: false,
        mensaje: 'Registro almacenado',
        datos: {
          usuario: usuario
        }
      })
    } catch(error) {
      return utiles.errorBD(error, res)
    }
  }
)

router.delete('/:id', async (req, res) => {
  if (!utiles.idValido(req.params.id)) {
    return res.status(404).json({
      error: true,
      mensaje: 'Registro inexistente',
      datos: []
    })
  }

  const usuario = await Usuario.findOneAndDelete({
    _id: req.params.id
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
      mensaje: 'Registro eliminado',
      datos: {
        usuario: usuario
      }
    })
  }
})

module.exports = router
