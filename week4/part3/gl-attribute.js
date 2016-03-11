function GLAttribute(gl, program, name, length, type) {
  this._gl = gl;
  this._program = program;
  this._name = name;
  this.length = length;
  this.type = type;
  this._location = this._gl.getAttribLocation(program, name);

  if (this.type == gl.FLOAT) {
    this.byteLength = 4 * this.length;
  } else {
    console.warn("Unknown type " + this.type);
  }
}

GLAttribute.prototype.pointer = function (stride, offset) {
  var gl = this._gl;
  gl.vertexAttribPointer(this._location, this.length, this.type, gl.FALSE, stride, offset);
}

GLAttribute.prototype.enable = function () {
  var gl = this._gl;
  gl.enableVertexAttribArray(this._location);
}
