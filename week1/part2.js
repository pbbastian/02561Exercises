var gl;
var points = [
  vec2(0, 0),
  vec2(1, 1),
  vec2(1, 0)
];

window.onload = function init() {
  var canvas = document.getElementById("gl-canvas");
  
  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) { alert("WebGL isn't available"); }

  //  Configure WebGL
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
  
  //  Load shaders and initialize attribute buffers
  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  render();
};

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.POINTS, 0, points.length);
}