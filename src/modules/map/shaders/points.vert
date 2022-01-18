// vertice shader for point particles

attribute float size;
varying vec3 vColor;
attribute float visible;
varying float vVisible;

void main() {
    // sets props based on geometry properties
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vVisible = visible;
    gl_PointSize = size * (1.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
}
