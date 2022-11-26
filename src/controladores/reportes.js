const express = require('express')
const router = express.Router()
const Pelicula = require('../modelos/Pelicula')
const Horario = require('../modelos/Horario')

router.get('/', async (req, res) => {
  let buscar = {}
  if (req.query.buscar != null && req.query.buscar != '') {
    buscar = {
      nombre: {
        $regex: req.query.buscar,
        $options: 'i'
      }
    }
  }
  const datos = await Pelicula.paginate(buscar, {
    select: {
      nombre: 1,
      horarios: 1
    },
    sort: {
      createdAt: -1
    },
    page: req.query.page || 1,
    limit: req.query.limit || 3
  })

  let peliculas = []
  for await (const pagPelicula of datos.docs) {
    let horarios = await Horario.find({
      pelicula: pagPelicula._id,
      horaFin: {
        $lte: new Date()
      }
    }).select('precio butacasTotal butacasVendidas')
    peliculas.push({
      _id: pagPelicula._id,
      nombre: pagPelicula.nombre,
      horariosFuturos: pagPelicula.horarios.length - horarios.length,
      horariosPasados: horarios.length,
      totalEsperado: horarios.reduce((suma, o) => {
        return suma + (o.butacasTotal * o.precio)
      }, 0),
      totalRecaudado: horarios.reduce((suma, o) => {
        return suma + (o.butacasVendidas * o.precio)
      }, 0),
      totalButacas: horarios.reduce((suma, o) => {
        return suma + o.butacasTotal
      }, 0),
      totalButacasVendidas: horarios.reduce((suma, o) => {
        return suma + o.butacasVendidas
      }, 0)
    })
  }

  datos.docs = peliculas
  return res.status(200).json({
    error: false,
    mensaje: 'Lista de registros',
    datos: datos
  })
})

module.exports = router
