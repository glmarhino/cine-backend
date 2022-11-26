const jwt = require('jsonwebtoken')
const { unless } = require('express-unless')

function tokenExpirado(token) {
  const base64 = token.split('.')[1]
  const json = Buffer.from(base64, 'base64').toString()
  const decodificado = JSON.parse(json)
  const exp = decodificado.exp;
  return Date.now() >= exp * 1000
}

const validar = (req, res, next) => {
  const cabecera = req.header('Authorization')
  if (!cabecera) {
    return res.status(401).json({
      error: true,
      mensaje: 'Acceso denegado',
      datos: []
    })
  }
  try {
    const datos = cabecera.split(' ')
    if (datos.length != 2) {
      return res.status(401).json({
        error: true,
        mensaje: 'El tipo de autorización debe ser igual a Bearer TOKEN',
        datos: []
      })
    }
    const tipo = datos[0]
    const token = datos[1]
    if (tipo != 'Bearer') {
      return res.status(401).json({
        error: true,
        mensaje: 'El tipo de autorización debe ser igual a Bearer',
        datos: []
      })
    }
    if (!tokenExpirado(token)) {
      const usuario = jwt.verify(token, process.env.TOKEN_LLAVE)
      req.usuario = usuario
      next()
    } else {
      return res.status(401).json({
        error: true,
        mensaje: 'Token expirado',
        datos: []
      })
    }
  } catch (error) {
    return res.status(401).json({
      error: true,
      mensaje: 'Token inválido',
      datos: []
    })
  }
}
validar.unless = unless
exports.validar = validar