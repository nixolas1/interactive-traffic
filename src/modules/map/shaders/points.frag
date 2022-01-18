// fragment shader for the point particles
uniform sampler2D texture;
varying vec3 vColor;
varying float vVisible;

void main() {

    // only show active particles
    if (vVisible > 0.0) {
        gl_FragColor = vec4( vColor, 1.0 );
        gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );
    }
    else {
        discard;
    }
}
