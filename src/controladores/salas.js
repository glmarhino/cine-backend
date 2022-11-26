const express = require('express')
const router = express.Router()
const Sala = require('../modelos/Sala')
const Horario = require('../modelos/Horario')
const utiles = require('../utiles')
const { body, validationResult } = require('express-validator')

router.get('/', async (req, res) => {
  let datos = []

  if (Boolean((req.query.combo || '').replace(/\s*(false|null|undefined|0)\s*/i, ''))) {
    datos = await Sala.find({}).select({
      _id: 1,
      nombre: 1
    }).sort({
      nombre: 1
    })
  } else {
    let buscar = {}
    if (req.query.buscar != null && req.query.buscar != '') {
      buscar = {
        nombre: {
          $regex: req.query.buscar,
          $options: 'i'
        }
      }
    }
    datos = await Sala.paginate(buscar, {
      sort: {
        nombre: 1
      },
      page: req.query.page || 1,
      limit: req.query.limit || 10
    })
  }
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

  const sala = await Sala.findById(req.params.id)
  if (!sala) {
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
        sala: sala
      }
    })
  }
})

router.patch(
  '/:id',
  body('nombre').trim().isLength({ min: 3 }).withMessage('Mínimo 3 caracteres'),
  async (req, res) => {
  if (!utiles.idValido(req.params.id)) {
    return res.status(404).json({
      error: true,
      mensaje: 'Registro inexistente',
      datos: []
    })
  }
  let sala = await Sala.exists({
    _id: { $ne: req.params.id },
    nombre: req.body.nombre
  })
  if (sala) {
    return res.status(422).json({
      error: true,
      mensaje: 'Datos inválidos',
      datos: [
        {
          value: null,
          msg: 'No se permiten duplicados',
          param: 'nombre',
          location: 'body'
        }
      ]
    })
  }

  sala = await Sala.findByIdAndUpdate(req.params.id, req.body, {
    new: true
  })
  if (!sala) {
    return res.status(404).json({
      error: true,
      mensaje: 'Registro inexistente',
      datos: []
    })
  } else {
    res.status(200).json({
      error: false,
      mensaje: 'Registro actualizado',
      datos: {
        sala: sala
      }
    })
  }
})

router.post(
  '/',
  body('nombre').trim().isLength({ min: 3 }).withMessage('Mínimo 3 caracteres'),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(422).json({
        datos: errors.array()
      })
    }
    try {
      const sala = await Sala.create(req.body)
      return res.status(200).json({
        error: false,
        mensaje: 'Registro almacenado',
        datos: {
          sala: sala
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

  const sala = await Sala.findOneAndDelete({
    _id: req.params.id
  })
  if (!sala) {
    return res.status(404).json({
      error: true,
      mensaje: 'Registro inexistente',
      datos: []
    })
  } else {
    const horarios = await Horario.find({
      pelicula: pelicula._id
    })
    horarios.forEach(async (horario) => {
      await Butaca.deleteMany({
        horario: horario._id
      })
    })
    await Horario.deleteMany({
      sala: sala._id
    })
    res.status(200).json({
      error: false,
      mensaje: 'Registro eliminado',
      datos: {
        sala: sala
      }
    })
  }
})

module.exports = router
