precision mediump float;

varying vec4 v_position_camera;

void main() {
    float z = normalize(v_position_camera).z;
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
