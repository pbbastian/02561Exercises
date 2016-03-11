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
var subdivisionsSlider = document.getElementById("subdivisions-slider")
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
  // divideTriangle(points, indices, n, 0, 3, 2) // a b c
  // divideTriangle(points, indices, n, 2, 1, 0) // d c b
  // divideTriangle(points, indices, n, 0, 1, 3) // a d b
  // divideTriangle(points, indices, n, 2, 3, 1) // a c d
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
var far    = 16.0
var radius = 4.0
var at  = vec3(0.0, 0.0, 0.0)
//var at  = vec3(0, 0, 0)

var up  = vec3(0.0, 1.0, 0.0)

// Normalize to avoid light "clipping", i.e. first 40% of light on sphere is
// lit 100% and then it falls sharply.
var light = {
  direction: normalize(vec3(0, 0, -1)),
  emission:  vec3(1, 1, 1)
}

function getEye3p(at, rotation, radius) {
  var relativeEye = vec3(
    radius * Math.sin(rotation),
    radius,
    radius * Math.cos(rotation))
  var eye = add(at, relativeEye)
  return eye
}

function getModelViewMatrix(rotation) {
  var eye = getEye3p(at, rotation, radius)
  return lookAt(eye, at, up);
}

var fovy = 45.0
var aspect = canvas.width / canvas.height
var projectionMatrix = perspective(fovy, aspect, near, far)

var modelViewUniform = new GLUniform(gl, program, "modelView", GLUniformType.matrix4fv)
modelViewUniform.set(flatten(getModelViewMatrix(0)))

var projectionUniform = new GLUniform(gl, program, "projection", GLUniformType.matrix4fv)
projectionUniform.set(flatten(projectionMatrix))

var lightDirectionUniform = new GLUniform(gl, program, "lightDirection", GLUniformType.uniform3fv)
lightDirectionUniform.set(flatten(light.direction))

var lightEmissionUniform = new GLUniform(gl, program, "lightEmission", GLUniformType.uniform3fv)
lightEmissionUniform.set(flatten(light.emission))

var verticeBuffer = new GLArrayBuffer(gl, gl.STATIC_DRAW, 1, [
  new GLAttribute(gl, program, "vPosition", 4, gl.FLOAT),
  new GLAttribute(gl, program, "vColor", 4, gl.FLOAT),
  new GLAttribute(gl, program, "vNormal", 4, gl.FLOAT)
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
      var color = vertices[i].map(function(v) { return v * 0.5 + 0.5 })
      color[3] = 1.0
      var normal = (vertices[i])
      set(i, [vertices[i], color, normal])
    }
  })
  elementBuffer.buffer(indices)
}

var subdivisions
var rebufferNext = true

function render() {
  var rebuffer = rebufferNext
  rebufferNext = false

  var t = Date.now()
  var rotation = radians(t * 0.125 % 360)
  var modelViewMatrix = getModelViewMatrix(rotation)
  modelViewUniform.set(flatten(modelViewMatrix))

  if (rebuffer)
    bufferTetrahedron(subdivisions)

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  elementBuffer.draw(gl.TRIANGLES)
  requestAnimFrame(render)
}

var changeSubdivisionLevel = function (level) {
  level = Math.max(Math.min(level, 6), 0)
  subdivisions = level
  subdivisionsSlider.value = subdivisions
  subdivisionsText.innerHTML = subdivisions

  increaseButton.disabled = subdivisions == 6;
  decreaseButton.disabled = subdivisions == 0;

  rebufferNext = true
}

subdivisionsSlider.addEventListener("input", function (e) {
  changeSubdivisionLevel(e.target.value)
})
increaseButton.addEventListener("click", function (e) {
  changeSubdivisionLevel(subdivisions + 1)
})
decreaseButton.addEventListener("click", function (e) {
  changeSubdivisionLevel(subdivisions - 1)
})

changeSubdivisionLevel(6)
render(subdivisions)
