function GLElementArrayBuffer(gl, usage) {
  this._gl = gl;
  this._usage = usage;
  this._buffer = this._gl.createBuffer();
}

GLElementArrayBuffer.prototype.buffer = function (indices) {
  if (!this._activated) return this.activate(this.buffer.bind(this, indices));
  var gl = this._gl;
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), this._usage);
}

GLElementArrayBuffer.prototype.activate = function (f) {
  var gl = this._gl;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._buffer);
  this._activated = true;
  f(this);
  this._activated = false;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}
