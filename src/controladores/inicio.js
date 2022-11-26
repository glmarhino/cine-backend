const express = require('express')
const router = express.Router()
const Pelicula = require('../modelos/Pelicula')
const Sala = require('../modelos/Sala')
const Usuario = require('../modelos/Usuario')

router.get('/', async (req, res) => {
  return res.status(200).json({
    error: false,
    mensaje: 'Lista de registros',
    datos: {
      medidas: [
        {
          titulo: 'Peliculas',
          total: await Pelicula.count(),
          link: 'peliculas',
          icono: 'LocalMoviesIcon',
          colorFondo: '#795548',
          colorTexto: '#fafafa'
        }, {
          titulo: 'Salas',
          total: await Sala.count(),
          link: 'salas',
          icono: 'MeetingRoomIcon',
          colorFondo: '#009688',
          colorTexto: '#e0f2f1'
        }, {
          titulo: 'Usuarios',
          total: await Usuario.count(),
          link: 'usuarios',
          icono: 'PersonIcon',
          colorFondo: '#ffa000',
          colorTexto: '#fff8e1'
        }
      ]
    }
  })
})

module.exports = router
