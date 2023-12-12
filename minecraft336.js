var gl;
var vertexBuffer;
var vertexNormalBuffer;
var vertexColorBuffer;
var vertexCrosshairBuffer;
var texCoordBuffer;
var texCrosshairBuffer;
var indexBuffer;
var uvBuffer;
var lightingShader;
var colorShader;
var crosshairShader;
var textureHandles = [];
var lightPosition = new THREE.Vector3(-1, 1, -1);
var model;

var world;
let seed = 0.9396259012900186
//random
world = new World();

//world = new World(seed, PLAINS);

//world = new World(seed, DESERT);

//world = new World(seed, MOUNTAIN);

//world = new World(seed, ISLANDS);

//world = new World(seed, FOREST);

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

    let i;
    for (i = 0; i < textures.length; ++i) {
        textureHandles[i] = createAndLoadCubeTexture(textures[i], i);
    }
}

// vertex shader
const vshaderSource = `
uniform mat4 transform;
attribute vec4 a_Position;
attribute vec2 a_TexCoord;
attribute vec4 uv;
varying vec2 fTexCoord;
varying vec3 fTexVector;
varying vec2 fragment_uv;
varying float fragment_ao;
varying float fragment_light;
varying float diffuse;

varying vec3 fL;
varying vec3 fN;
const vec3 light_direction = normalize(vec3(-1.0, 1.0, -1.0));

void main()
{
  vec3 N = normalize(fN);
  vec3 L = normalize(fL);
  fragment_uv = uv.xy;
  fragment_ao = 0.3 + (1.0 - uv.z) * 0.7;
  fragment_light = uv.w;
  diffuse = min(0.0, dot(N, light_direction));

  // pass through so the value gets interpolated
  fTexCoord = a_TexCoord;
  fTexVector = a_Position.xyz / fragment_light;
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

varying vec3 fL;
varying vec3 fN;
varying vec2 fragment_uv;
varying float fragment_ao;
varying float fragment_light;
varying float diffuse;

void main()
{
  // sample from the texture at the interpolated texture coordinate,
  // and use the value directly as the surface color
  vec4 color = textureCube(sampler, fTexVector) + m;
  //vec4 color = vec4(1.0, 0.0, 0.0, 1.0);

  vec3 N = normalize(fN);
  vec3 L = normalize(fL);
  float value = max(1.0, fragment_light);
  vec4 light_color = vec4(value + 0.2);
  vec4 ambient = vec4(value * 0.8 + 0.2);
  vec4 specular = 0.0 * light_color; 
  float shadow = 10.0;
  vec4 light = (ambient + (1.0 - shadow) * (diffuse + specular)) * color;

  gl_FragColor = light, 1.0;
}
`;

// vertex shader
const vcrosshairShaderSource = `
attribute vec4 a_Position;
void main()
{
  gl_Position = a_Position;
}
`;

// fragment shader
const fcrosshairShaderSource = `
precision mediump float;
void main()
{
  vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
  gl_FragColor = color;
}
`;

//location of crosshair
var numPoints = 6;
var crosshairVertices = new Float32Array([
    -0.01, -0.015,
    0.01, -0.015,
    0.01, 0.015,
    -0.01, -0.015,
    0.01, 0.015,
    -0.01, 0.015
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

    if (event.button == 2 && world.highlightedBlock != null) {
        world.highlightedBlock.destroy();
        world.highlightedBlock = null;
    }
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

    strafeDirection = (cameraLookVector.cross(new THREE.Vector3(0, 1, 0))).normalize();

    //pitch rotation
    world.camera.rotateOnAxis(movementY * 0.1, strafeDirection.x, strafeDirection.y, strafeDirection.z);

    setHighlightedBlock();
}

let left =      new THREE.Vector3(-1,  0,  0);
let right =     new THREE.Vector3( 1,  0,  0);
let up =        new THREE.Vector3( 0,  1,  0);
let down =      new THREE.Vector3( 0, -1,  0);
let forwards =  new THREE.Vector3( 0,  0, -1);
let backwards = new THREE.Vector3( 0,  0,  1);

function setHighlightedBlock() {
    //find block that we're looking at and highlight it
    let cameraMatrix = world.camera.getView();
    let cameraLookVector = (new THREE.Vector3(cameraMatrix.elements[2], cameraMatrix.elements[6], cameraMatrix.elements[10])).normalize();

    let clickDistance = 4;
    let pos = world.camera.position;

    for (let i = 0.01; i <= clickDistance; i += 0.2) {
        let v = new THREE.Vector3();
        v.copy(cameraLookVector);
        v.multiplyScalar(-1 * i);
        v.add(pos);

        let block = world.getBlock(Math.round(v.x), Math.round(v.y), Math.round(v.z))

        if (world.highlightedBlock != null) {
            world.highlightedBlock.isHighlighted = false;
            world.highlightedBlock = null;
        }

        if (block != null) {
            block.isHighlighted = true;
            if (world.highlightedBlock != null) {
                world.highlightedBlock.isHighlighted = false;
            }
            world.highlightedBlock = block;
           // console.log(getSideFacingCamera(block));
           return;
        }
    }
}

//doesn't work :(
function getSideFacingCamera(block) {
    let worldMatrix = new THREE.Matrix4().copy(world.getMatrix());
    let chunkMatrix = new THREE.Matrix4().copy(block.chunk.getMatrix());
    let blockMatrix = new THREE.Matrix4().copy(block.getMatrix());

    blockMatrix = worldMatrix.multiply(chunkMatrix).multiply(blockMatrix);

    let view = new THREE.Matrix4().copy(world.camera.getView());

    let modelView = view.multiply(blockMatrix);

    let eye_left =      left.applyMatrix4(modelView);
    let eye_right =     right.applyMatrix4(modelView);
    let eye_up =        up.applyMatrix4(modelView);
    let eye_down =      down.applyMatrix4(modelView);
    let eye_forwards =  forwards.applyMatrix4(modelView);
    let eye_backwards = backwards.applyMatrix4(modelView);

    let cubeToCamera4 = (new THREE.Vector4(0, 0, 0, 1)).applyMatrix4(modelView);
    let cubeToCamera = (new THREE.Vector3(cubeToCamera4.x, cubeToCamera4.y, cubeToCamera4.z)).normalize().negate();

    let dot_left =      cubeToCamera.dot(eye_left);
    let dot_right =     cubeToCamera.dot(eye_right);
    let dot_up =        cubeToCamera.dot(eye_up);
    let dot_down =      cubeToCamera.dot(eye_down);
    let dot_forwards =  cubeToCamera.dot(eye_forwards);
    let dot_backwards = cubeToCamera.dot(eye_backwards);

    let dots = [
        dot_left,
        dot_right,
        dot_up,
        dot_down,
        dot_forwards,
        dot_backwards
    ];

    dots.sort((a, b) => a - b);

    let highest = dots[dots.length - 1];

    switch (highest) {
        case dot_left:
            return "west"
        case dot_right:
            return "east"
        case dot_up:
            return "up"
        case dot_down:
            return "down"
        case dot_forwards:
            return "north"
        case dot_backwards:
            return "south"
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

    var uvIndex = gl.getAttribLocation(colorShader, 'uv');
    if (uvIndex < 0) {
        console.log('Failed to get the storage location of uv');
        return;
    }

    let m = 0.1;

    if (isHighlighted) {
        m = 0.3;
    }

    // "enable" the a_position attribute
    gl.enableVertexAttribArray(positionIndex);
    gl.enableVertexAttribArray(texCoordIndex);
    gl.enableVertexAttribArray(uvIndex);

    // bind buffers for points
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.vertexAttribPointer(texCoordIndex, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.vertexAttribPointer(uvIndex, 2, gl.FLOAT, false, 0, 0);

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
    gl.disableVertexAttribArray(uvIndex);
    gl.useProgram(null);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
}

function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BIT);

    world.render(new THREE.Matrix4());

    gl.useProgram(crosshairShader);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexCrosshairBuffer);

    var positionIndex = gl.getAttribLocation(crosshairShader, 'a_Position');
    if (positionIndex < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    gl.enableVertexAttribArray(positionIndex);
    gl.vertexAttribPointer(positionIndex, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, numPoints);
    gl.disableVertexAttribArray(positionIndex);
    gl.useProgram(null);
}

let canvas;
async function main() {
    canvas = document.getElementById("theCanvas");
    // canvas.height = window.innerHeight;
    // canvas.width = canvas.height * 1.5
    gl = getGraphicsContext("theCanvas");

    await loadTextures();

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
    uvBuffer = createAndLoadBuffer(model.uvs);

    vertexCrosshairBuffer = createAndLoadBuffer(crosshairVertices);

    window.onkeypress = handleKeyPress;
    canvas.onmousedown = handleMouseClick;
    canvas.addEventListener("mousemove", handleMouseMove);
    var animate = function () {
        draw();
        requestAnimationFrame(animate);
    }

    animate();
}