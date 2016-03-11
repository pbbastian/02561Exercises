var GLUniformType = {
  matrix4fv: 1,
  uniform4fv: 2,
  uniform3fv: 3
}

var GLUniformType2 = {
  float: 0,
  integer: 1
}

var GLUniformShape = {
  scalar: 0,
  vector: 1,
  matrix: 2
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
    case GLUniformType.uniform4fv:
      gl.uniform4fv(this._location, value)
      break
    case GLUniformType.uniform3fv:
      gl.uniform3fv(this._location, value)
      break
    default:
      throw "GLUniform.prototype.set(): Invalid GLUniformType"
  }
}
