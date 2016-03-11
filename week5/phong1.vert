precision mediump float;

attribute vec3 a_position_model, a_normal_model;

varying vec3 v_normal_camera, v_eye_camera;

uniform mat4 u_normal, u_modelView, u_projection;
uniform vec3 u_light_world;

void main() {
    vec4 position_camera = (u_modelView * vec4(a_position_model, 1.0));
    v_eye_camera = position_camera.xyz / position_camera.w;
    v_normal_camera = (u_normal * vec4(a_normal_model, 0)).xyz;
    
    gl_Position = u_projection * u_modelView * vec4(a_position_model, 1.0);
}
