function rgbHex(string) {
  var indices = string.startsWith("#") ? [1, 3, 5, 7] : [0, 2, 4, 6]
  var components = indices.map(function (i) {
    var n = string.substr(i, 2)
    return parseInt(n, 16) / 255
  }).filter(function (n) { return !isNaN(n) })
}

var canvas = document.getElementById("gl-canvas")
var onePointButton = document.getElementById("one-point")
var twoPointButton = document.getElementById("two-point")
var threePointButton = document.getElementById("three-point")

var gl = WebGLUtils.setupWebGL(canvas)
if (!gl) { alert("WebGL isn't available") }

//  Configure WebGL
gl.enable(gl.DEPTH_TEST)
gl.viewport(0, 0, canvas.width, canvas.height)
gl.clearColor(1.0, 1.0, 1.0, 1.0)

//  Load shaders and initialize attribute buffers
var program = initShaders(gl, "vertex-shader", "fragment-shader")
gl.useProgram(program)

// vec3(  0, 0, 0 ), // FBL
// vec3(  1, 0, 0 ), // FBR
// vec3(  1, 1, 0 ), // FTR
// vec3(  0, 1, 0 ), // FTL
//
// vec3(  0, 0, 1 ), // BBL
// vec3(  1, 0, 1 ), // BBR
// vec3(  1, 1, 1 ), // BTR
// vec3(  0, 1, 1 ), // BTL

var matrixVertices = [
  [0, 0, 0],
  [1, 0, 0],
  [1, 1, 0],
  [0, 1, 0],
  [0, 0, 1],
  [1, 0, 1],
  [1, 1, 1],
  [0, 1, 1],
]

var indices = [
  // Front
  0, 1,
  1, 2,
  2, 3,
  3, 0,
  // Back
  4, 5,
  5, 6,
  6, 7,
  7, 4,
  // Sides
  0, 4,
  1, 5,
  2, 6,
  3, 7,
]

var near   = -3.0
var far    = 1.0
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
modelViewUniform.set(flatten(getModelViewMatrix(getEye(1))))

var projectionUniform = new GLUniform(gl, program, "projection", GLUniformType.matrix4fv)
projectionUniform.set(flatten(projectionMatrix))

var verticeBuffer = new GLArrayBuffer(gl, gl.STATIC_DRAW, matrixVertices.length, [
  new GLAttribute(gl, program, "vPosition", 3, gl.FLOAT)
])
var elementBuffer = new GLElementArrayBuffer(gl, gl.STATIC_DRAW)

verticeBuffer.buffer(0, matrixVertices.length, function (set) {
  for (var i = 0; i < matrixVertices.length; i++) {
    set(i, [matrixVertices[i]])
  }
})
elementBuffer.buffer(indices)

var buttons = [onePointButton, twoPointButton, threePointButton]
buttons.map(function (button, i) {
  console.log(i)
  var points = i + 1
  var modelViewMatrix = flatten(getModelViewMatrix(getEye(points)))
  button.addEventListener("click", function (e) {
    modelViewUniform.set(modelViewMatrix)
  })
})

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT)
  elementBuffer.activate(function () {
    gl.drawElements(gl.LINES, indices.length, gl.UNSIGNED_BYTE, 0)
  })

  requestAnimFrame(render)
}

render()
