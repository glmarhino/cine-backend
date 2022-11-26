const express = require('express')
const router = express.Router()
const Pelicula = require('../modelos/Pelicula')
const Horario = require('../modelos/Horario')
const Sala = require('../modelos/Sala')
const Butaca = require('../modelos/Butaca')
const utiles = require('../utiles')
const moment = require('moment')
const { body, validationResult } = require('express-validator')

router.get('/', async (req, res) => {
  const datos = await Pelicula.find({
    horarios: {
      $exists: true, $ne: []
    }
  }).sort({
    createdAt: -1
  })
  return res.status(200).json({
    error: false,
    mensaje: 'Lista de registros',
    datos: {
      peliculas: datos
    }
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

  const pelicula = await Pelicula.findById(req.params.id)
  let horarios = []
  if (!pelicula) {
    return res.status(404).json({
      error: true,
      mensaje: 'Registro inexistente',
      datos: []
    })
  } else {
    if (req.query.hasOwnProperty('dias')) {
      horarios = await Horario.find({
        pelicula: req.params.id,
        $expr: {
          $gt: [
            '$butacasTotal',
            '$butacasVendidas'
          ]
        },
        horaInicio: {
          $gte: moment().toDate(),
          $lt: moment().endOf('day').add((req.query.dias), 'days').toDate()
        }
      }).populate('sala', 'nombre').sort({
        horaInicio: 1,
        sala: 1
      })
    } else {
      if (moment(req.query.buscar, 'DD/MM/YYYY', true).isValid()) {
        let horaInicio = moment(req.query.buscar, 'DD/MM/YYYY', true).startOf('day')
        let horaFin = horaInicio.clone().endOf('day')
        horarios = await Horario.paginate({
          pelicula: req.params.id,
          $or: [
            {
              horaInicio: { $gte: horaInicio, $lte: horaFin }
            }, {
              horaFin: { $gte: horaInicio, $lte: horaFin }
            }
          ],
        }, {
          sort: {
            horaInicio: 1,
            sala: 1
          },
          populate: 'sala',
          page: req.query.page || 1,
          limit: req.query.limit || 10
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
        let salas = await Sala.find(buscar).select({
          _id: 1
        }).distinct('_id')
        horarios = await Horario.paginate({
          pelicula: req.params.id,
          sala: {
            $in: salas
          },
        }, {
          sort: {
            horaInicio: 1,
            sala: 1
          },
          populate: 'sala',
          page: req.query.page || 1,
          limit: req.query.limit || 10
        })
      }
    }
    return res.status(200).json({
      error: false,
      mensaje: 'Lista de registros',
      datos: {
        pelicula: pelicula,
        horarios: horarios
      }
    })
  }
})

router.post(
  '/',
  body('precio').isFloat({ min: 0, max: 200 }).withMessage('El mínimo valor permitido es 1'),
  body('salas').isArray({ min: 1 }).withMessage('Debe seleccionar al menos una sala'),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(422).json({
        datos: errors.array()
      })
    }

    if (req.body.fechaInicio > req.body.fechaFin) {
      return res.status(404).json({
        error: true,
        mensaje: 'La fecha de clausura no debe ser menor a la fecha de estreno',
        datos: [{
          value: null,
          msg: '',
          param: 'fechaFin',
          location: 'body'
        }]
      })
    }

    if (!utiles.idValido(req.body.pelicula)) {
      return res.status(404).json({
        error: true,
        mensaje: 'Registro inexistente',
        datos: []
      })
    }

    const pelicula = await Pelicula.findById(req.body.pelicula)
    if (!pelicula) {
      return res.status(404).json({
        error: true,
        mensaje: 'Registro inexistente',
        datos: []
      })
    } else {
      let fechaInicio = moment(req.body.fechaInicio).startOf('day')
      if (moment().startOf('day').isAfter(fechaInicio)) {
        return res.status(422).json({
          error: true,
          mensaje: 'La fecha de inico debe ser mayor o igual a la fecha actual',
          datos: [{
            value: null,
            msg: 'La fecha de inico debe ser mayor o igual a la fecha actual',
            param: 'fechaInicio',
            location: 'body'
          }]
        })
      }

      let fechaFin = moment(req.body.fechaFin).startOf('day')
      if (moment().startOf('day').isAfter(fechaFin)) {
        return res.status(422).json({
          error: true,
          mensaje: 'La fecha mínima de clausura es la fecha actual',
          datos: [{
            value: null,
            msg: '',
            param: 'fechaFin',
            location: 'body'
          }]
        })
      }

      let hora = moment(req.body.hora)
      if (moment().isAfter(hora)) {
        return res.status(422).json({
          error: true,
          mensaje: 'La hora mínima debe ser mayor a la actual',
          datos: [{
            value: null,
            msg: '',
            param: 'hora',
            location: 'body'
          }]
        })
      }

      const dias = [...Array(fechaFin.diff(fechaInicio, 'days') + 1).keys()].map(i => fechaInicio.clone().add(i, 'd'))
      let errores = []
      for await (const fecha of dias) {
        let horaInicio = fecha.clone().set({
          hour: hora.hours(),
          minute: hora.minute(),
          second : 0,
          millisecond : 0
        })
        let horaFin = horaInicio.clone().add(pelicula.horas, 'hours').add(pelicula.minutos, 'minutes')
        for await (const idSala of req.body.salas) {
          const sala = await Sala.findById(idSala)
          if (sala) {
            try {
              let horario = await Horario.findOne({
                $or: [
                  {
                    horaInicio: { $gte: horaInicio, $lte: horaFin }
                  }, {
                    horaFin: { $gte: horaInicio, $lte: horaFin }
                  }
                ],
                pelicula: pelicula._id,
                sala: sala._id
              })
              if (horario == null) {
                horario = await Horario.create({
                  precio: req.body.precio,
                  horaInicio: horaInicio,
                  horaFin: horaFin,
                  butacasTotal: sala.filas * sala.columnas,
                  butacasVendidas: 0,
                  pelicula: pelicula._id,
                  sala: sala._id
                })
                await Pelicula.findByIdAndUpdate(req.body.pelicula, {
                  $push: {
                    horarios: horario
                  }
                })
                await Sala.findByIdAndUpdate(idSala, {
                  $push: {
                    horarios: horario
                  }
                })
              } else {
                errores.push(`${sala.nombre} ocupada en el horario ${moment(horaInicio).format('DD/MM/YY HH:mm')} - ${moment(horaFin).format('DD/MM/YY HH:mm')}`)
              }
            } catch(error) {
              console.log(error)
            }
          }
        }
      }
      return res.status(200).json({
        error: false,
        mensaje: 'Registros almacenados',
        datos: errores
      })
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

  const horario = await Horario.findOneAndDelete({
    _id: req.params.id
  })

  if (!horario) {
    return res.status(404).json({
      error: true,
      mensaje: 'Registro inexistente',
      datos: []
    })
  } else {
    await Butaca.deleteMany({
      horario: horario._id
    })
    await Pelicula.findByIdAndUpdate(horario.pelicula._id, {
      $pull: {
        horarios: horario._id
      }
    })
    await Sala.findByIdAndUpdate(horario.sala._id, {
      $pull: {
        horarios: horario._id
      }
    })
    res.status(200).json({
      error: false,
      mensaje: 'Registro eliminado',
      datos: {
        horario: horario
      }
    })
  }
})

module.exports = router
