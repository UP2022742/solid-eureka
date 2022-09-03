import * as gm from './gl-matrix-min.js';

const canvas = document.getElementById('canvas');

/** @type {WebGLRenderingContext} */
const gl = canvas.getContext('webgl');
const mat4 = glMatrix.mat4;

if(!gl) throw new Error("WebGL not supported");

// Vertex position data.
const vertexData = new Float32Array([
    0.0, 0.5, 0.0,
    -0.433, -0.25, 0.0,
    0.433, -0.25, 0.0
]);

// Vertex colour data.
const colorData = new Float32Array([
    1, 0, 0,    // V1.color
    0, 1, 0,    // V2.color
    0, 0, 1,    // V3.color
]);

const positionBuffer = gl.createBuffer(); // Create a buffer for the position data.
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer); // Bind empty empty buffer to ARRAY_BUFFER
gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW); // Pass vertex data to buffer
gl.bindBuffer(gl.ARRAY_BUFFER, null); // Good practice, but still unnecessary call to GPU.

const colourBuffer = gl.createBuffer(); // Create a buffer for the colour data
gl.bindBuffer(gl.ARRAY_BUFFER, colourBuffer); // Bind empty buffer to ARRAY_BUFFER
gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW); // Pass colour data to buffer
gl.bindBuffer(gl.ARRAY_BUFFER, null); // Good practice, but still unnecessary call to GPU.

// Like a mini program that runs on the GPU. Need to give it some code to run.
const vertexShader = gl.createShader(gl.VERTEX_SHADER);

// gl_position is the output of the vertex shader. Outputs x,y,z coordinates of the vertex.
// to apply transformations, the best place for this is in the vertex shader.
// unform is a global variable that can be accessed by all shaders (CPU AND GPU)
gl.shaderSource(vertexShader, `
    #pragma vscode_glsllint_stage: vert

    precision mediump float;
    attribute vec3 position;
    attribute vec3 colour;
    varying vec3 vColour;
    uniform mat4 matrix;
    void main() {
        vColour = colour;
        gl_Position = matrix * vec4(position, 1);
    }
`);
gl.compileShader(vertexShader);


// Takes an input (or hard coded) and output a colour
const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, `
    #pragma vscode_glsllint_stage: frag

    precision mediump float;
    varying vec3 vColour;
    void main(){
        gl_FragColor = vec4(vColour, 1.0);
    }
`)
gl.compileShader(fragmentShader);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);

gl.linkProgram(program);

// Only do this if there is an error because getting program information is expensive.
if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
    throw new Error("Program failed to link: " + gl.getProgramInfoLog(program));
}


// Vertex attributes refers to vertex metadata; coordiantes, normal, colour.
// Attributes go in the vertex shader.

const positionLocation = gl.getAttribLocation(program, 'position'); // Name of defined attribute in the vertex shader, in this case it's position. return a number that WebGL has assigned to the attribute.
gl.enableVertexAttribArray(positionLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0); // Which attribute, how many components (x,y,z), type of data, normalize, stride, offset

const colourLocation = gl.getAttribLocation(program, 'colour'); // Name of defined attribute in the vertex shader, in this case it's colour. return a number that WebGL has assigned to the attribute.
gl.enableVertexAttribArray(colourLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, colourBuffer);
gl.vertexAttribPointer(colourLocation, 3, gl.FLOAT, false, 0, 0); // Which attribute, how many components (x,y,z), type of data, normalize, stride, offset

gl.useProgram(program); // Create an executable program on the GPU.


const uniformLocations = {
    matrix: gl.getUniformLocation(program, 'matrix'),
}

const matrix = mat4.create();

// Update the matrix... this is equal to matrix = matrix + translation
// Translate first, then scale. The transformations are applied to the matrix in
// the reverse order defined in the code.
mat4.translate(matrix, matrix, [0.2,0.5,0.1]);
mat4.scale(matrix, matrix, [0.5,0.5,0.5]);

function animate(){
    requestAnimationFrame(animate);
    mat4.rotateZ(matrix, matrix, Math.PI/70);

    // Matrix 4x4 of floats. Transpose is false because the matrix is already in column major order.
    gl.uniformMatrix4fv(uniformLocations.matrix, false, matrix);

    gl.drawArrays(gl.TRIANGLES, 0, 3); // Drawing options, start index, number of verticies to draw (x,y,z) struct
}

animate();