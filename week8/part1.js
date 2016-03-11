var toggleTeapotButton = document.getElementById('toggle-teapot');
var toggleQuadsButton = document.getElementById('toggle-light');
var canvas = document.getElementById("gl-canvas", { alpha: false });
var groundImage = document.createElement('img');
groundImage.onload = init;
groundImage.src = '/xamp23.png';

// positions: [
//     vec3(-2, -1, -1),
//     vec3(2, -1, -1),
//     vec3(2, -1, -5),
//     vec3(-2, -1, -1),
//     vec3(2, -1, -5),
//     vec3(-2, -1, -5)
// ],
// textureCoords: [
//     vec2(0, 0),
//     vec2(1, 0),
//     vec2(1, 1),
//     vec2(0, 0),
//     vec2(1, 1),
//     vec2(0, 1)
// ],

function init() {
    var floor = {
        positions: [
            vec3(-2, -1, -1),
            vec3(2, -1, -1),
            vec3(2, -1, -5),
            vec3(-2, -1, -1),
            vec3(2, -1, -5),
            vec3(-2, -1, -5)
        ],
        textureCoords: [
            vec2(0, 0),
            vec2(1, 0),
            vec2(1, 1),
            vec2(0, 0),
            vec2(1, 1),
            vec2(0, 1)
        ],
        normals: [
            vec3(0, 1, 0),
            vec3(0, 1, 0),
            vec3(0, 1, 0),
            vec3(0, 1, 0),
            vec3(0, 1, 0),
            vec3(0, 1, 0)
        ]
    };
    
    var at = vec3(0, 0, -3);
    var eye = vec3(4, 4, 0);
    var up = vec3(0, 1, 0);
    var fovy = 45;
    var aspect = canvas.width / canvas.height;
    var near = 0.1;
    var far = 30;
    var light = vec3(0.0, 2.0, -2.0);
    
    var viewMatrix = lookAt(eye, at, up);
    var aboveViewMatrix = lookAt(vec3(1, 6, -3), at, up);
    // viewMatrix = aboveViewMatrix;
    var projectionMatrix = perspective(fovy, aspect, near, far);
    var shadowProjectionMatrix = mat4();
    shadowProjectionMatrix[3][3] = 0;
    shadowProjectionMatrix[3][1] = -1/light[1];
    
    var teapotFile = loadFileAJAX('teapot.obj');
    var teapot = new OBJDoc('teapot.obj');
    teapot.parse(teapotFile, 0.25, false);

    var positions = [].concat(floor.positions);
    var textureCoords = [].concat(floor.textureCoords);
    var normals = new Array(6).fill(vec3(0, 0, 0));
    
    for (var i = 0; i < teapot.objects[0].faces.length; i++) {
        var face = teapot.objects[0].faces[i];
        for (var j = 0; j < 3; j++) {
            var vertex = teapot.vertices[face.vIndices[j]];
            var normal = teapot.normals[face.nIndices[j]];
            positions.push(vec3(vertex.x, vertex.y, vertex.z));
            normals.push(vec3(normal.x, normal.y, normal.z));
            textureCoords.push(vec3(0, 0, 0));
        }
    }

    var gl = WebGLUtils.setupWebGL(canvas);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    var phongProgram = initShaders(gl, '/week8/phong1.vert', '/week8/phong1.frag');
    var program = initShaders(gl, '/week8/part1.vert', '/week8/part1.frag');

    // Setup shader and buffer data
    gl.useProgram(program);
    var programInfo = {
        a_position: {
            location: gl.getAttribLocation(program, 'a_position'),
            buffer: gl.createBuffer()
        },
        a_textureCoords: {
            location: gl.getAttribLocation(program, 'a_textureCoords'),
            buffer: gl.createBuffer()
        },
        u_modelView: gl.getUniformLocation(program, 'u_modelView'),
        u_projection: gl.getUniformLocation(program, 'u_projection'),
        u_texture: gl.getUniformLocation(program, 'u_texture')
    };

    gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.a_position.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.a_textureCoords.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(textureCoords), gl.STATIC_DRAW);
    
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
        u_light_world: gl.getUniformLocation(phongProgram, 'u_light_world')
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, phongInfo.a_position_model.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, phongInfo.a_normal_model.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);
    
    gl.uniformMatrix4fv(phongInfo.u_projection, false, flatten(projectionMatrix));

    gl.useProgram(program);
    createTextures(gl, groundImage);
    gl.uniformMatrix4fv(programInfo.u_projection, false, flatten(projectionMatrix));
    
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
        theta += moveLight ? 0.01 : 0;
        
        light[0] = Math.sin(theta)*2;
        light[2] = Math.cos(theta)*2 - 2;
        
        var teapotModelMatrix = translate(0, - 0.75 - 0.25 * Math.sin(phi), -3);
        var teapotModelViewMatrix = mult(viewMatrix, teapotModelMatrix);
        
        var shadowMatrix = mult(viewMatrix, translate(light[0], light[1] - 1.001, light[2]));
        shadowMatrix = mult(shadowMatrix, shadowProjectionMatrix);
        shadowMatrix = mult(shadowMatrix, translate(-light[0], -(light[1] - 1.001), -light[2]));
        shadowMatrix = mult(shadowMatrix, teapotModelMatrix);
        
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.useProgram(program);
        enableProgram(gl, programInfo);
        gl.depthFunc(gl.LESS);
        gl.uniformMatrix4fv(programInfo.u_modelView, false, flatten(viewMatrix));
        
        gl.uniform1i(programInfo.u_texture, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        
        gl.depthFunc(gl.GREATER);
        gl.uniformMatrix4fv(programInfo.u_modelView, false, flatten(shadowMatrix));
        gl.uniform1i(programInfo.u_texture, 2);
        gl.drawArrays(gl.TRIANGLES, 6, positions.length - 6);
        
        gl.depthFunc(gl.LESS);
        gl.useProgram(phongProgram);
        enablePhongProgram(gl, phongInfo);
        gl.uniformMatrix4fv(phongInfo.u_modelView, false, flatten(teapotModelViewMatrix));
        gl.uniformMatrix4fv(phongInfo.u_normal, false, flatten(transpose(inverse4(teapotModelViewMatrix))));
        gl.uniform3fv(phongInfo.u_light_world, flatten(light));
        
        gl.drawArrays(gl.TRIANGLES, 6, positions.length - 6);
        
        requestAnimationFrame(render);
    })


}

function createTextures(gl, groundImage) {
    gl.activeTexture(gl.TEXTURE0);
    var groundTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, groundTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, groundImage);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    gl.activeTexture(gl.TEXTURE1);
    var redTexture = gl.createTexture();
    var redImage = new Uint8Array([255, 0, 0]);
    gl.bindTexture(gl.TEXTURE_2D, redTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, redImage);

    gl.activeTexture(gl.TEXTURE2);
    var blackTexture = gl.createTexture();
    var blackImage = new Uint8Array([0, 0, 0, 200]);
    gl.bindTexture(gl.TEXTURE_2D, blackTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, blackImage);
}

function enableProgram(gl, programInfo) {
    gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.a_position.buffer);
    gl.enableVertexAttribArray(programInfo.a_position.location);
    gl.vertexAttribPointer(programInfo.a_position.location, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.a_textureCoords.buffer);
    gl.enableVertexAttribArray(programInfo.a_textureCoords.location);
    gl.vertexAttribPointer(programInfo.a_textureCoords.location, 2, gl.FLOAT, false, 0, 0);
}

function enablePhongProgram(gl, phongInfo) {
    gl.bindBuffer(gl.ARRAY_BUFFER, phongInfo.a_position_model.buffer);
    gl.enableVertexAttribArray(phongInfo.a_position_model.location);
    gl.vertexAttribPointer(phongInfo.a_position_model.location, 3, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, phongInfo.a_normal_model.buffer);
    gl.enableVertexAttribArray(phongInfo.a_normal_model.location);
    gl.vertexAttribPointer(phongInfo.a_normal_model.location, 3, gl.FLOAT, false, 0, 0);
}