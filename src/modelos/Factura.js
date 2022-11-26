const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const FacturaEsquema = mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  nit: {
    type: Number,
    required: true
  },
  correo: {
    type: String,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  horario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Horario',
    required: true
  },
  butacas: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Butaca',
      required: true
    }
  ]
}, {
  timestamps: true,
  versionKey: false,
  id: false
}).plugin(mongoosePaginate)

module.exports = mongoose.model('Factura', FacturaEsquema)