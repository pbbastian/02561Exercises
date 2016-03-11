(function() {
  

  const maxPoints = 10;
  let counter = 0;
  const byteLengths = {
    position: new Float32Array([0,0]).byteLength, // 8 bytes = 2 * 32 bit
    pointSize: new Float32Array([0]).byteLength   // 4 bytes = 1 * 32 bit
  };

  const canvas = document.getElementById("gl-canvas");
  
  const gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) { alert("WebGL isn't available"); }

  function BufferObject(byteLength, capacity, usage) {
    this.byteLength = byteLength;
    this.capacity = capacity;
    this.usage = usage;
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, capacity * byteLength, usage);
  }

  BufferObject.prototype.set = function(index, value) {
    gl.bufferSubData(gl.ARRAY_BUFFER, index*this.byteLength, value);
  }

  BufferObject.prototype.with = function(f) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    f();
  }

  //  Configure WebGL
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
  
  //  Load shaders and initialize attribute buffers
  const program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  let positionBuffer = new BufferObject(byteLengths.position, maxPoints, gl.STREAM_DRAW);
  let pointSizeBuffer = new BufferObject(byteLengths.pointSize, maxPoints, gl.STREAM_DRAW);

  const attribs = {
    vPosition: gl.getAttribLocation(program, "vPosition"),
    pointSize: gl.getAttribLocation(program, "pointSize")
  };

  positionBuffer.with(function() {
    gl.vertexAttribPointer(attribs.vPosition, 2, gl.FLOAT, gl.FALSE, 0, 0);
    gl.enableVertexAttribArray(attribs.vPosition);
  });

  pointSizeBuffer.with(function() {
    gl.vertexAttribPointer(attribs.pointSize, 1, gl.FLOAT, gl.FALSE, 0, 0);
    gl.enableVertexAttribArray(attribs.pointSize);
  });

  function pushPoint(point) {
    const index = counter;
    let n = Math.floor(Math.random() * (25.0 - 15.0) + 15.0);
    if (n % 2 != 0) n += 1;
    const pointSize = new Float32Array([n]);
    // points.push(point);

    positionBuffer.with(function() {
      positionBuffer.set(index, flatten(point));
    });

    pointSizeBuffer.with(function() {
      pointSizeBuffer.set(index, pointSize);
    });

    counter = (counter + 1) % maxPoints;
  }

  canvas.addEventListener("click", (event) => {
    const boundingRect = event.target.getBoundingClientRect();

    const screenX = event.offsetX;
    const screenY = boundingRect.height - event.offsetY;

    const x = 2 * screenX / boundingRect.width - 1;
    const y = 2 * screenY / boundingRect.height - 1;

    pushPoint(vec2(x, y));
  });

  function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, maxPoints);

    requestAnimFrame(render);
  }

  render();
})();