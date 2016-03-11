precision mediump float;

varying vec3 v_textureCoords;

uniform samplerCube u_texture;
uniform sampler2D u_normal;
uniform vec3 u_eye_world;
uniform bool u_reflective;

float atan2(float y, float x) {
  return 2.0 * atan((length(vec2(x, y)) - x) / y);
}

vec3 rotate_to_normal(vec3 normal, vec3 v) {
    float a = 1.0/(1.0 + normal.z);
    float b = -normal.x*normal.y*a;
    return vec3(1.0 - normal.x*normal.x*a, b, -normal.x)*v.x
        + vec3(b, 1.0 - normal.y*normal.y*a, -normal.y)*v.y
        + normal*v.z;
}

void main() {
    float pi = 3.1415926;
    vec3 position_world = v_textureCoords;
    vec3 normal = v_textureCoords;
    vec3 textureCoords = v_textureCoords;
    if (u_reflective) {
        float u = 0.5 + atan2(normal.z, - normal.x) / (2.0 * pi);
        float v = 0.5 - (asin(normal.y) / pi);
        vec3 normal_tangent = texture2D(u_normal, vec2(u, v)).xyz * 2.0 - 1.0;
        normal = rotate_to_normal(normal, normal_tangent);
        vec3 incident = position_world - u_eye_world;
        normal = reflect(incident, normal);
        gl_FragColor = textureCube(u_texture, normal);
    } else {
        gl_FragColor = textureCube(u_texture, textureCoords);
    }
}
