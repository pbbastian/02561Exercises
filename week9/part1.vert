precision mediump float;

attribute vec4 a_position;
attribute vec2 a_textureCoords;

varying vec2 v_textureCoords;
varying vec4 v_position;

uniform mat4 u_modelView, u_projection;
uniform mat4 u_depthMVP;

void main() {
    v_textureCoords = a_textureCoords;
    v_position = u_depthMVP * a_position;
    gl_Position = u_projection * u_modelView * a_position;
}
