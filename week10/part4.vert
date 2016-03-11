precision mediump float;

attribute vec4 a_position;

varying vec3 v_textureCoords;

uniform mat4 u_mvp, u_mtex;

void main() {
    v_textureCoords = (u_mtex * a_position).xyz;
    gl_Position = u_mvp * a_position;
}
