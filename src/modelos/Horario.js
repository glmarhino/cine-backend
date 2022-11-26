const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const HorarioEsquema = mongoose.Schema({
  precio: {
    type: Number,
    required: true
  },
  horaInicio: {
    type: Date,
    required: true
  },
  horaFin: {
    type: Date,
    required: true
  },
  butacasTotal: {
    type: Number,
    required: false
  },
  butacasVendidas: {
    type: Number,
    required: false,
    default: 0
  },
  pelicula: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pelicula',
    required: true
  },
  sala: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sala',
    required: true
  },
  butacas: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Butaca',
      required: false
    }
  ]
}, {
  timestamps: true,
  versionKey: false,
  id: false,
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  }
}).plugin(mongoosePaginate)

HorarioEsquema.virtual('butacasLibres').get(function() {
  return this.butacasTotal - this.butacasVendidas
})

module.exports = mongoose.model('Horario', HorarioEsquema)
