var gl;

function init() {
  var canvas = document.getElementById("gl-canvas");
  
  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) { alert("WebGL isn't available"); }

  var points = [
    vec3( 0,    0.5, 0),
    vec3( 0.5,  0,   0),
    vec3(-0.5,  0,   0),
    vec3( 0,   -0.5, 0)
  ];

  var colors = [
    vec3(1.0, 0.0, 0.0),
    vec3(0.0, 1.0, 0.0),
    vec3(0.0, 0.0, 1.0),
    vec3(0.0, 1.0, 1.0)
  ];

  var theta = 0.0;

  //  Configure WebGL
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
  
  //  Load shaders and initialize attribute buffers
  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  var vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  var colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

  var vColor = gl.getAttribLocation(program, "vColor");
  gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vColor);

  var thetaLocation = gl.getUniformLocation(program, "theta");
  gl.uniform1f(thetaLocation, theta);

  function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    theta += 0.1;
    gl.uniform1f(thetaLocation, theta);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, points.length);

    requestAnimFrame(render);
  }

  render();
};

init();