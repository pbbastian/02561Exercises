function GLArrayBuffer(gl, usage, capacity, attributes) {
  this._gl = gl
  this._usage = usage
  this._capacity = capacity
  this._attributes = attributes
  this._buffer = gl.createBuffer()
  this._byteLength = this._attributes.reduce(function(sum, attribute) {
    return sum += attribute.byteLength
  }, 0)
  this._totalByteLength = this._byteLength * this._capacity
  this.activate(function() {
    this.enableAttributes()
    this.clear()
  }.bind(this))
}

GLArrayBuffer.prototype.enableAttributes = function() {
  if (!this._activated) return this.activate(this.enableAttributes)
  var offset = 0
  for (var i = 0; i < this._attributes.length; i++) {
    var attribute = this._attributes[i]
    // stride skal være byte længden af hver vertex
    // offset skal være relativt ift. starten af vertex
    // e.g. for attribute #2 skal den være længden af attribute #1 etc.
    attribute.pointer(this._byteLength, offset)
    attribute.enable()
    offset += attribute.byteLength
  }
}

GLArrayBuffer.prototype.buffer = function(index, count, f) {
  if (!this._activated)
    return this.activate(this.buffer.bind(this, index, count, f))
  var gl = this._gl
  var arrayBuffer = new ArrayBuffer(count*this._byteLength)
  var dataView = new DataView(arrayBuffer)

  var setAttribute = function (dataView, attribute, offset, value) {
    if (attribute.type == this._gl.FLOAT) {
      for (var j = 0; j < attribute.length; j++) {
        // Last parameter MUST be true to ensure correct endianness.
        dataView.setFloat32(offset, value[j], true)
        offset += 4
      }
    }
    return offset
  }.bind(this)

  var set = function (relativeIndex, values) {
    var offset = relativeIndex*this._byteLength
    for (var i = 0; i < values.length; i++) {
      var value = values[i]
      var attribute = this._attributes[i]
      offset = setAttribute(dataView, attribute, offset, value)
    }
  }.bind(this)

  // Pass a setter function to `f`, allowing `f` to write to the array buffer
  // without knowing the inner details.
  f(set)

  gl.bufferSubData(gl.ARRAY_BUFFER, index*this._byteLength, arrayBuffer)
}

GLArrayBuffer.prototype.resize = function(capacity) {
  this._capacity = capacity
  this._totalByteLength = this._byteLength * this._capacity
  this.clear()
}

GLArrayBuffer.prototype.clear = function() {
  if (!this._activated) return this.activate(this.clear.bind(this))
  var gl = this._gl
  gl.bufferData(gl.ARRAY_BUFFER, this._totalByteLength, this._usage)
}

GLArrayBuffer.prototype.activate = function(f) {
  var gl = this._gl
  gl.bindBuffer(gl.ARRAY_BUFFER, this._buffer)
  this._activated = true
  f(this)
  this._activated = false
  this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null)
}
