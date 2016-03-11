precision mediump float;

varying vec4 v_textureCoords;

uniform samplerCube u_texture;

void main() {
    gl_FragColor = textureCube(u_texture, v_textureCoords.xyz);
}
