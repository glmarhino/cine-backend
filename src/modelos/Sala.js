const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const SalaEsquema = mongoose.Schema({
  nombre: {
    type: String,
    unique: true,
    required: true
  },
  filas: {
    type: Number,
    required: true
  },
  columnas: {
    type: Number,
    required: true
  },
  horarios: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Horario',
      required: false
    }
  ]
}, {
  timestamps: true,
  versionKey: false,
  id: false
}).plugin(mongoosePaginate)

module.exports = mongoose.model('Sala', SalaEsquema)
