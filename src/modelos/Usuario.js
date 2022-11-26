const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const bcrypt = require('bcryptjs')

const UsuarioEsquema = mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  apellido: {
    type: String,
    required: true
  },
  telefono: {
    type: Number,
    required: false
  },
  email: {
    type: String,
    required: false
  },
  direccion: {
    type: String,
    required: false
  },
  usuario: {
    type: String,
    required: true,
    unique: true
  },
  clave: {
    type: String,
    required: true,
    select: false
  },
  rol: {
    type: String,
    required: true,
    enum: ['Administrador', 'Gerente']
  }
}, {
  timestamps: true,
  versionKey: false,
  id: false,
  methods: {
    verificarClave: function(clave, callback) {
      bcrypt.compare(clave, this.clave, function(error, verificado) {
        if (error) {
          return callback(error)
        } else {
          callback(null, verificado)
        }
      })
    }
  }
}).pre('save', function (next) {
  const usuario = this
  if (this.isModified('clave') || this.isNew) {
    bcrypt.genSalt(4, function(saltError, salt) {
      if (saltError) {
        return next(saltError)
      } else {
        bcrypt.hash(usuario.clave, salt, function(hashError, hash) {
          if (hashError) {
            return next(hashError)
          }
          usuario.clave = hash
          next()
        })
      }
    })
  } else {
    return next()
  }
}).pre('findOneAndUpdate', function (next) {
  const usuario = this
  if (usuario._update.clave !== undefined) {
    bcrypt.genSalt(4, function(saltError, salt) {
      if (saltError) {
        return next(saltError)
      } else {
        bcrypt.hash(usuario._update.clave, salt, function(hashError, hash) {
          if (hashError) {
            return next(hashError)
          }
          usuario.clave = hash
          usuario._update.clave = hash
          next()
        })
      }
    })
  } else {
    return next()
  }
}).plugin(mongoosePaginate)

module.exports = mongoose.model('Usuario', UsuarioEsquema)
