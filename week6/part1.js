var toggleTeapotButton = document.getElementById('toggle-teapot');
var toggleQuadsButton = document.getElementById('toggle-light');
var canvas = document.getElementById("gl-canvas");

var earthImage = document.createElement('img');
earthImage.onload = init;
earthImage.src = 'earth.jpg';


function init() {
    var light = vec3(0, 2, 2);
    var at = vec3(0, -1, -10);
    var eye = vec3(0, 2, 2);
    var up = vec3(0, 1, 0);
    var fovy = 90;
    var aspect = canvas.width / canvas.height;
    var near = 0.1;
    var far = 30;
    
    var viewMatrix = lookAt(eye, at, up);
    var projectionMatrix = perspective(fovy, aspect, near, far);
    
    var rectangleCorners = [
        vec3(-4, -1, -1),
        vec3(4, -1, -1), 
        vec3(4, -1, -21), 
        vec3(-4, -1, -21) 
    ];
    
    // 􏰀􏰁1.5, 0.0􏰂, 􏰀2.5, 0.0􏰂, 􏰀2.5, 10.0􏰂, 􏰀􏰁1.5, 10.0􏰂 
    
    var rectangleTextureCoords = [
        vec2(1.5, 0.0),
        vec2(2.5, 0.0),
        vec2(2.5, 10.0),
        vec2(1.5, 10.0)
    ];
    
    var rectangleIndices = [0, 1, 2, 0, 2, 3];

    var positions = rectangleIndices.map(function (i) { return rectangleCorners[i] });
    var textureCoords = rectangleIndices.map(function (i) { return rectangleTextureCoords[i] });

    var gl = WebGLUtils.setupWebGL(canvas);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    var program = initShaders(gl, '/week6/part1.vert', '/week6/part1.frag');

    // Setup shader and buffer data
    gl.useProgram(program);
    var programInfo = {
        a_position_model: {
            location: gl.getAttribLocation(program, 'a_position_model'),
            buffer: gl.createBuffer()
        },
        a_textureCoords: {
            location: gl.getAttribLocation(program, 'a_textureCoords'),
            buffer: gl.createBuffer()
        },
        u_mvp: gl.getUniformLocation(program, 'u_mvp'),
        u_texture: gl.getUniformLocation(program, 'u_texture'),
        u_eye_camera: gl.getUniformLocation(program, 'u_eye_camera'),
        u_light_camera: gl.getUniformLocation(program, 'u_light_camera')
    };

    gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.a_position_model.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.a_textureCoords.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(textureCoords), gl.STATIC_DRAW);
    
    var earthTexture = createCheckerboardTexture(gl, 8, 8);
    gl.uniform1i(programInfo.u_texture, 0);
    gl.uniform3fv(programInfo.u_light_camera, flatten(normalize(matrixVectorMult(projectionMatrix, light))));
    
    createSegmentButtons('wrapping', 'repeat', {
        repeat: function () {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        },
        clamp: function () {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        }
    });
    
    createSegmentButtons('filtering', 'nearest', {
        nearest: function () {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        },
        linear: function () {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        },
        mipmapNN: function () {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST_MIPMAP_NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
        },
        mipmapLN: function () {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR_MIPMAP_NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        },
        mipmapNL: function () {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
        },
        mipmapLL: function () {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        }
    });
    
    requestAnimationFrame(function render() {
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

function createSegmentButtons(klass, def, handlers) {
    var buttons = Array.prototype.slice.call(document.getElementsByClassName(klass));
    buttons.forEach(function (button) {
        button.addEventListener('click', function () {
            button.disabled = true;
            buttons.forEach(function (otherButton) {
                if (button !== otherButton) {
                    otherButton.disabled = false;
                }
            });
            handlers[button.id]();
        });
        if (button.id === def) {
            button.click();
        }
    });
}

function createCheckerboardTexture(gl, rows, columns) {
    var size = rows * columns;
    var texels = new Uint8Array(4 * size * size)

    for (var i = 0; i < size; i++) {
        for (var j = 0; j < size; j++) {
            var patchX = Math.floor(i / (size / rows));
            var patchY = Math.floor(j / (size / columns));
            var color = (patchX % 2 !== patchY % 2 ? 255 : 0);
            var offset = 4 * i * size + 4 * j;
            texels[offset + 0] = color;
            texels[offset + 1] = color;
            texels[offset + 2] = color;
            texels[offset + 3] = 255;
        }
    }
    
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, texels);
    gl.generateMipmap(gl.TEXTURE_2D);

    return texture;
}

function create2DTexture(gl, image) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    var ext = gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic");
    var max_anisotropy = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
    gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, max_anisotropy);
    return texture;
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
    
    gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.a_textureCoords.buffer);
    gl.enableVertexAttribArray(programInfo.a_textureCoords.location);
    gl.vertexAttribPointer(programInfo.a_textureCoords.location, 2, gl.FLOAT, false, 0, 0);
}