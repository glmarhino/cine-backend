const mongoose = require('mongoose')

const ButacaEsquema = mongoose.Schema({
  factura: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Factura',
    required: true
  },
  horario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Horario',
    required: true
  },
  fila: {
    type: Number,
    required: true
  },
  columna: {
    type: Number,
    required: true
  }
}, {
  timestamps: true,
  versionKey: false,
  versionKey: false,
  id: false
})

module.exports = mongoose.model('Butaca', ButacaEsquema)
