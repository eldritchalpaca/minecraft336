var gl;
var vertexBuffer;
var vertexNormalBuffer;
var vertexColorBuffer;
var texCoordBuffer;
var indexBuffer;
var lightingShader;
var colorShader;
// handle to the texture object on the GPU
var textureHandle;
var model;

var world = new World();

var camera = new Camera(30, 1.5);

//camera is set to center of world
camera.setPosition((World.WORLD_SIZE / 2) * Chunk.CHUNK_SIZE_X, Chunk.WORLD_HEIGHT / 2, (World.WORLD_SIZE / 2) * Chunk.CHUNK_SIZE_Z);

var imageFilename = "./textures/grass64top.png";

//Blocks.GRASS to call these MFs
const Blocks = {
    BEDROCK : 0,
    STONE : 1,
    ORE : 2,
    GRAVEL : 3,
    DIRT : 4,
    GRASS : 5,
    GRASSTOP : 6,
    SAND : 7,
    LOG : 8,
    LEAVES : 9
}

// generic white light
var lightPropElements = new Float32Array([
    0.2, 0.2, 0.2,
    0.7, 0.7, 0.7,
    0.7, 0.7, 0.7
]);

//shiny green plastic
var matPropElements = new Float32Array([
    0.3, 0.3, 0.3,
    0.0, 0.8, 0.0,
    0.8, 0.8, 0.8
]);
var shininess = 30;

// vertex shader for lighting
const vLightingShaderSource = `
uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
uniform mat3 normalMatrix;
uniform vec4 lightPosition;

attribute vec4 a_Position;
attribute vec3 a_Normal;
attribute vec2 a_TexCoord;

varying vec3 fL;
varying vec3 fN;
varying vec3 fV;
varying vec2 fTexCoord;

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

  fTexCoord = a_TexCoord;
  gl_Position = projection * view * model * a_Position;
}
`;

// fragment shader for lighting
const fLightingShaderSource = `
precision mediump float;

uniform mat3 materialProperties;
uniform mat3 lightProperties;
uniform float shininess;
uniform sampler2D sampler;

varying vec3 fL;
varying vec3 fN;
varying vec3 fV;
varying vec2 fTexCoord;

void main()
{
  // normalize after interpolating
  vec3 N = normalize(fN);
  vec3 L = normalize(fL);
  vec3 V = normalize(fV);

  // reflected vector
  vec3 R = reflect(-L, N);

  // get the columns out of the light and material properties.  We keep the surface
  // properties separate, so we can mess with them using the sampled texture value
  vec4 ambientSurface = vec4(materialProperties[0], 1.0);
  vec4 diffuseSurface = vec4(materialProperties[1], 1.0);
  vec4 specularSurface = vec4(materialProperties[2], 1.0);

  vec4 ambientLight = vec4(lightProperties[0], 1.0);
  vec4 diffuseLight = vec4(lightProperties[1], 1.0);
  vec4 specularLight = vec4(lightProperties[2], 1.0);

  // sample from the texture at interpolated texture coordinate
  //vec4 color = vec4(1.0, 0.0, 0.0, 1.0);
   vec4 color = texture2D(sampler, fTexCoord);
   //vec4 color = texture2D(sampler, vec2(fTexCoord.s * 4.0, fTexCoord.t * 4.0));

  // (1) use the value directly as the surface color and ignore the material properties
  ambientSurface = color;
  diffuseSurface = color;
  //diffuseSurface = .5 * color + .5 * diffuseSurface;

  // (2) modulate intensity of surface color (or of any component)
  //float m = (color.r + color.g + color.b) / 3.0;
  // ambientSurface *= m;
  //diffuseSurface *= m;
  //specularSurface *= m;

  // (3) blend texture using its alpha value (try this with "steve.png")
  //float m = color.a;
  //ambientSurface = (1.0 - m) * ambientSurface + m * color;
  //diffuseSurface = (1.0 - m) * diffuseSurface + m * color;
  //specularSurface = (1.0 - m) * specularSurface + m * color;
  

  // lighting factors as usual

  // Lambert's law, clamp negative values to zero
  float diffuseFactor = max(0.0, dot(L, N));

  // specular factor from Phong reflection model
  float specularFactor = pow(max(0.0, dot(V, R)), shininess);

  // add the components together, note that vec4 * vec4 is componentwise multiplication,
  // not a dot product
  vec4 ambient = ambientLight * ambientSurface;
  vec4 diffuse = diffuseFactor * diffuseLight * diffuseSurface;
  vec4 specular = specularFactor * specularLight * specularSurface;
  gl_FragColor = ambient + diffuse + specular;
  gl_FragColor.a = 1.0;
}
`;

// vertex shader with color only
const vColorShaderSource = `
uniform mat4 transform;
attribute vec4 a_Position;
attribute vec4 a_Color;
varying vec4 color;
void main()
{
  color = a_Color;
  gl_Position = transform * a_Position;
}`;

// fragment shader with color only
const fColorShaderSource = `
precision mediump float;
varying vec4 color;
void main()
{
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
    camera.keyControl(ch);
}

function drawCube(matrix) {

    // bind the shader
    gl.useProgram(lightingShader);

    // get the index for the a_Position attribute defined in the vertex shader
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

    var texCoordIndex = gl.getAttribLocation(lightingShader, 'a_TexCoord');
    if (texCoordIndex < 0) {
        console.log('Failed to get the storage location of a_TexCoord');
        return;
    }

    // "enable" the a_position attribute
    gl.enableVertexAttribArray(positionIndex);
    gl.enableVertexAttribArray(normalIndex);
    gl.enableVertexAttribArray(texCoordIndex);


    // bind buffers for points
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
    gl.vertexAttribPointer(normalIndex, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.vertexAttribPointer(texCoordIndex, 2, gl.FLOAT, false, 0, 0);

    // set uniform in shader for projection * view * model transformation
    var projection = camera.getProjection();
    var view = camera.getView();
    var loc = gl.getUniformLocation(lightingShader, "model");
    gl.uniformMatrix4fv(loc, false, matrix.elements);
    loc = gl.getUniformLocation(lightingShader, "view");
    gl.uniformMatrix4fv(loc, false, view.elements);
    loc = gl.getUniformLocation(lightingShader, "projection");
    gl.uniformMatrix4fv(loc, false, projection.elements);
    loc = gl.getUniformLocation(lightingShader, "normalMatrix");
    gl.uniformMatrix3fv(loc, false, makeNormalMatrixElements(matrix, view));

    // set a light position at (2, 4, 2)
    loc = gl.getUniformLocation(lightingShader, "lightPosition");
    gl.uniform4f(loc, 2.0, 4.0, 2.0, 1.0);

    // *** light and material properties
    loc = gl.getUniformLocation(lightingShader, "lightProperties");
    gl.uniformMatrix3fv(loc, false, lightPropElements);
    loc = gl.getUniformLocation(lightingShader, "materialProperties");
    gl.uniformMatrix3fv(loc, false, matPropElements);
    loc = gl.getUniformLocation(lightingShader, "shininess");
    gl.uniform1f(loc, shininess);

    // *** need to choose a texture unit, then bind the texture
    // to TEXTURE_2D for that unit
    var textureUnit = 1;
    gl.activeTexture(gl.TEXTURE0 + textureUnit);
    gl.bindTexture(gl.TEXTURE_2D, textureHandle);
    loc = gl.getUniformLocation(lightingShader, "sampler");
    gl.uniform1i(loc, textureUnit);

    gl.drawArrays(gl.TRIANGLES, 0, model.numVertices);

    gl.disableVertexAttribArray(positionIndex);
    gl.disableVertexAttribArray(normalIndex);
    gl.useProgram(null);
}

function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BIT);

    world.render(new THREE.Matrix4());
}

async function main() {

    var image = await loadImagePromise(imageFilename);

    model = getModelData(new THREE.BoxGeometry());

    gl = getGraphicsContext("theCanvas");
    gl.clearColor(0.9, 0.9, 0.9, 1.0);

    gl.enable(gl.DEPTH_TEST);

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    // load and compile the shader pair
    lightingShader = createShaderProgram(gl, vLightingShaderSource, fLightingShaderSource);
    colorShader = createShaderProgram(gl, vColorShaderSource, fColorShaderSource);

    // load the vertex data into GPU memory
    vertexBuffer = createAndLoadBuffer(model.vertices);

    // buffer for vertex normals
    vertexNormalBuffer = createAndLoadBuffer(model.normals);

    // buffer for vertex colors
    vertexColorBuffer = gl.createBuffer();

    texCoordBuffer = createAndLoadBuffer(model.texCoords);

    window.onkeypress = handleKeyPress;

    // ask the GPU to create a texture object
    textureHandle = createAndLoadTexture(image);

    // generate mipmaps for the texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureHandle);
    gl.generateMipmap(gl.TEXTURE_2D);

    var animate = function () {
        draw();
        requestAnimationFrame(animate);
    }

    animate();
}