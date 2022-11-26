const express = require('express')
const app = express()
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const cors = require('cors')
const jwt = require('./middlewares/token')
const utiles = require('./utiles')
require('dotenv/config')

app.use(cors())
app.use(bodyParser.json())

app.use(jwt.validar.unless({
  path: [
    {
      url: '/api/autenticar',
      methods: ['POST']
    }, {
      url: '/api/cartelera',
      methods: ['GET']
    }, {
      url: /^\/api\/cartelera\/.*/,
      methods: ['GET']
    }, {
      url: /^\/api\/butacas\/.*/,
      methods: ['GET']
    }, {
      url: '/api/butacas',
      methods: ['POST']
    }, {
      url:  /^\/api\/peliculas\/.*\/imagen/,
      methods: ['GET']
    }
  ]
}))

app.use('/api/inicio', require('./controladores/inicio'))
app.use('/api/usuarios', require('./controladores/usuarios'))
app.use('/api/salas', require('./controladores/salas'))
app.use('/api/peliculas', require('./controladores/peliculas'))
app.use('/api/cartelera', require('./controladores/cartelera'))
app.use('/api/butacas', require('./controladores/butacas'))
app.use('/api/facturas', require('./controladores/facturas'))
app.use('/api/reportes', require('./controladores/reportes'))
app.use('/api/autenticar', require('./controladores/autenticar'))

mongoose.connect(process.env.BD_CONEXION, {
  useNewUrlParser: true
}).then(() => {
  console.log('Conectado a la base de datos')
  utiles.primerUsuario(function() {
    app.listen(process.env.PUERTO_HTTP, () => {
      console.log(`Servidor iniciado en el puerto ${process.env.PUERTO_HTTP}`)
    })
  })
}).catch(() => {
  console.log('Error de conexión con la base de datos')
})