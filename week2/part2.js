(function() {
  // var pointBuffer = new BufferObject(gl, gl.STREAM_DRAW, maxPoints, [
  //   new Attribute(gl, program, "vPosition", 4, gl.FLOAT),
  //   new Attribute(gl, program, "pointSize", 2, gl.FLOAT)
  // ]);
  function Attribute(gl, program, name, length, type) {
    this.gl = gl;
    this.program = program;
    this.name = name;
    this.length = length;
    this.type = type;
    this.location = this.gl.getAttribLocation(program, name);

    if (this.type == gl.FLOAT) {
      this.byteLength = 4 * this.length;
    } else {
      console.warn("Unknown type " + this.type);
    }
  }

  Attribute.prototype.pointer = function (stride, offset) {
    gl.vertexAttribPointer(this.location, this.length, this.type, gl.FALSE, stride, offset);
  }

  Attribute.prototype.enable = function () {
    gl.enableVertexAttribArray(this.location);
  }

  function BufferObject(gl, usage, capacity, attributes) {
    this.gl = gl;
    this.usage = usage;
    this.capacity = capacity;
    this.attributes = attributes;
    this.buffer = this.gl.createBuffer();
    this.byteLength = this.attributes.reduce(function(sum, attribute) {
      return sum += attribute.byteLength;
    }, 0);
    this.totalByteLength = this.byteLength * this.capacity;

    this.with(function(b) {
      b.enableAttributes();
      b.clear();
    });
  }

  BufferObject.prototype.enableAttributes = function() {
    var offset = 0;
    for (var i = 0; i < this.attributes.length; i++) {
      var attribute = this.attributes[i];
      attribute.pointer(this.byteLength, offset);
      attribute.enable();
      offset += attribute.byteLength;
    }
  }

  BufferObject.prototype.set = function(index, values) {
    if (values.length != this.attributes.length) {
      console.warn("Length of values must be the same as the number of attributes in buffer object.");
    }
    
    var dataView = new DataView(this.arrayBuffer, index*this.byteLength, this.byteLength);

    var offset = 0;
    for (var i = 0; i < values.length; i++) {
      var value = values[i];
      var attribute = this.attributes[i];

      if (attribute.type == this.gl.FLOAT) {

        for (var j = 0; j < attribute.length; j++) {
          // Last parameter MUST be true to ensure correct endianness.
          dataView.setFloat32(offset, value[j], true);
          offset += 4;
        }
      }
    }

    this.gl.bufferSubData(this.gl.ARRAY_BUFFER, index*this.byteLength, dataView);
  }

  var activeBuffer = null;

  BufferObject.prototype.with = function(f) {
    var lastActiveBuffer = activeBuffer;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
    activeBuffer = this.buffer;
    f(this);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, lastActiveBuffer);
    activeBuffer = lastActiveBuffer;
  }

  BufferObject.prototype.clear = function() {
    this.arrayBuffer = new ArrayBuffer(this.totalByteLength);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.totalByteLength, this.usage);
  }

  var maxPoints = 10;
  // var byteLengths = {
  //   position: new Float32Array([0,0]).byteLength, // 8 bytes = 2 * 32 bit
  //   pointSize: new Float32Array([0]).byteLength   // 4 bytes = 1 * 32 bit
  // };
  var colors = {
    "white": [1.0, 1.0, 1.0, 1.0],
    "black": [0.0, 0.0, 0.0, 1.0],
    "blue":  [0.0, 0.0, 1.0, 1.0],
    "red":   [1.0, 0.0, 0.0, 1.0],
    "cornflower": [0.3921, 0.5843, 0.9294, 1.0]
  };

  var selectedColor = colors[Object.keys(colors)[0]];
  console.log(selectedColor);

  var canvas = document.getElementById("gl-canvas");
  var clearButton = document.getElementById("clear-button");
  var colorSelect = document.getElementById("color-select");
  
  var gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) { alert("WebGL isn't available"); }
  window.gl = gl;

  //  Configure WebGL
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
  
  //  Load shaders and initialize attribute buffers
  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  var pointBuffer = new BufferObject(gl, gl.STATIC_DRAW, maxPoints, [
    new Attribute(gl, program, "vPosition", 2, gl.FLOAT),
    new Attribute(gl, program, "vPointSize", 1, gl.FLOAT),
    new Attribute(gl, program, "vColor", 4, gl.FLOAT)
  ]);

  var pointCount = 0;

  function pushPoint(position) {
    var index = pointCount;
    var n = Math.floor(Math.random() * (25.0 - 15.0) + 15.0);
    if (n % 2 != 0) n += 1;
    pointBuffer.with(function(b) {
      b.set(index, [position, [n], selectedColor]);
    });

    pointCount = (pointCount + 1) % maxPoints;
  }

  canvas.addEventListener("click", function (event) {
    var boundingRect = event.target.getBoundingClientRect();

    var screenX = event.offsetX;
    var screenY = boundingRect.height - event.offsetY;

    var x = 2 * screenX / boundingRect.width - 1;
    var y = 2 * screenY / boundingRect.height - 1;

    pushPoint([x, y]);
  });

  clearButton.addEventListener("click", function (event) {
    gl.clearColor(selectedColor[0], selectedColor[1], selectedColor[2], selectedColor[3]);
    pointBuffer.with(function(b) {
      b.clear();
    });
    pointCount = 0;
  });

  colorSelect.addEventListener("change", function (event) {
    selectedColor = colors[event.target.value];
    console.log(colors[event.target.value]);
  })

  function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, maxPoints);
    

    requestAnimFrame(render);
  }

  render();
})();