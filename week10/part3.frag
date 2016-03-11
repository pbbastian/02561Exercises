precision mediump float;

varying vec3 v_textureCoords;

uniform samplerCube u_texture;
uniform vec3 u_eye_world;
uniform bool u_reflective;

void main() {
    vec3 textureCoords = v_textureCoords;
    if (u_reflective) {
        vec3 incident = v_textureCoords - u_eye_world;
        vec3 reflected = reflect(incident, v_textureCoords);
        textureCoords = reflected;
    }
    gl_FragColor = textureCube(u_texture, textureCoords);
}
