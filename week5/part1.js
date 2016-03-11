var toggleTeapotButton = document.getElementById('toggle-teapot');
var toggleQuadsButton = document.getElementById('toggle-light');
var canvas = document.getElementById("gl-canvas", { alpha: false });
var groundImage = document.createElement('img');
groundImage.onload = init;
groundImage.src = '/xamp23.png';

function init() {
    var at = vec3(0, 0.5, 0);
    var eye = vec3(0, 2, 2);
    var up = vec3(0, 1, 0);
    var fovy = 45;
    var aspect = canvas.width / canvas.height;
    var near = 0.1;
    var far = 30;
    var light = vec3(0.0, 2.0, 2.0);
    
    var viewMatrix = lookAt(eye, at, up);
    var projectionMatrix = perspective(fovy, aspect, near, far);
    
    var teapotFile = loadFileAJAX('teapot.obj');
    var teapot = new OBJDoc('teapot.obj');
    teapot.parse(teapotFile, 0.25, false);

    var positions = [];
    var normals = [];
    
    for (var i = 0; i < teapot.objects[0].faces.length; i++) {
        var face = teapot.objects[0].faces[i];
        for (var j = 0; j < 3; j++) {
            var vertex = teapot.vertices[face.vIndices[j]];
            var normal = teapot.normals[face.nIndices[j]];
            positions.push(vec3(vertex.x, vertex.y, vertex.z));
            normals.push(vec3(normal.x, normal.y, normal.z));
        }
    }

    var gl = WebGLUtils.setupWebGL(canvas);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    // gl.enable(gl.CULL_FACE);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    var phongProgram = initShaders(gl, '/week5/phong1.vert', '/week5/phong1.frag');
    var program = initShaders(gl, '/week5/part1.vert', '/week5/part1.frag');
    
    // SETUP AND BUFFER PHONG SHADER    
    gl.useProgram(phongProgram);
    
    var phongInfo = {
        a_position_model: {
            location: gl.getAttribLocation(phongProgram, 'a_position_model'),
            buffer: gl.createBuffer()
        },
        a_normal_model: {
            location: gl.getAttribLocation(phongProgram, 'a_normal_model'),
            buffer: gl.createBuffer()
        },
        u_modelView: gl.getUniformLocation(phongProgram, 'u_modelView'),
        u_projection: gl.getUniformLocation(phongProgram, 'u_projection'),
        u_normal: gl.getUniformLocation(phongProgram, 'u_normal'),
        u_light_world: gl.getUniformLocation(phongProgram, 'u_light_world'),
        u_light_camera: gl.getUniformLocation(phongProgram, 'u_light_camera')
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, phongInfo.a_position_model.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, phongInfo.a_normal_model.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);
    
    gl.uniformMatrix4fv(phongInfo.u_projection, false, flatten(projectionMatrix));
    
    var moveTeapot = true;
    var moveLight = true;
    var phi = 0;
    var theta = 0;
    
    toggleTeapotButton.addEventListener('click', function() {
        moveTeapot = !moveTeapot;
    });
    
    toggleQuadsButton.addEventListener('click', function() {
        moveLight = !moveLight;
    });
    
    requestAnimationFrame(function render() {
        phi += moveTeapot ? 0.02 : 0;
        theta += moveLight ? 0.02 : 0;
        
        light[0] = Math.sin(theta)*2;
        light[2] = Math.cos(theta)*2;
        
        var teapotModelMatrix = translate(0, 0.25 + 0.25 * Math.sin(phi), 0);
        var teapotModelViewMatrix = mult(viewMatrix, teapotModelMatrix);
        
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.useProgram(phongProgram);
        enablePhongProgram(gl, phongInfo);
        gl.uniformMatrix4fv(phongInfo.u_modelView, false, flatten(teapotModelViewMatrix));
        gl.uniformMatrix4fv(phongInfo.u_normal, false, flatten(transpose(inverse4(teapotModelViewMatrix))));
        gl.uniform3fv(phongInfo.u_light_world, flatten(light));
        gl.uniform3fv(phongInfo.u_light_camera, flatten(matrixVectorMult(mult(projectionMatrix, viewMatrix), light)));
        
        gl.drawArrays(gl.TRIANGLES, 6, positions.length - 6);
        
        requestAnimationFrame(render);
    });
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

function enablePhongProgram(gl, phongInfo) {
    gl.bindBuffer(gl.ARRAY_BUFFER, phongInfo.a_position_model.buffer);
    gl.enableVertexAttribArray(phongInfo.a_position_model.location);
    gl.vertexAttribPointer(phongInfo.a_position_model.location, 3, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, phongInfo.a_normal_model.buffer);
    gl.enableVertexAttribArray(phongInfo.a_normal_model.location);
    gl.vertexAttribPointer(phongInfo.a_normal_model.location, 3, gl.FLOAT, false, 0, 0);
}