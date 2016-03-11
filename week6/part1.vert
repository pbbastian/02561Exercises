precision mediump float;

attribute vec4 a_position_model;
attribute vec2 a_textureCoords;

varying vec2 v_textureCoords;

uniform mat4 u_mvp;

void main() {
    v_textureCoords = a_textureCoords;
    gl_Position = u_mvp * a_position_model;
}
