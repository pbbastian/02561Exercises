precision mediump float;

attribute vec4 a_position_model;

varying vec4 v_position_model, v_position_camera;

uniform mat4 u_mvp;

void main() {
    v_position_model = a_position_model;
    v_position_camera = (u_mvp * a_position_model);
    gl_Position = u_mvp * a_position_model;
}
