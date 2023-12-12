var gl;
var vertexBuffer;
var vertexNormalBuffer;
var vertexColorBuffer;
var vertexCrosshairBuffer;
var texCoordBuffer;
var texCrosshairBuffer;
var indexBuffer;
var uvBuffer;

var mainShader;
var crosshairShader;
var shadowMapShader;
var lightingShader;

var textureHandles = [];
var model;

var OFFSCREEN_WIDTH;
var OFFSCREEN_HEIGHT;
var fbo;
var lightPosition = new THREE.Vector4(-4.0, 10.0, -1.0, 1.0);

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
uniform mat4 lightViewProjection;
attribute vec4 a_Position;
attribute vec2 a_TexCoord;
// attribute vec4 uv;
varying vec2 fTexCoord;
varying vec3 fTexVector;
// varying vec2 fragment_uv;
// varying float fragment_ao;
// varying float fragment_light;
varying float diffuse;

varying vec3 fL;
varying vec3 fN;
const vec3 light_direction = normalize(vec3(-1.0, 1.0, -1.0));
varying vec4 lightCoord;

void main()
{
  vec3 N = normalize(fN);
  vec3 L = normalize(fL);
//   fragment_uv = uv.xy;
//   fragment_ao = 0.3 + (1.0 - uv.z) * 0.7;
//   fragment_light = uv.w;
  diffuse = min(0.0, dot(N, light_direction));

  lightCoord = lightViewProjection * a_Position;

  // pass through so the value gets interpolated
  fTexCoord = a_TexCoord;
  fTexVector = a_Position.xyz;
  gl_Position = transform * a_Position;
  lightCoord = lightCoord / lightCoord.w;
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
// varying vec2 fragment_uv;
// varying float fragment_ao;
// varying float fragment_light;
varying float diffuse;

varying vec4 lightCoord;
uniform sampler2D shadowMap;

void main()
{
  float visibility = texture2D(shadowMap, lightCoord.xy).r;
  visibility = (lightCoord.z > visibility + 0.005) ? 0.3 : 1.0;

  // sample from the texture at the interpolated texture coordinate,
  // and use the value directly as the surface color
  vec4 color = textureCube(sampler, fTexVector) + m;
  //vec4 color = vec4(1.0, 0.0, 0.0, 1.0);

//   vec3 N = normalize(fN);
//   vec3 L = normalize(fL);
//   float value = max(1.0, fragment_light);
//   vec4 light_color = vec4(value + 0.2);
//   vec4 ambient = vec4(value * 0.8 + 0.2);
//   vec4 specular = 0.0 * light_color; 
//   float shadow = 10.0;
//   vec4 light = (ambient + (1.0 - shadow) * (diffuse + specular)) * color * visibility;

  gl_FragColor = color;
}
`;

// crosshair vertex shader
const vcrosshairShaderSource = `
attribute vec4 a_Position;
void main()
{
  gl_Position = a_Position;
}
`;

// crosshair fragment shader
const fcrosshairShaderSource = `
precision mediump float;
void main()
{
  vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
  gl_FragColor = color;
}
`;

// shadowmap vertex shader
const vshadowMapShaderSource = `
uniform mat4 lightMVPMatrix;  // projection * view * model with view point at light
attribute vec4 a_Position;
void main()
{
  gl_Position = lightMVPMatrix * a_Position;
}
`;
// shadowmap fragment shader
const fshadowMapShaderSource = `
precision mediump float;
void main()
{
  //gl_FragColor = vec4(gl_FragCoord.z, 0.0, 0.0, 1.0);
  const vec4 bitShift = vec4(1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0);
  const vec4 bitMask = vec4(1.0/256.0, 1.0/256.0, 1.0/256.0, 0.0);
  vec4 rgbaDepth = fract(gl_FragCoord.z * bitShift);
  gl_FragColor = rgbaDepth;
}
`;

// lighting vertex shader
const vLightingShaderSource = `
uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
uniform mat3 normalMatrix;
uniform vec4 lightPosition;
uniform mat4 lightMVPMatrix;

attribute vec4 a_Position;
attribute vec3 a_Normal;

varying vec3 fL;
varying vec3 fN;
varying vec3 fV;
varying vec4 fClipCoordRelativeToLight;

void main()
{
  // convert position to eye coords
  vec4 positionEye = view * model * a_Position;

  // convert light position to eye coords
  vec4 lightEye = view * lightPosition;

  // vector to light
  fL = (lightEye - positionEye).xyz;

  // transform normal vector into eye coords
  fN = normalMatrix * a_Normal;

  // vector from vertex position toward view point
  fV = normalize(-(positionEye).xyz);

  fClipCoordRelativeToLight = lightMVPMatrix * a_Position;

  gl_Position = projection * view * model * a_Position;
}
`;

// lighting fragment shader
const fLightingShaderSource = `
precision mediump float;

uniform mat3 materialProperties;
uniform mat3 lightProperties;
uniform float shininess;
uniform sampler2D sampler;
uniform float textureSize;

varying vec3 fL;
varying vec3 fN;
varying vec3 fV;
varying vec4 fClipCoordRelativeToLight;

float unpackDepth(const in vec4 rgbaDepth) {
    const vec4 bitShift = vec4(1.0, 1.0/256.0, 1.0/(256.0*256.0), 1.0/(256.0*256.0*256.0));
    float depth = dot(rgbaDepth, bitShift);
    return depth;
}

void main()
{
  vec3 lightCoord = fClipCoordRelativeToLight.xyz / fClipCoordRelativeToLight.w;
  float currentDepth = lightCoord.z / 2.0 + 0.5;
  vec2 st = lightCoord.xy / 2.0 + 0.5;

  #if 0
    vec4 rgbaDepth = st;
    float storedDepth = unpackDepth(rgbaDepth);
    //float storedDepth = rgbaDepth.r;
    float shadowFactor = 1.0;

    //if (storedDepth < currentDepth)
    if (storedDepth < currentDepth - 0.005)
    {
        shadowFactor = 0.6;
    }
  #endif

  #if 1
    float shadowed = 0.0;
    float increment = 1.0;
    vec4 rgbaDepth = texture2D(sampler, st);
    float storedDepth = unpackDepth(rgbaDepth);
    shadowed += (storedDepth < currentDepth - 0.005) ? 0.0 : 1.0;
    rgbaDepth = texture2D(sampler, st + vec2(increment, 0.0));
    storedDepth = unpackDepth(rgbaDepth);
    shadowed += (storedDepth < currentDepth - 0.005) ? 0.0 : 1.0;
    rgbaDepth = texture2D(sampler, st + vec2(0.0, increment));
    storedDepth = unpackDepth(rgbaDepth);
    shadowed += (storedDepth < currentDepth - 0.005) ? 0.0 : 1.0;
    rgbaDepth = texture2D(sampler, st + vec2(increment, increment));
    storedDepth = unpackDepth(rgbaDepth);
    shadowed += (storedDepth < currentDepth - 0.005) ? 0.0 : 1.0;
    shadowed *= 0.25;
    float shadowFactor = shadowed * 0.4 + 0.6;
  #endif

  vec3 N = normalize(fN);
  vec3 L = normalize(fL);
  vec3 V = normalize(fV);
  vec3 R = reflect(-L, N);

  vec4 ambientSurface = vec4(materialProperties[0], 1.0);
  vec4 diffuseSurface = vec4(materialProperties[1], 1.0);
  vec4 specularSurface = vec4(materialProperties[2], 1.0);
  vec4 ambientLight = vec4(lightProperties[0], 1.0);
  vec4 diffuseLight = vec4(lightProperties[1], 1.0);
  vec4 specularLight = vec4(lightProperties[2], 1.0);

  mat3 products = matrixCompMult(lightProperties, materialProperties);
  vec4 ambientColor = vec4(products[0], 1.0);
  vec4 diffuseColor = vec4(products[1], 1.0);
  vec4 specularColor = vec4(products[2], 1.0);

  float diffuseFactor = max(0.0, dot(L, N));
  float specularFactor = pow(max(0.0, dot(V, R)), shininess);
  gl_FragColor = specularColor * specularFactor + diffuseColor * diffuseFactor + ambientColor;

  if (dot(L, N) > 0.0)
  {
    gl_FragColor *= shadowFactor;
  }

  gl_FragColor.a = 1.0;
}
`;

function initFramebufferObject(gl) {
    var framebuffer, texture, depthBuffer;
    var error = function() {
      if (framebuffer) gl.deleteFramebuffer(framebuffer);
      if (texture) gl.deleteTexture(texture);
      if (depthBuffer) gl.deleteRenderbuffer(depthBuffer);
      return null;
    }

    framebuffer = gl.createFramebuffer();
    if (!framebuffer) {
      console.log('Failed to create frame buffer object');
      return error();
    }
  
    texture = gl.createTexture();
    if (!texture) {
      console.log('Failed to create texture object');
      return error();
    }
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    framebuffer.texture = texture;

    depthBuffer = gl.createRenderbuffer();
    if (!depthBuffer) {
      console.log('Failed to create renderbuffer object');
      return error();
    }
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
    
    var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (gl.FRAMEBUFFER_COMPLETE !== e) {
      console.log('Frame buffer object is incomplete: ' + e.toString());
      return error();
    }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);

  return framebuffer;
}

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

var lightPropElements = new Float32Array([
    0.2, 0.2, 0.2,
    0.7, 0.7, 0.7,
    0.7, 0.7, 0.7
]);

var matPropElements = new Float32Array([
    1, 1, 1,
    1, 1, 1,
    1, 1, 1
]);
var shininess = 20.0;

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

    if (event.button == 0 && world.highlightedBlock != null) {
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

function drawModelOffscreen(model, matrix, vBuffer, projection, view)
{
  gl.useProgram(shadowMapShader);
  var positionIndex = gl.getAttribLocation(shadowMapShader, 'a_Position');
  if (positionIndex < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }
  gl.enableVertexAttribArray(positionIndex);
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  loc = gl.getUniformLocation(shadowMapShader, "lightMVPMatrix");
  var lightmvp = new THREE.Matrix4().multiply(projection).multiply(view).multiply(matrix);
  gl.uniformMatrix4fv(loc, false, lightmvp.elements);
  gl.drawArrays(gl.TRIANGLES, 0, model.numVertices);
  gl.disableVertexAttribArray(positionIndex);
}

function drawModel(model, matrix, vBuffer, nBuffer, projection, view)
{
  gl.useProgram(lightingShader);
  var positionIndex = gl.getAttribLocation(lightingShader, 'a_Position');
  if (positionIndex < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }
  var normalIndex = gl.getAttribLocation(lightingShader, 'a_Normal');
  if (normalIndex < 0) {
      console.log('Failed to get the storage location of a_Normal');
      return;
    }
  gl.enableVertexAttribArray(positionIndex);
  gl.enableVertexAttribArray(normalIndex);
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  gl.vertexAttribPointer(normalIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  var loc = gl.getUniformLocation(lightingShader, "model");
  gl.uniformMatrix4fv(loc, false, matrix.elements);
  loc = gl.getUniformLocation(lightingShader, "view");
  gl.uniformMatrix4fv(loc, false, view.elements);
  loc = gl.getUniformLocation(lightingShader, "projection");
  gl.uniformMatrix4fv(loc, false, projection.elements);
  loc = gl.getUniformLocation(lightingShader, "normalMatrix");
  gl.uniformMatrix3fv(loc, false, makeNormalMatrixElements(matrix, view));

  loc = gl.getUniformLocation(lightingShader, "lightPosition");
  var lp = lightPosition	;
  gl.uniform4f(loc, lp.x, lp.y, lp.z, lp.w);

  loc = gl.getUniformLocation(lightingShader, "lightMVPMatrix");
  var lightmvp = new THREE.Matrix4().multiply(projection).multiply(view).multiply(matrix);
  gl.uniformMatrix4fv(loc, false, lightmvp.elements);

  loc = gl.getUniformLocation(lightingShader, "lightProperties");
  gl.uniformMatrix3fv(loc, false, lightPropElements);
  loc = gl.getUniformLocation(lightingShader, "materialProperties");
  gl.uniformMatrix3fv(loc, false, matPropElements);
  loc = gl.getUniformLocation(lightingShader, "shininess");
  gl.uniform1f(loc, shininess);
  gl.uniform1f(loc, OFFSCREEN_WIDTH);

  gl.drawArrays(gl.TRIANGLES, 0, model.numVertices);

  gl.disableVertexAttribArray(positionIndex);
  gl.disableVertexAttribArray(normalIndex);

}

function drawCube(matrix, texIndex, isHighlighted) {
    var projection = world.camera.getProjection();
    var view = world.camera.getView();
    var modelMatrix = new THREE.Matrix4();
    modelMatrix.elements = matrix.elements;
    var transform = new THREE.Matrix4().multiply(projection).multiply(view).multiply(modelMatrix);
    // gl.bindFramebuffer(gl.FRAMEBUFFER, fbo );
    gl.viewport(0, 0, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);[]
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // drawModelOffscreen(model, modelMatrix, vertexBuffer, projection, view);
    // gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // gl.viewport(0, 0, 600, 600);
    // gl.clearColor(0.0, 0.0, 0.4, 1.0);
    // gl.enable(gl.DEPTH_TEST);
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // drawModel(model, modelMatrix, vertexBuffer, vertexNormalBuffer, projection, view);

    // bind the shader
    gl.useProgram(mainShader);

    var positionIndex = gl.getAttribLocation(mainShader, 'a_Position');
    if (positionIndex < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    var texCoordIndex = gl.getAttribLocation(mainShader, 'a_TexCoord');
    if (texCoordIndex < 0) {
        console.log('Failed to get the storage location of a_TexCoord');
        return;
    }

    // var uvIndex = gl.getAttribLocation(mainShader, 'uv');
    // if (uvIndex < 0) {
    //     console.log('Failed to get the storage location of uv');
    //     return;
    // }

    let m = 0.1;

    if (isHighlighted) {
        m = 0.3;
    }

    // "enable" the a_position attribute
    gl.enableVertexAttribArray(positionIndex);
    gl.enableVertexAttribArray(texCoordIndex);
    // gl.enableVertexAttribArray(uvIndex);

    // bind buffers for points
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.vertexAttribPointer(texCoordIndex, 2, gl.FLOAT, false, 0, 0);
    // gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    // gl.vertexAttribPointer(uvIndex, 3, gl.FLOAT, false, 0, 0);

    var projection = world.camera.getProjection();
    var view = world.camera.getView();
    var modelMatrix = new THREE.Matrix4();
    modelMatrix.elements = matrix.elements;
    var transform = new THREE.Matrix4().multiply(projection).multiply(view).multiply(modelMatrix);

    var loc = gl.getUniformLocation(mainShader, "transform");
    gl.uniformMatrix4fv(loc, false, transform.elements);

    loc = gl.getUniformLocation(mainShader, "sampler");

    var textureUnit = texIndex;
    gl.activeTexture(gl.TEXTURE0 + textureUnit);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, textureHandles[textureUnit]);

    // sampler value in shader is set to index for texture unit
    gl.uniform1i(loc, textureUnit);

    loc = gl.getUniformLocation(mainShader, "m");
    gl.uniform1f(loc, m);

    gl.drawArrays(gl.TRIANGLES, 0, model.numVertices);

    gl.disableVertexAttribArray(positionIndex);
    gl.disableVertexAttribArray(texCoordIndex);
    // gl.disableVertexAttribArray(uvIndex);
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
    gl = getGraphicsContext("theCanvas");

    OFFSCREEN_HEIGHT = canvas.clientHeight;
    OFFSCREEN_WIDTH = canvas.clientWidth;

    fbo = initFramebufferObject(gl);

    await loadTextures();

    model = getModelData(new THREE.BoxGeometry());
    gl.clearColor(0.25, 0.75, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    // load and compile the shader pair
    mainShader = createShaderProgram(gl, vshaderSource, fshaderSource);
    crosshairShader = createShaderProgram(gl, vcrosshairShaderSource, fcrosshairShaderSource);
    shadowMapShader = createShaderProgram(gl, vshadowMapShaderSource, fshadowMapShaderSource);
    lightingShader = createShaderProgram(gl, vLightingShaderSource, fLightingShaderSource);

    // load the vertex data into GPU memory
    vertexBuffer = createAndLoadBuffer(model.vertices);
    texCoordBuffer = createAndLoadBuffer(model.texCoords);
    // uvBuffer = createAndLoadBuffer(model.uv);

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