precision mediump float;

attribute vec4 a_position;
attribute vec3 a_normal;

varying vec3 v_normal;

uniform mat4 u_modelView, u_projection;

void main() {
    v_normal = a_normal;
    gl_Position = u_projection * u_modelView * a_position;
}
