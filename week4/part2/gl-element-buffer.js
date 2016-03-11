function GLElementArrayBuffer(gl, usage) {
  this._gl = gl
  this._usage = usage
  this._buffer = this._gl.createBuffer()
  this._type = null
  this._count = null
}

GLElementArrayBuffer.prototype.buffer = function (indices) {
  if (!this._activated) return this.activate(this.buffer.bind(this, indices))
  var gl = this._gl
  var bitsNeeded = Math.log(indices.length) / Math.log(2)
  var buffer
  if (bitsNeeded <= 8) {
    console.log("8 bit")
    buffer = new Uint8Array(indices)
    this._type = gl.UNSIGNED_BYTE
  } else if (bitsNeeded <= 16) {
    console.log("16 bit")
    buffer = new Uint16Array(indices)
    this._type = gl.UNSIGNED_SHORT
  } else {
    throw "GLElementArrayBuffer.prototype.buffer(): Too many indices"
  }
  this._count = indices.length
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, buffer, this._usage)
}

GLElementArrayBuffer.prototype.activate = function (f) {
  var gl = this._gl
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._buffer)
  this._activated = true
  f(this)
  this._activated = false
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)
}

GLElementArrayBuffer.prototype.draw = function (mode, count, offset) {
  if (!this._activated) return this.activate(this.draw.bind(this, mode, count, offset))
  count = count || this._count
  offset = offset || 0
  var gl = this._gl
  gl.drawElements(mode, count, this._type, offset)
}

// TODO: draw() method
// http://stackoverflow.com/questions/28324162/webgl-element-array-buffers-not-working
