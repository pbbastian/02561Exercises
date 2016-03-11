var canvas = document.getElementById("gl-canvas");
var groundImage = document.createElement('img');
groundImage.onload = init;
groundImage.src = '/xamp23.png';

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
        ]
    };
    var floating = {
        positions: [
            vec3(0.25, -0.5, -1.25),
            vec3(0.75, -0.5, -1.25),
            vec3(0.75, -0.5, -1.75),
            vec3(0.25, -0.5, -1.25),
            vec3(0.75, -0.5, -1.75),
            vec3(0.25, -0.5, -1.75)
        ],
        textureCoords: new Array(6).fill(0, 0, 6)
    };
    var wall = {
        positions: [
            vec3(-1, 0, -2.5),
            vec3(-1, -1, -2.5),
            vec3(-1, -1, -3),
            vec3(-1, 0, -2.5),
            vec3(-1, 0, -3),
            vec3(-1, -1, -3)
        ],
        textureCoords: new Array(6).fill(0, 0, 6)
    };
    
    var at = vec3(0, 0, -3);
    var eye = vec3(6, 6, 0);
    var up = vec3(0, 1, 0);
    var fovy = 45;
    var aspect = canvas.width / canvas.height;
    var near = 0.1;
    var far = 30;
    var light = vec3(0.0, 2.0, -2.0);
    
    var modelViewMatrix = lookAt(eye, at, up);
    var projectionMatrix = perspective(fovy, aspect, near, far);
    var shadowProjectionMatrix = mat4();
    shadowProjectionMatrix[3][3] = 0;
    shadowProjectionMatrix[3][1] = -1/light[1];

    var positions = [].concat(floor.positions, floating.positions, wall.positions);
    var textureCoords = [].concat(floor.textureCoords, floating.textureCoords, wall.textureCoords);

    var gl = WebGLUtils.setupWebGL(canvas);
    var program = initShaders(gl, '/week7/part2.vert', '/week7/part2.frag');

    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Setup shader and buffer data
    gl.useProgram(program);
    var u_modelView = gl.getUniformLocation(program, 'u_modelView');
    var u_projection = gl.getUniformLocation(program, 'u_projection');
    var u_texture = gl.getUniformLocation(program, 'u_texture');

    var a_position = {
        location: gl.getAttribLocation(program, 'a_position'),
        buffer: gl.createBuffer()
    };
    gl.bindBuffer(gl.ARRAY_BUFFER, a_position.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(a_position.location);
    gl.vertexAttribPointer(a_position.location, 3, gl.FLOAT, false, 0, 0);

    var a_textureCoords = {
        location: gl.getAttribLocation(program, 'a_textureCoords'),
        buffer: gl.createBuffer()
    };
    gl.bindBuffer(gl.ARRAY_BUFFER, a_textureCoords.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(textureCoords), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(a_textureCoords.location);
    gl.vertexAttribPointer(a_textureCoords.location, 2, gl.FLOAT, false, 0, 0);

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
    var blackImage = new Uint8Array([0, 0, 0]);
    gl.bindTexture(gl.TEXTURE_2D, blackTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, blackImage);

    gl.uniformMatrix4fv(u_projection, false, flatten(projectionMatrix));
    
    var theta = 0;
    var previousTime = null;
    requestAnimationFrame(function render(currentTime) {
        if (previousTime === null) {
            previousTime = currentTime;
        }
        
        var delta = currentTime - previousTime;
        previousTime = currentTime;
        theta += 0.01;
        
        var rotationMatrix = rotateY(10);
        light[0] = Math.sin(theta)*2;
        light[2] = Math.cos(theta)*2 - 2;
        
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.uniformMatrix4fv(u_modelView, false, flatten(modelViewMatrix));
        gl.uniform1i(u_texture, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.uniform1i(u_texture, 1);
        gl.drawArrays(gl.TRIANGLES, 6, 6*2);
        
        var shadowMatrix = mult(modelViewMatrix, translate(light[0], light[1] - 0.999, light[2]));
        shadowMatrix = mult(shadowMatrix, shadowProjectionMatrix);
        shadowMatrix = mult(shadowMatrix, translate(-light[0], -(light[1] - 0.999), -light[2]));
        
        gl.uniformMatrix4fv(u_modelView, false, flatten(shadowMatrix));
        gl.uniform1i(u_texture, 2);
        gl.drawArrays(gl.TRIANGLES, 6, 6*2);
        
        requestAnimationFrame(render);
    })


}