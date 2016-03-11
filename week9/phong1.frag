precision mediump float;

varying vec3 v_normal_camera, v_eye_camera, v_light_camera;

void main() {
    vec3 n = normalize(v_normal_camera);
    vec3 l = normalize(v_light_camera);
    vec3 e = normalize(v_eye_camera);
    vec3 r = normalize(2.0 * dot(l, n) * n - l);

    // Pearl material
    vec3 ka = vec3(0.25, 0.20725, 0.20725);
    vec3 ks = vec3(0.296648, 0.296648, 0.296648);
    vec3 kd = vec3(1, 0.829, 0.829);
    float shininess = 11.264;
    
    vec3 ambient = ka;
    
    float cosAngle = dot(l, n);
    vec3 diffuse = kd * max(cosAngle, 0.0);

    vec3 specular = ks * pow(max(dot(r, e), 0.0), shininess);

    if (cosAngle < 0.0) {
        specular = vec3(0.0);
    }

    gl_FragColor = vec4((ambient + diffuse + specular), 1.0);
}
