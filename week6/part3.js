var toggleTeapotButton = document.getElementById('toggle-teapot');
var toggleQuadsButton = document.getElementById('toggle-light');
var canvas = document.getElementById("gl-canvas");

var earthImage = document.createElement('img');
earthImage.onload = init;
earthImage.src = 'earth.jpg';


function init() {
    var light = vec3(0, 2, 2);
    var at = vec3(0, 0, 0);
    var eye = vec3(0, 1, 2);
    var up = vec3(0, 1, 0);
    var fovy = 65;
    var aspect = canvas.width / canvas.height;
    var near = 0.1;
    var far = 30;
    
    var viewMatrix = lookAt(eye, at, up);
    var projectionMatrix = perspective(fovy, aspect, near, far);
    
    var tetrahedron = generateTetrahedron(6);

    var positions = [].concat(tetrahedron);

    var gl = WebGLUtils.setupWebGL(canvas);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    var program = initShaders(gl, '/week6/part3.vert', '/week6/part3.frag');

    // Setup shader and buffer data
    gl.useProgram(program);
    var programInfo = {
        a_position_model: {
            location: gl.getAttribLocation(program, 'a_position_model'),
            buffer: gl.createBuffer()
        },
        u_mvp: gl.getUniformLocation(program, 'u_mvp'),
        u_texture: gl.getUniformLocation(program, 'u_texture'),
        u_eye_camera: gl.getUniformLocation(program, 'u_eye_camera'),
        u_light_camera: gl.getUniformLocation(program, 'u_light_camera')
    };

    gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.a_position_model.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);
    
    var earthTexture = create2DTexture(gl, earthImage);
    gl.uniform1i(programInfo.u_texture, 0);
    gl.uniform3fv(programInfo.u_light_camera, flatten(normalize(matrixVectorMult(projectionMatrix, light))));
    
    var phi = 0;
    
    requestAnimationFrame(function render() {
        phi += 0.01;
        
        eye[0] = Math.sin(phi) * 2;
        eye[2] = Math.cos(phi) * 2;
        viewMatrix = lookAt(eye, at, up);
        
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // DRAW PLANE
        gl.useProgram(program);
        enableProgram(gl, programInfo);
        gl.uniform3fv(programInfo.u_eye_camera, flatten(normalize(matrixVectorMult(projectionMatrix, eye))));
        
        gl.uniformMatrix4fv(programInfo.u_mvp, false, flatten(mult(projectionMatrix, viewMatrix)));
        gl.drawArrays(gl.TRIANGLES, 0, positions.length);
        
        requestAnimationFrame(render);
    })


}

function create2DTexture(gl, image) {
    var ext = gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic");
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // gl.generateMipmap(gl.TEXTURE_2D);
    var max_anisotropy = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
    gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, max_anisotropy);
    return texture;
}

function divideTriangle (points, subdivs, a, b, c) {
  if (subdivs > 0) {
    var ab = normalize(mix(a, b, 0.5));
    var ac = normalize(mix(a, c, 0.5));
    var bc = normalize(mix(b, c, 0.5));

    subdivs -= 1;
    divideTriangle(points, subdivs, a, ab, ac);
    divideTriangle(points, subdivs, ab, b, bc);
    divideTriangle(points, subdivs, bc, c, ac);
    divideTriangle(points, subdivs, ab, bc, ac);
  } else {
    points.push(a);
    points.push(b);
    points.push(c);
  }
}

function generateTetrahedron (subdivs) {
    var a = vec3(0.0, 0.0, -1.0);
    var b = vec3(0.0, 0.942809, 0.333333);
    var c = vec3(-0.816497, -0.471405, 0.333333);
    var d = vec3(0.816497, -0.471405, 0.333333);
    var points = [];
    divideTriangle(points, subdivs, a, b, c);
    divideTriangle(points, subdivs, d, c, b);
    divideTriangle(points, subdivs, a, d, b);
    divideTriangle(points, subdivs, a, c, d);
    return points;
}

function matrixVectorMult(A, x) {
    var Ax = [];
    for (var i = 0; i < x.length; i++) {
        var sum = 0;
        for (var j = 0; j < x.length; j++) {
            sum += A[j][i] * x[i];
        }
        Ax.push(sum);
    }
    // AND MY
    return Ax;
}

function enableProgram(gl, programInfo) {
    gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.a_position_model.buffer);
    gl.enableVertexAttribArray(programInfo.a_position_model.location);
    gl.vertexAttribPointer(programInfo.a_position_model.location, 3, gl.FLOAT, false, 0, 0);
}