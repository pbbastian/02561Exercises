console.log("Loaded part3.js");

var Vector = {
  add: function(a, b) {
    return a.map(function(val, i) { return val + b[i] });
  },
  subtract: function(a, b) {
    return a.map(function(val, i) { return val - b[i] });
  },
  length: function(a) {
    return Math.sqrt(a.reduce(function(sum, val) { return sum + Math.pow(val, 2) }, 0));
  }
}

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
  gl.vertexAttribPointer(this._location, this.length, this.type, gl.FALSE, stride, offset);
}

GLAttribute.prototype.enable = function () {
  gl.enableVertexAttribArray(this._location);
}

function GLBuffer(gl, usage, capacity, attributes) {
  this._gl = gl;
  this._usage = usage;
  this._capacity = capacity;
  this._attributes = attributes;
  this._buffer = this._gl.createBuffer();
  this._byteLength = this._attributes.reduce(function(sum, attribute) {
    return sum += attribute.byteLength;
  }, 0);
  this._totalByteLength = this._byteLength * this._capacity;

  this.with(function(b) {
    b.enableAttributes();
    b.clear();
  });
}

GLBuffer.prototype.enableAttributes = function() {
  var offset = 0;
  for (var i = 0; i < this._attributes.length; i++) {
    var attribute = this._attributes[i];
    // stride skal være byte længden af hver vertex
    // offset skal være relativt ift. starten af vertex
    // e.g. for attribute #2 skal den være længden af attribute #1 etc.
    attribute.pointer(this._byteLength, offset);
    attribute.enable();
    offset += attribute.byteLength;
  }
}

GLBuffer.prototype.buffer = function(index, count, f) {
  var arrayBuffer = new ArrayBuffer(count*this._byteLength);
  var dataView = new DataView(arrayBuffer);
  // Pass a setter function to `f`,
  // allowing `f` to use the array buffer without knowing the inner details.
  f(function (relativeIndex, values) {
    var offset = relativeIndex*this._byteLength;
    for (var i = 0; i < values.length; i++) {
      var value = values[i];
      var attribute = this._attributes[i];

      if (attribute.type == this._gl.FLOAT) {
        for (var j = 0; j < attribute.length; j++) {
          // Last parameter MUST be true to ensure correct endianness.
          dataView.setFloat32(offset, value[j], true);
          offset += 4;
        }
      }
    }
  }.bind(this));
  this._gl.bufferSubData(this._gl.ARRAY_BUFFER, index*this._byteLength, dataView);
}

var activeBuffer = null;

GLBuffer.prototype.clear = function() {
  this._gl.bufferData(this._gl.ARRAY_BUFFER, this._totalByteLength, this._usage);
}

GLBuffer.prototype.with = function(f) {
  var lastActiveBuffer = activeBuffer;
  this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._buffer);
  activeBuffer = this._buffer;
  f(this);
  this._gl.bindBuffer(this._gl.ARRAY_BUFFER, lastActiveBuffer);
  activeBuffer = lastActiveBuffer;
}

var maxPoints = 500;
var maxCircles = 500;
var maxTriangles = 500;
var circleRadius = 0.1;
var verticesPerCircle = 50;

var totalObjects = maxPoints + maxCircles + maxTriangles;
var zIncrement = -1.0 / totalObjects;

var pointStart = 0;
var circleStart = pointStart + maxPoints;
var triangleStart = circleStart + verticesPerCircle*maxCircles;
var maxVertices = triangleStart + maxTriangles * 3;

var colors = {
  "white":        [1.0, 1.0, 1.0, 1.0],
  "black":        [0.0, 0.0, 0.0, 1.0],
  "sky blue":     [0x54/255, 0xC7/255, 0xFC/255, 1.0],
  "yellow":       [0xFF/255, 0xCD/255, 0x00/255, 1.0],
  "orange":       [0xFF/255, 0x96/255, 0x00/255, 1.0],
  "tornado red":  [0xFF/255, 0x28/255, 0x51/255, 1.0],
  "radical blue": [0x00/255, 0x76/255, 0xFF/255, 1.0],
  "green":        [0x44/255, 0xDB/255, 0x5E/255, 1.0],
  "hot orange":   [0xFF/255, 0x38/255, 0x24/255, 1.0],
  "gray":         [0x8E/255, 0x8E/255, 0x93/255, 1.0],
  "cornflower":   [0.3921, 0.5843, 0.9294, 1.0]
};
var shapes = {
  point: 0,
  circle: 1,
  triangle: 2
};

var canvas = document.getElementById("gl-canvas");

var gl = WebGLUtils.setupWebGL(canvas);
if (!gl) { alert("WebGL isn't available"); }

//  Configure WebGL
gl.enable(gl.DEPTH_TEST);
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(1.0, 1.0, 1.0, 1.0);

//  Load shaders and initialize attribute buffers
var program = initShaders(gl, "vertex-shader", "fragment-shader");
gl.useProgram(program);

var pointBuffer = new GLBuffer(gl, gl.STREAM_DRAW, maxVertices, [
  new GLAttribute(gl, program, "vPosition", 3, gl.FLOAT),
  new GLAttribute(gl, program, "vColor", 4, gl.FLOAT)
]);

var pointCount = 0;
var circleCount = 0;
var triangleCount = 0;
var selectedColor = colors["tornado red"];
var selectedShape = shapes.point;
var currentZ = 0;

function pushPoint(position) {
  var index = pointStart + pointCount;
  position.push(currentZ);
  pointBuffer.with(function(b) {
    // b.set(index, [position, selectedColor]);
    // b.buffer(index);
    b.buffer(index, 1, function (set) {
      set(0, [position, selectedColor]);
    });
  });

  pointCount = (pointCount + 1) % maxPoints;
  currentZ += zIncrement;
}

function pushCircle(center, edge) {
  var centerEdgeVector = Vector.subtract(edge.position, center.position);
  var radius = Vector.length(centerEdgeVector);
  var startIndex = circleStart + verticesPerCircle * circleCount;
  center.position.push(currentZ);

  pointBuffer.with(function(b) {
    b.buffer(startIndex, verticesPerCircle, function (set) {
      set(0, [center.position, center.color]);
        for (var i = 0; i < verticesPerCircle - 1; i++) {
          var position = [
            center.position[0] + radius * Math.cos((2 * Math.PI * i) / (verticesPerCircle - 2)),
            center.position[1] + radius * Math.sin((2 * Math.PI * i) / (verticesPerCircle - 2)),
            currentZ
          ];
          set(i+1, [position, edge.color]);
        }
    });
  });

  circleCount = (circleCount + 1) % maxCircles;
  currentZ += zIncrement;
}

function pushTriangle(a, b, c) {
  var index = triangleStart + triangleCount * 3;
  a.position.push(currentZ);
  b.position.push(currentZ);
  c.position.push(currentZ);

  pointBuffer.with(function(buffer) {
    buffer.buffer(index, 3, function (set) {
      set(0, [a.position, a.color]);
      set(1, [b.position, b.color]);
      set(2, [c.position, c.color]);
    });
  })

  triangleCount = (triangleCount + 1) % maxTriangles;
  currentZ += zIncrement;
}

var clearButton = document.getElementById("clear-button");
var colorSelect = document.getElementById("color-select");
var pointButton = document.getElementById("point-button");
var circleButton = document.getElementById("circle-button");
var triangleButton = document.getElementById("triangle-button");

var shapeSpecs = [];

canvas.addEventListener("click", function (event) {
  var boundingRect = event.target.getBoundingClientRect();

  var screenX = event.offsetX;
  var screenY = boundingRect.height - event.offsetY;

  var position = [
    2 * screenX / boundingRect.width - 1,
    2 * screenY / boundingRect.height - 1
  ];

  switch (selectedShape) {
    case shapes.point:
      pushPoint(position);
      break;
    case shapes.circle:
      shapeSpecs.push({position: position, color: selectedColor});
      if (shapeSpecs.length == 2) {
        pushCircle.apply(this, shapeSpecs);
        shapeSpecs = [];
      }
      break;
    case shapes.triangle:
      shapeSpecs.push({position: position, color: selectedColor});
      if (shapeSpecs.length == 3) {
        pushTriangle.apply(this, shapeSpecs);
        shapeSpecs = [];
      }
      break;
  }
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
});

pointButton.addEventListener("click", function (event) {
  selectedShape = shapes.point;
  shapePositions = [];
  pointButton.disabled = true;
  circleButton.disabled = false;
  triangleButton.disabled = false;
});

circleButton.addEventListener("click", function (event) {
  selectedShape = shapes.circle;
  shapePositions = [];
  pointButton.disabled = false;
  circleButton.disabled = true;
  triangleButton.disabled = false;
});

triangleButton.addEventListener("click", function (event) {
  selectedShape = shapes.triangle;
  shapePositions = [];
  pointButton.disabled = false;
  circleButton.disabled = false;
  triangleButton.disabled = true;
})

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.POINTS, pointStart, pointCount);
  gl.drawArrays(gl.TRIANGLES, triangleStart, triangleCount*3);
  for (var i = 0; i < circleCount; i++) {
    gl.drawArrays(gl.TRIANGLE_FAN, circleStart + verticesPerCircle*i, verticesPerCircle);
  }

  requestAnimFrame(render);
}

render();
