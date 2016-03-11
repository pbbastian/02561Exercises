precision mediump float;

varying vec4 v_position_model, v_position_camera;

uniform sampler2D u_texture;
uniform vec3 u_eye_camera;
uniform vec3 u_light_camera;

float atan2(float y, float x) {
  return 2.0 * atan((length(vec2(x, y)) - x) / y);
}

void main() {
    float pi = 3.1415926;
    vec3 normal = normalize(v_position_model.xyz);
    float u = 0.5 + atan2(normal.z, - normal.x) / (2.0 * pi);
    float v = 0.5 - (asin(normal.y) / pi);
    
    vec4 ka = vec4(0.5, 0.5, 0.5, 1.0);
    vec4 kd = vec4(1.0, 1.0, 1.0, 1.0);
    
    vec3 n = normal;
    vec3 l = normalize(u_light_camera);
    vec3 e = normalize(u_eye_camera);
    vec3 r = normalize(2.0 * dot(l, n) * n - l);
    
    vec4 ambient = ka;
    float cosAngle = dot(l, n);
    vec4 diffuse = kd * max(cosAngle, 0.0);
    
    gl_FragColor = (ambient + diffuse) * texture2D(u_texture, vec2(u, v));
}
