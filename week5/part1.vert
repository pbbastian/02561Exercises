precision mediump float;

attribute vec4 a_position;
attribute vec2 a_textureCoords;

varying vec2 v_textureCoords;

uniform mat4 u_modelView, u_projection;

void main() {
    v_textureCoords = a_textureCoords;
    gl_Position = u_projection * u_modelView * a_position;
}
