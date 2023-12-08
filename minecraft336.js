var gl;
var vertexBuffer;
var vertexNormalBuffer;
var vertexColorBuffer;
var vertexCrosshairBuffer;
var texCoordBuffer;
var texCrosshairBuffer;
var indexBuffer;
var lightingShader;
var colorShader;
var crosshairShader;
var textureHandles = [];
var crosshairHandle;
var model;

var world = new World();

var bedrockImage = "./textures/bedrock64.png";
var stoneImage = "./textures/stone64.png";
var oreImage = "./textures/ore64.png";
var gravelImage = "./textures/gravel64.png";
var dirtImage = "./textures/dirt64.png";
var grassImage = "./textures/grass64.png";
var grassTopImage = "./textures/grass64Top.png";
var sandImage = "./textures/sand64.png";
var logImage = "./textures/log.png";
var leavesImage = "./textures/leaves.png";
var waterImage = "./textures/water.png";
var crosshairImage = "./textures/crosshair.png";

var bedrock = [];
var stone = [];
var ore = [];
var gravel = [];
var dirt = [];
var grass = [];
var sand = [];
var log = [];
var leaves = [];
var water = [];
var textures = [];

async function loadTextures() {
    bedrockImage = await loadImagePromise(bedrockImage);
    stoneImage = await loadImagePromise(stoneImage);
    oreImage = await loadImagePromise(oreImage);
    gravelImage = await loadImagePromise(gravelImage);
    dirtImage = await loadImagePromise(dirtImage);
    grassImage = await loadImagePromise(grassImage);
    grassTopImage = await loadImagePromise(grassTopImage);
    sandImage = await loadImagePromise(sandImage);
    logImage = await loadImagePromise(logImage);
    leavesImage = await loadImagePromise(leavesImage);
    waterImage = await loadImagePromise(waterImage);
    crosshairImage = await loadImagePromise(crosshairImage);

    bedrock = [
        bedrockImage,
        bedrockImage,
        bedrockImage,
        bedrockImage,
        bedrockImage,
        bedrockImage
    ]
    stone = [
        stoneImage,
        stoneImage,
        stoneImage,
        stoneImage,
        stoneImage,
        stoneImage
    ]
    ore = [
        oreImage,
        oreImage,
        oreImage,
        oreImage,
        oreImage,
        oreImage
    ]
    gravel = [
        gravelImage,
        gravelImage,
        gravelImage,
        gravelImage,
        gravelImage,
        gravelImage
    ]
    dirt = [
        dirtImage,
        dirtImage,
        dirtImage,
        dirtImage,
        dirtImage,
        dirtImage
    ]
    grass = [
        grassImage,
        grassImage,
        grassTopImage,
        dirtImage,
        grassImage,
        grassImage,
    ]
    sand = [
        sandImage,
        sandImage,
        sandImage,
        sandImage,
        sandImage,
        sandImage
    ]
    log = [
        logImage,
        logImage,
        logImage,
        logImage,
        logImage,
        logImage
    ]
    leaves = [
        leavesImage,
        leavesImage,
        leavesImage,
        leavesImage,
        leavesImage,
        leavesImage
    ]
    water = [
        waterImage,
        waterImage,
        waterImage,
        waterImage,
        waterImage,
        waterImage
    ]
    textures = [
        bedrock,
        stone,
        ore,
        gravel,
        dirt,
        grass,
        sand,
        log,
        leaves,
        water
    ];

    for (let i = 0; i < textures.length; ++i) {
        textureHandles[i] = createAndLoadCubeTexture(textures[i], i);
    }

    crosshairHandle = createAndLoadTexture(crosshairImage);

}

// vertex shader
const vshaderSource = `
uniform mat4 transform;
attribute vec4 a_Position;
attribute vec2 a_TexCoord;
varying vec2 fTexCoord;
varying vec3 fTexVector;

void main()
{
  // pass through so the value gets interpolated
  fTexCoord = a_TexCoord;
  fTexVector = a_Position.xyz;
  gl_Position = transform * a_Position;
}
`;

// fragment shader
const fshaderSource = `
precision mediump float;
uniform samplerCube sampler;
varying vec2 fTexCoord;
varying vec3 fTexVector;
uniform float m;
void main()
{
  // sample from the texture at the interpolated texture coordinate,
  // and use the value directly as the surface color
  vec4 color = textureCube(sampler, fTexVector) + m;
  //vec4 color = vec4(1.0, 0.0, 0.0, 1.0);
  gl_FragColor = color;
}
`;

// vertex shader
const vcrosshairShaderSource = `
attribute vec4 a_Position;
attribute vec2 a_TexCoord;
varying vec2 fTexCoord;
void main()
{
  // pass through so the value gets interpolated
  fTexCoord = a_TexCoord;
  gl_Position = a_Position;
}
`;

// fragment shader
const fcrosshairShaderSource = `
precision mediump float;
uniform sampler2D sampler;
varying vec2 fTexCoord;
void main()
{
  // sample from the texture at the interpolated texture coordinate,
  // and use the value directly as the surface color
  vec4 color = texture2D(sampler, fTexCoord);
  gl_FragColor = color;
}
`;

//location of crosshair
var numPoints = 6;
var crosshairVertices = new Float32Array([
    -0.05, -0.075,
    0.05, -0.075,
    0.05, 0.075,
    -0.05, -0.075,
    0.05, 0.075,
    -0.05, 0.075
]);

var texCrosshairCoords = new Float32Array([
    0.0, 0.0,
    0.5, 0.0,
    0.5, 1.0,
    0.0, 0.0,
    0.5, 1.0,
    0.0, 1.0,
]);

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

async function handleKeyPress(event) {

    if (event.key = "[") {
        if (!document.pointerLockElement) {
            await canvas.requestPointerLock();
            console.log("pointer lock on")
        }
        else {
            document.exitPointerLock();
            console.log("pointer lock off")
        }
    }

    var ch = getChar(event);
    world.keyControl(ch);
}

function handleMouseClick(event) {
    console.log(event);
}

/**
 * adapted from https://web.dev/articles/pointerlock-intro
 */
function handleMouseMove(event) {

    let movementX = event.movementX;
    let movementY = event.movementY;

    //yaw rotation
    world.camera.rotateOnAxis(movementX * -0.1, 0, 1, 0);


    let cameraMatrix = world.camera.getView();
    let strafeDirection = new THREE.Vector3();

    //third column of view matrix
    var cameraLookVector = (new THREE.Vector3(cameraMatrix.elements[2], cameraMatrix.elements[6], cameraMatrix.elements[10])).normalize();
    // if (cameraLookVector == cameraLookBlock) {
     //   m == 0.3;
    // }

    strafeDirection = (cameraLookVector.cross(new THREE.Vector3(0, 1, 0))).normalize();

    //pitch rotation
    world.camera.rotateOnAxis(movementY * 0.1, strafeDirection.x, strafeDirection.y, strafeDirection.z);


    cameraLookVector = (new THREE.Vector3(cameraMatrix.elements[2], cameraMatrix.elements[6], cameraMatrix.elements[10])).normalize();

    let clickDistance = 4;
    let pos = world.camera.position;

    for (let i = 1; i <= clickDistance; ++i) {
        let v = new THREE.Vector3();
        v.copy(cameraLookVector);
        v.multiplyScalar(-1 * i);
        v.add(pos);

        let block = world.getBlock(Math.floor(v.x), Math.floor(v.y), Math.floor(v.z))

        if (block != null) {
            block.isHighlighted = true;
            if (world.highlightedBlock != null) {
                world.highlightedBlock.isHighlighted = false;
            }
            world.highlightedBlock = block;
            return;
        }
    }

    if (world.highlightedBlock != null) {
        world.highlightedBlock.isHighlighted = false;
        world.highlightedBlock = null;
    }
}

function drawCube(matrix, texIndex, isHighlighted) {
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

    let m = 0.1;

     if (isHighlighted) {
        m = 0.3;
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
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, textureHandles[textureUnit]);

    // sampler value in shader is set to index for texture unit
    gl.uniform1i(loc, textureUnit);

    loc = gl.getUniformLocation(colorShader, "m");
    gl.uniform1f(loc, m);

    gl.drawArrays(gl.TRIANGLES, 0, model.numVertices);

    gl.disableVertexAttribArray(positionIndex);
    gl.disableVertexAttribArray(texCoordIndex);
    gl.useProgram(null);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
}

function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BIT);

    gl.useProgram(crosshairShader);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexCrosshairBuffer);

    var positionIndex = gl.getAttribLocation(crosshairShader, 'a_Position');
    if (positionIndex < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }
    
    gl.enableVertexAttribArray(positionIndex);
    gl.vertexAttribPointer(positionIndex, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);

    var texCoordIndex = gl.getAttribLocation(crosshairShader, 'a_TexCoord');
    if (texCoordIndex < 0) {
        console.log('Failed to get the storage location of a_TexCoord');
        return;
    }

    gl.enableVertexAttribArray(texCoordIndex);
    gl.vertexAttribPointer(texCoordIndex, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    var textureUnit = 0;
    gl.activeTexture(gl.TEXTURE0 + textureUnit);
    gl.bindTexture(gl.TEXTURE_2D, crosshairHandle);
    gl.activeTexture(gl.TEXTURE0);

    var loc = gl.getUniformLocation(crosshairShader, "sampler");
    gl.uniform1i(loc, textureUnit);
    gl.drawArrays(gl.TRIANGLES, 0, numPoints);
    gl.disableVertexAttribArray(positionIndex);
    gl.useProgram(null);

    world.render(new THREE.Matrix4());
}

let canvas;
async function main() {
    canvas = document.getElementById("theCanvas");
    gl = getGraphicsContext("theCanvas");

    await loadTextures();

    gl.bindTexture(gl.TEXTURE_2D, crosshairHandle);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    model = getModelData(new THREE.BoxGeometry());
    gl.clearColor(0.25, 0.75, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    // load and compile the shader pairl
    colorShader = createShaderProgram(gl, vshaderSource, fshaderSource);
    crosshairShader = createShaderProgram(gl, vcrosshairShaderSource, fcrosshairShaderSource);

    // load the vertex data into GPU memory
    vertexBuffer = createAndLoadBuffer(model.vertices);
    texCoordBuffer = createAndLoadBuffer(model.texCoords);

    vertexCrosshairBuffer = createAndLoadBuffer(crosshairVertices);
    texCrosshairBuffer = createAndLoadBuffer(texCrosshairCoords);

    window.onkeypress = handleKeyPress;
    canvas.onmousedown = handleMouseClick;
    //window.onmousemove = handleMouseMove;
    canvas.addEventListener("mousemove", handleMouseMove);
    var animate = function () {
        draw();
        requestAnimationFrame(animate);
    }

    animate();
}