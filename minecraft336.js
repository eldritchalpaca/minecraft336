var gl;
var vertexBuffer;
var vertexNormalBuffer;
var vertexColorBuffer;
var texCoordBuffer;
var indexBuffer;
var lightingShader;
var colorShader;
var textureHandles = [];
var model;

var world = new World();

const textures = [
    "./textures/bedrock64.png",
    "./textures/stone64.png",
    "./textures/ore64.png",
    "./textures/gravel64.png",
    "./textures/dirt64.png",
    "./textures/grass64.png",
    "./textures/grass64top.png",
    "./textures/sand64.png",
    "./textures/log64.png",
    "./textures/leaves.png"
];

// vertex shader
const vshaderSource = `
uniform mat4 transform;
attribute vec4 a_Position;
attribute vec2 a_TexCoord;
varying vec2 fTexCoord;
void main()
{
  // pass through so the value gets interpolated
  fTexCoord = a_TexCoord;
  gl_Position = transform * a_Position;
}
`;

// fragment shader
const fshaderSource = `
precision mediump float;
uniform sampler2D sampler;
varying vec2 fTexCoord;
void main()
{
  // sample from the texture at the interpolated texture coordinate,
  // and use the value directly as the surface color
  vec4 color = texture2D(sampler, fTexCoord);
  //vec4 color = vec4(1.0, 0.0, 0.0, 1.0);
  gl_FragColor = color;
}
`;

//translate keypress events to strings
//from http://javascript.info/tutorial/keyboard-events
function getChar(event) {
    if (event.which == null) {
        return String.fromCharCode(event.keyCode) // IE
    } else if (event.which != 0 && event.charCode != 0) {
        return String.fromCharCode(event.which)   // the rest
    } else {
        return null // special key
    }
}

function handleKeyPress(event) {
    var ch = getChar(event);
    world.keyControl(ch);
}

function drawCube(matrix, texIndex) {
    // bind the shader
    gl.useProgram(colorShader);

    var positionIndex = gl.getAttribLocation(colorShader, 'a_Position');
    if (positionIndex < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    var texCoordIndex = gl.getAttribLocation(colorShader, 'a_TexCoord');
    if (texCoordIndex < 0) {
        console.log('Failed to get the storage location of a_TexCoord');
        return;
    }

    // "enable" the a_position attribute
    gl.enableVertexAttribArray(positionIndex);
    gl.enableVertexAttribArray(texCoordIndex);

    // bind buffers for points
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.vertexAttribPointer(texCoordIndex, 2, gl.FLOAT, false, 0, 0);

    var projection = world.camera.getProjection();
    var view = world.camera.getView();
    var modelMatrix = new THREE.Matrix4();
    modelMatrix.elements = matrix.elements;
    var transform = new THREE.Matrix4().multiply(projection).multiply(view).multiply(modelMatrix);

    var loc = gl.getUniformLocation(colorShader, "transform");
    gl.uniformMatrix4fv(loc, false, transform.elements);

    loc = gl.getUniformLocation(colorShader, "sampler");

    var textureUnit = texIndex;
    gl.activeTexture(gl.TEXTURE0 + textureUnit);
    gl.bindTexture(gl.TEXTURE_2D, textureHandles[textureUnit]);

    // sampler value in shader is set to index for texture unit
    gl.uniform1i(loc, textureUnit);

    gl.drawArrays(gl.TRIANGLES, 0, model.numVertices);

    gl.disableVertexAttribArray(positionIndex);
    gl.disableVertexAttribArray(texCoordIndex);
    gl.useProgram(null);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BIT);

    world.render(new THREE.Matrix4());
}

async function main() {

    gl = getGraphicsContext("theCanvas");

    for(let i = 0; i < textures.length; i++) {
        let image = await loadImagePromise(textures[i]);
        // ask the GPU to create a texture object
        let textureHandle = gl.createTexture();
    
        // choose a texture unit to use during setup, defaults to zero
        // (can use a different one when drawing)
        // max value is MAX_COMBINED_TEXTURE_IMAGE_UNITS
        gl.activeTexture(gl.TEXTURE0 + i);
    
        // bind the texture
        gl.bindTexture(gl.TEXTURE_2D, textureHandle);
    
        // load the image bytes to the currently bound texture, flipping the vertical
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    
        // set default parameters to usable values
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    
        // unbind
        gl.bindTexture(gl.TEXTURE_2D, null);

        textureHandles[i] = textureHandle;
    }

    model = getModelData(new THREE.BoxGeometry());
    gl.clearColor(0.9, 0.9, 0.9, 1.0);

    gl.enable(gl.DEPTH_TEST);

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    // load and compile the shader pair
    colorShader = createShaderProgram(gl, vshaderSource, fshaderSource);

    // load the vertex data into GPU memory
    vertexBuffer = createAndLoadBuffer(model.vertices);

    texCoordBuffer = createAndLoadBuffer(model.texCoords);

    window.onkeypress = handleKeyPress;

    var animate = function () {
        draw();
        requestAnimationFrame(animate);
    }

    animate();
}