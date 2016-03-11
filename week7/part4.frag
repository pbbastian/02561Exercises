precision mediump float;

varying vec4 v_color;
varying vec2 v_textureCoords;

uniform sampler2D u_texture;

void main() {
    gl_FragColor = texture2D(u_texture, v_textureCoords);
}
