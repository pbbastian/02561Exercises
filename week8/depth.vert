precision mediump float;

attribute vec4 a_position;

varying vec4 v_position_camera;

uniform mat4 u_modelView, u_projection;

void main() {
    vec4 position_camera = u_projection * u_modelView * a_position;
    v_position_camera = position_camera; 
    gl_Position = position_camera;
}
