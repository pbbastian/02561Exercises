precision mediump float;

attribute vec4 a_position;
attribute vec4 a_color;
attribute vec2 a_textureCoords;

varying vec4 v_color;
varying vec2 v_textureCoords;

uniform mat4 u_modelView, u_projection;

void main() {
    v_color = a_color;
    v_textureCoords = a_textureCoords;
    gl_Position = u_projection * u_modelView * a_position;
}
