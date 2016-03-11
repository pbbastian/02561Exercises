function rgbHex(string) {
  var indices = string.startsWith("#") ? [1, 3, 5, 7] : [0, 2, 4, 6]
  var components = indices.map(function (i) {
    var n = string.substr(i, 2)
    return parseInt(n, 16) / 255
  }).filter(function (n) { return !isNaN(n) })
  return components
}

var canvas = document.getElementById("gl-canvas")
var increaseButton = document.getElementById("increase-subdivision")
var decreaseButton = document.getElementById("decrease-subdivision")
var subdivisionsText = document.getElementById("subdivisions")

var gl = WebGLUtils.setupWebGL(canvas)
if (!gl) { alert("WebGL isn't available") }

//  Configure WebGL
gl.enable(gl.DEPTH_TEST)
gl.enable(gl.CULL_FACE)
gl.viewport(0, 0, canvas.width, canvas.height)
gl.clearColor(1.0, 1.0, 1.0, 1.0)

//  Load shaders and initialize attribute buffers
var program = initShaders(gl, "vertex-shader", "fragment-shader")
gl.useProgram(program)

// var vertices = [
//   [[0, 0, 1], rgbHex("#54C7FCFF")],
//   [[1, 0, 1], rgbHex("#FFCD00FF")],
//   [[1, 1, 1], rgbHex("#FF9600FF")],
//   [[0, 1, 1], rgbHex("#FF2851FF")],
//   [[0, 0, 0], rgbHex("#0076FFFF")],
//   [[1, 0, 0], rgbHex("#44DB5EFF")],
//   [[1, 1, 0], rgbHex("#FF3824FF")],
//   [[0, 1, 0], rgbHex("#8E8E93FF")],
// ]
//
// var indices = [
//   // Front
//   0, 2, 3,
//   0, 1, 2,
//   // Left side
//   0, 3, 4,
//   4, 3, 7,
//   // Bottom
//   0, 4, 5,
//   0, 5, 1,
//   // Back
//   7, 5, 4,
//   7, 6, 5,
//   // Top
//   3, 6, 7,
//   3, 2, 6,
//   // Right side
//   1, 6, 2,
//   1, 5, 6
// ]

// var vertices = [
//   [[0.0, 0.0, -1.0, 1.0], rgbHex("#54C7FCFF")],
//   [[0.0, 0.942809, 0.333333, 1.0], rgbHex("#FFCD00FF")],
//   [[-0.816497, -0.471405, 0.333333, 1.0], rgbHex("#FF2851FF")],
//   [[0.816497, -0.471405, 0.333333, 1.0], rgbHex("#0076FFFF")]
// ]

// var indices = [
//   0, 3, 2,
//   2, 1, 0,
//   0, 1, 3,
//   2, 3, 1
// ]

function triangle(points, indices, a, b, c) {
  // Used to be a,b,c
  indices.push(a)
  indices.push(c)
  indices.push(b)
}

function divideTriangle(points, indices, count, a, b, c) {
  if (count > 0) {
    var ab = points.push(normalize(mix(points[a], points[b], 0.5), true)) - 1
    var ac = points.push(normalize(mix(points[a], points[c], 0.5), true)) - 1
    var bc = points.push(normalize(mix(points[b], points[c], 0.5), true)) - 1

    divideTriangle(points, indices, count - 1, a,  ab, ac)
    divideTriangle(points, indices, count - 1, ab, b,  bc)
    divideTriangle(points, indices, count - 1, bc, c,  ac)
    divideTriangle(points, indices, count - 1, ab, bc, ac)
  } else {
    triangle(points, indices, a, b, c)
  }
}

function generateTetrahedron(n, a, b, c, d) {
  var points = [a, b, c, d]
  var indices = []
  divideTriangle(points, indices, n, 0, 1, 2) // a b c
  divideTriangle(points, indices, n, 3, 2, 1) // d c b
  divideTriangle(points, indices, n, 0, 3, 1) // a d b
  divideTriangle(points, indices, n, 0, 2, 3) // a c d
  return [points, indices];
}

function generateWireframe(indices) {
  var lineIndices = []
  for (var i = 0; i < indices.length; i += 3) {
    var a = indices[i]
    var b = indices[i+1]
    var c = indices[i+2]
    lineIndices.push(a)
    lineIndices.push(b)
    lineIndices.push(b)
    lineIndices.push(c)
    lineIndices.push(c)
    lineIndices.push(a)
  }
  return lineIndices
}

var baseVertices = [
  vec4(0.0, 0.0, -1.0, 1.0),
  vec4(0.0, 0.942809, 0.333333, 1.0),
  vec4(-0.816497, -0.471405, 0.333333, 1.0),
  vec4(0.816497, -0.471405, 0.333333, 1.0)
]

var tetrahedron = generateTetrahedron(3,
    baseVertices[0], baseVertices[1], baseVertices[2], baseVertices[3])
var vertices = tetrahedron[0]
var indices = tetrahedron[1]
// var indices = vertices.map(function (_, i) { return i })
var wireframe = generateWireframe(indices)

var near   = 0.1
var far    = 5.0
var radius = 4.0
var theta  = radians(45.0)
var phi    = radians(45.0)

var at  = vec3(0.5, 0.5, 0.5)

var up  = vec3(0.0, 1.0, 0.0)

function getEye(points) {
  if (points == 1) {
    return vec3(at[0], at[1], radius*Math.cos(theta))
  } else if (points == 2) {
    return vec3(at[0], radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta))
  } else if (points == 3) {
    return vec3(radius*Math.sin(theta)*Math.cos(phi), radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta))
  }
}

function getModelViewMatrix(eye) {
  return lookAt(eye, at, up);
}

var fovy = 45.0
var aspect = canvas.width / canvas.height
var projectionMatrix = perspective(fovy, aspect, near, far);

var modelViewUniform = new GLUniform(gl, program, "modelView", GLUniformType.matrix4fv)
modelViewUniform.set(flatten(getModelViewMatrix(getEye(3))))

var projectionUniform = new GLUniform(gl, program, "projection", GLUniformType.matrix4fv)
projectionUniform.set(flatten(projectionMatrix))

var verticeBuffer = new GLArrayBuffer(gl, gl.STATIC_DRAW, 1, [
  new GLAttribute(gl, program, "vPosition", 4, gl.FLOAT),
  new GLAttribute(gl, program, "vColor", 4, gl.FLOAT)
])
var elementBuffer = new GLElementArrayBuffer(gl, gl.STATIC_DRAW)

function bufferTetrahedron(n) {
  var tetrahedron = generateTetrahedron(n,
      baseVertices[0], baseVertices[1], baseVertices[2], baseVertices[3])
  var vertices = tetrahedron[0]
  var indices = tetrahedron[1]
  verticeBuffer.resize(vertices.length)
  verticeBuffer.buffer(0, vertices.length, function (set) {
    for (var i = 0; i < vertices.length; i++) {
      var color = [
        vertices[i][0]*0.5+0.5,
        vertices[i][1]*0.5+0.5,
        vertices[i][2]*0.5+0.5,
        1.0
      ]
      set(i, [vertices[i], color])
    }
  })
  elementBuffer.buffer(indices)
}

function render(subdivisions) {
  bufferTetrahedron(subdivisions)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  elementBuffer.draw(gl.TRIANGLES)
}

var subdivisions = 5
subdivisionsText.innerHTML = subdivisions
render(subdivisions)

increaseButton.addEventListener("click", function (e) {
  subdivisions += 1
  subdivisionsText.innerHTML = subdivisions
  render(subdivisions)
})
decreaseButton.addEventListener("click", function (e) {
  if (subdivisions > 0) {
    subdivisions -= 1
  }
  subdivisionsText.innerHTML = subdivisions
  render(subdivisions)
})
