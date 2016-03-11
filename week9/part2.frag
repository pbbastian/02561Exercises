precision mediump float;

varying vec2 v_textureCoords;
varying vec4 v_position;

uniform sampler2D u_texture, u_shadow;
uniform mat4 u_depthMVP;

void main() {
    vec3 depth = (v_position.xyz / (v_position.w)) * 0.5 + 0.5;
    float shadowValue = texture2D(u_shadow, depth.xy).r;
    float shadow = 1.0;
    if (shadowValue < depth.z) {
        shadow = 0.5;
    }
    vec4 color = texture2D(u_texture, v_textureCoords) * shadow;
    color.a = 0.8;
    gl_FragColor = color;
}
