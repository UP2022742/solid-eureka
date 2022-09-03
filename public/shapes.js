import * as gm from './gl-matrix-min.js';
import randomColour from './helper.js';

export class Cube {

    /**
     * @param {HTMLElement} canvas - The canvas element to draw on.
     * @param {Float32Array} vertexData - The vertex data for the cube.
     * @param {Float32Array} colorData - The colour data for the cube.
     */
    constructor(canvas, vertexData, colorData = this.generateRandomColours()) {
        this.canvas = canvas;
        this.vertexData = vertexData;
        this.colorData = colorData;
        this.program = null;

        /** @type {WebGLRenderingContext} */
        this.gl = this.canvas.getContext('webgl');
    }

    /**
     * @returns {Float32Array} The vertex data for the cube.
     */
    generateRandomColours(){
        let colorData = [];
        for (let face = 0; face < 6; face++) {
            let faceColour = randomColour();
            for (let vertex = 0; vertex < 6; vertex++) {
                colorData.push(...faceColour);
            }
        }
        return new Float32Array(colorData);
    }

    /** 
     * @returns {WebGLBuffer}
     * */
    positionBuffer(){
        const positionBuffer = this.gl.createBuffer(); // Create a buffer for the position data.
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer); // Bind empty empty buffer to ARRAY_BUFFER
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexData, this.gl.STATIC_DRAW); // Pass vertex data to buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null); // Good practice, but still unnecessary call to GPU.
        return positionBuffer;
    }

    /**
     * @returns {WebGLBuffer}
     */
    colourBuffer(){
        const colourBuffer = this.gl.createBuffer(); // Create a buffer for the colour data
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colourBuffer); // Bind empty buffer to ARRAY_BUFFER
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.colorData, this.gl.STATIC_DRAW); // Pass colour data to buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null); // Good practice, but still unnecessary call to GPU.
        return colourBuffer;
    }

    /**
     * @returns {WebGLShader}
     */
    createVertexShader(){
        // Mini program that runs on the GPU, needs to be compiled and written in GLSL.
        const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);

        // gl_position is the output of the vertex shader. Outputs x,y,z coordinates of the vertex.
        // to apply transformations, the best place for this is in the vertex shader.
        this.gl.shaderSource(vertexShader, `
            #pragma vscode_glsllint_stage: vert

            // Set the precision of the floating point.
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
        this.gl.compileShader(vertexShader);
        return vertexShader;
    }

    /**
     * @returns {WebGLShader}
     */
    createFragmentShader(){
        // Takes an input (or hard coded) and output a colour
        const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        this.gl.shaderSource(fragmentShader, `
            #pragma vscode_glsllint_stage: frag

            precision mediump float;
            varying vec3 vColour;
            void main() {
                gl_FragColor = vec4(vColour, 1);
            }
        `);
        this.gl.compileShader(fragmentShader);
        return fragmentShader;
    }

    bindPositionBuffer(positionBuffer, program){
        const positionLocation = this.gl.getAttribLocation(program, 'position'); // Name of defined attribute in the vertex shader, in this case it's position. return a number that WebGL has assigned to the attribute.
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.vertexAttribPointer(positionLocation, 3, this.gl.FLOAT, false, 0, 0); // Which attribute, how many components (x,y,z), type of data, normalize, stride, offset
    }

    bindColourBuffer(colourBuffer, program){
        const colourLocation = this.gl.getAttribLocation(program, 'colour'); // Name of defined attribute in the vertex shader, in this case it's colour. return a number that WebGL has assigned to the attribute.
        this.gl.enableVertexAttribArray(colourLocation);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colourBuffer);
        this.gl.vertexAttribPointer(colourLocation, 3, this.gl.FLOAT, false, 0, 0); // Which attribute, how many components (x,y,z), type of data, normalize, stride, offset
    }

    animate(){
        const matrix = glMatrix.glMatrix.mat4.create();
        const gl = this.gl;
        console.log(this.program);
        const program = this.program;
        const vertexDataLength = this.vertexData.length / 3;

        // Enable depth testing, so that objects that are behind other objects are not drawn.  
        gl.enable(gl.DEPTH_TEST);    

        // Update the matrix... this is equal to matrix = matrix + translation
        // Translate first, then scale. The transformations are applied to the matrix in
        // the reverse order defined in the code.
        glMatrix.glMatrix.mat4.translate(matrix, matrix, [.2, .5, 0]);
        glMatrix.glMatrix.mat4.scale(matrix, matrix, [0.25, 0.25, 0.25]);

        function spin() {
            requestAnimationFrame(spin);
            glMatrix.glMatrix.mat4.rotateZ(matrix, matrix, Math.PI/2 / 70);
            glMatrix.glMatrix.mat4.rotateX(matrix, matrix, Math.PI/2 / 70);
            
            // Matrix 4x4 of floats. Transpose is false because the matrix is already in column major order.
            gl.uniformMatrix4fv(gl.getUniformLocation(program, `matrix`), false, matrix);
            gl.drawArrays(gl.TRIANGLES, 0, vertexDataLength); // Drawing options, start index, number of verticies to draw (x,y,z) struct
        }

        spin();
    }
    

    draw(){
        const positionBuffer = this.positionBuffer();
        const colourBuffer = this.colourBuffer();
        const vertexShader = this.createVertexShader();
        const fragmentShader = this.createFragmentShader();

        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);

        // Only do this if there is an error because getting program information is expensive.
        if(!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)){
            console.log( this.gl.getShaderInfoLog(vertexShader));
            console.log( this.gl.getShaderInfoLog(fragmentShader));
            throw new Error("Program failed to link: " + this.gl.getProgramInfoLog(this.program));
        }

        this.bindPositionBuffer(positionBuffer, this.program);
        this.bindColourBuffer(colourBuffer, this.program);

        this.gl.useProgram(this.program); // Create an executable program on the GPU.   
        this.gl.enable(this.gl.DEPTH_TEST); // Enable depth testing, so that objects that are behind other objects are not drawn.

        // Update the matrix... this is equal to matrix = matrix + translation
        // Translate first, then scale. The transformations are applied to the matrix in
        // the reverse order defined in the code.
        const matrix = glMatrix.mat4.create();
        glMatrix.mat4.translate(matrix, matrix, [.2, .5, 0]);
        glMatrix.mat4.scale(matrix, matrix, [0.25, 0.25, 0.25]);

        const self = this;
        function animate() {
            requestAnimationFrame(animate);
            glMatrix.mat4.rotateZ(matrix, matrix, Math.PI/2 / 70);
            glMatrix.mat4.rotateX(matrix, matrix, Math.PI/2 / 70);
            
            // Matrix 4x4 of floats. Transpose is false because the matrix is already in column major order.
            self.gl.uniformMatrix4fv(self.gl.getUniformLocation(self.program, `matrix`), false, matrix);
            self.gl.drawArrays(self.gl.TRIANGLES, 0, self.vertexData.length / 3); // Drawing options, start index, number of verticies to draw (x,y,z) struct
        }

        animate();
    }
}

export class Triangle {

    /**
     * @param {HTMLElement} canvas - The canvas element to draw on.
     * @param {Float32Array} vertexData - The vertex data for the cube.
     * @param {Float32Array} colorData - The colour data for the cube.
     */
    constructor(canvas, vertexData, colorData = this.generateRandomColours()) {
        this.canvas = canvas;
        this.vertexData = vertexData;
        this.colorData = colorData;
        this.program = null;

        /** @type {WebGLRenderingContext} */
        this.gl = this.canvas.getContext('webgl');
    }

    generateRandomColours(){
        return new Float32Array([
            1, 0, 0,    // V1.color
            0, 1, 0,    // V2.color
            0, 0, 1,    // V3.color
        ]);
    }

    positionBuffer(){
        const positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexData, this.gl.STATIC_DRAW);
        return positionBuffer;
    }

    colourBuffer(){
        const colourBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colourBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.colorData, this.gl.STATIC_DRAW);
        return colourBuffer;
    }

    createVertexShader(){
        const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
        this.gl.shaderSource(vertexShader, `
            precision mediump float;
            attribute vec3 position;
            attribute vec3 color;
            varying vec3 vColor;
            uniform mat4 matrix;
            void main() {
                vColor = color;
                gl_Position = matrix * vec4(position, 1);
            }
        `);
        this.gl.compileShader(vertexShader);
        return vertexShader;
    }

    createFragmentShader(){
        const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        this.gl.shaderSource(fragmentShader, `
            precision mediump float;
            varying vec3 vColor;
            void main() {
                gl_FragColor = vec4(vColor, 1);
            }
        `);
        this.gl.compileShader(fragmentShader);
        return fragmentShader;
    }

    bindPositionBuffer(positionBuffer){
        const positionLocation = this.gl.getAttribLocation(this.program, `position`);
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.vertexAttribPointer(positionLocation, 3, this.gl.FLOAT, false, 0, 0);
    }
    bindColourBuffer(colorBuffer){
        const colorLocation = this.gl.getAttribLocation(this.program, `color`);
        this.gl.enableVertexAttribArray(colorLocation);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorBuffer);
        this.gl.vertexAttribPointer(colorLocation, 3, this.gl.FLOAT, false, 0, 0);
    }

    draw(){
        const positionBuffer = this.positionBuffer();
        const colorBuffer = this.colourBuffer();
        const vertexShader = this.createVertexShader();
        const fragmentShader = this.createFragmentShader();

        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);

        this.bindPositionBuffer(positionBuffer);
        this.bindColourBuffer(colorBuffer);

        this.gl.useProgram(this.program);

        const matrix = glMatrix.mat4.create();
        glMatrix.mat4.translate(matrix, matrix, [.2, .5, 0]);
        glMatrix.mat4.scale(matrix, matrix, [0.25, 0.25, 0.25]);

        let self = this;
        function animate() {
            requestAnimationFrame(animate);
            glMatrix.mat4.rotateZ(matrix, matrix, Math.PI/2 / 70);
            self.gl.uniformMatrix4fv(self.gl.getUniformLocation(self.program, `matrix`), false, matrix);
            self.gl.drawArrays(self.gl.TRIANGLES, 0, 3);
        }

        animate();
    }
}