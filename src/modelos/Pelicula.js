const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const PeliculaEsquema = mongoose.Schema({
  nombre: {
    type: String,
    unique: true,
    required: true
  },
  detalle: {
    type: String,
    required: true
  },
  codigo: {
    type: String,
    required: true,
    unique: true
  },
  horas: {
    type: Number,
    required: true
  },
  minutos: {
    type: Number,
    required: true
  },
  imagen: {
    type: String,
    required: false
  },
  trailer: {
    type: String,
    required: false
  },
  horarios: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Horario',
      required: false,
      select: false
    }
  ]
}, {
  timestamps: true,
  versionKey: false,
  id: false
}).plugin(mongoosePaginate)

module.exports = mongoose.model('Pelicula', PeliculaEsquema)
