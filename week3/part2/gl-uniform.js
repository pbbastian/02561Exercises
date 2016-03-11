var GLUniformType = {
  matrix4fv: 1
}

function GLUniform(gl, program, name, type) {
  this._gl = gl
  this._program = program
  this._name = name
  this._type = type
  this._location = gl.getUniformLocation(program, name)
}

GLUniform.prototype.set = function (value, options) {
  options = options || {}
  var gl = this._gl
  switch (this._type) {
    case GLUniformType.matrix4fv:
      var transpose = !!options.transpose;
      gl.uniformMatrix4fv(this._location, transpose, value)
      break
    default:
      throw "GLUniform.prototype.set(): Invalid GLUniformType"
  }
}
