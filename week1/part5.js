var gl;

function init() {
  var canvas = document.getElementById("gl-canvas");
  
  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) { alert("WebGL isn't available"); }

  var points = [
    vec3(0, 0, 0)
  ];

  var colors = [
    vec3(1, 1, 1)
  ];

  var numberOfSides = 100;

  var radius = 0.5;

  for (var i = 0; i <= numberOfSides; i++) {
    var point = vec3(
      radius * Math.cos((2 * Math.PI * i) / numberOfSides),
      radius * Math.sin((2 * Math.PI * i) / numberOfSides));
    var color = vec3(Math.random(), Math.random(), Math.random());
    points.push(point);
    colors.push(color);
  }

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
    theta = (Date.now() / 1000) % (Math.PI * 2);
    gl.uniform1f(thetaLocation, theta);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, points.length);

    requestAnimFrame(render);
  }

  render();
};

init();