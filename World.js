class World extends CS336Object {

    constructor(seed, biome) {
        super();

        seed = seed ? seed : Math.random();
        noise.seed(seed);

        this.seed = seed;

        biome = biome ? biome : randomBiome();
        this.biome = biome;

        this.chunkRenderBuffer = new Map();

        this.setPosition(0, 0, 0);

        this.chunks = createNDimArray([WORLD_SIZE, WORLD_SIZE]);
        
        this.createChunks();

        this.camera = new Camera(70, 1.5);

        this.currentChunk = this.chunks[WORLD_SIZE / 2][WORLD_SIZE / 2];

        let cameraX = this.currentChunk.x * CHUNK_SIZE_X;
        let cameraZ = this.currentChunk.z * CHUNK_SIZE_Z;
        let cameraY = this.currentChunk.getHighestY(0, 0) + PLAYER_HEIGHT;
        
        //camera is set to center of world
        this.camera.setPosition(cameraX, cameraY, cameraZ);

        this.setRenderedChunks();

        this.highlightedBlock = null;
    }

    /**
     * Returns the camera position relative to the current chunk
     */
    getCameraChunkCoords() {
        let x = this.camera.position.x;
        let y = this.camera.position.y;
        let z = this.camera.position.z;

        x = x % CHUNK_SIZE_X;
        z = z % CHUNK_SIZE_Z;

        return new THREE.Vector3(x, y, z);
    }

    /**
     * get block given a world block coord
     * @param {*} x 
     * @param {*} y 
     * @param {*} z 
     * @returns 
     */
    getBlock(x, y, z) {
        let chunk = this.chunks[Math.floor(x / CHUNK_SIZE_X)][Math.floor(z / CHUNK_SIZE_Z)];
        x = x % CHUNK_SIZE_X;
        z = z % CHUNK_SIZE_Z;

        return chunk.blocks[x][y][z];
    }

    /**
     * get chunk given a world block coord
     * @param {*} x 
     * @param {*} z 
     * @returns 
     */
    getChunk(x, z) {
        return this.chunks[Math.floor(x / CHUNK_SIZE_X)][Math.floor(z / CHUNK_SIZE_Z)];
    }

    addBlockToBuffer(chunkX, chunkZ, block) {
        let key = chunkX + " " + chunkZ;

        if (!this.chunkRenderBuffer.has(key)) {
            this.chunkRenderBuffer.set(key, [block]);
        }
        else {
            let blocks = this.chunkRenderBuffer.get(key);
            this.chunkRenderBuffer.delete(key);
            blocks.push(block);
            this.chunkRenderBuffer.set(key, blocks);
        }
    }

    getChunkFromBuffer(chunkX, chunkZ) {
        let key = chunkX + " " + chunkZ;

        if (this.chunkRenderBuffer.has(key)) {
            return this.chunkRenderBuffer.get(key);
        }

        return [];
    }

    removeChunkFromBuffer(chunkX, chunkZ){
        let key = chunkX + " " + chunkZ;
        this.chunkRenderBuffer.delete(key);
    }

    setRenderedChunks() {
        let currChunkX = Math.floor(this.camera.position.x / CHUNK_SIZE_X);
        let currChunkZ = Math.floor(this.camera.position.z / CHUNK_SIZE_Z);

        if (currChunkX == this.currentChunk.x && currChunkZ == this.currentChunk.z && this.renderedChunks != null) {
            return;
        }

        this.renderedChunks = [];

        this.currentChunk = this.chunks[currChunkX][currChunkZ];

        this.createChunks();

        let x = this.currentChunk.x;
        let z = this.currentChunk.z;
        let index = 0;

        for (let i = Math.max(0, x - RENDER_DISTANCE); i < Math.min(x + RENDER_DISTANCE, WORLD_SIZE); ++i) {
            for (let j = Math.max(0, z - RENDER_DISTANCE); j < Math.min(z + RENDER_DISTANCE, WORLD_SIZE); ++j) {
                this.renderedChunks[index] = this.chunks[i][j];
                index++;
            }
        }
    }

    createChunks() {

        if (this.currentChunk == null) {
            this.currentChunk = new Chunk(WORLD_SIZE / 2, WORLD_SIZE / 2, this, this.biome);
        }

        let x = this.currentChunk.x;
        let z = this.currentChunk.z;

        for (let i = Math.max(0, x - RENDER_DISTANCE); i < Math.min(x + RENDER_DISTANCE, WORLD_SIZE); ++i) {
            for (let j = Math.max(0, z - RENDER_DISTANCE); j < Math.min(z + RENDER_DISTANCE, WORLD_SIZE); ++j) {
                if (this.chunks[i][j] == null) {
                    this.chunks[i][j] = new Chunk(i, j, this, this.biome);
                }
            }
        }
    }

    keyControl(ch) {
        this.camera.keyControl(ch);
        this.setRenderedChunks();
    }

      /**
   * Renders this object using the drawObject callback function and recursing
   * through the children.
   * @param matrixWorld
   *   frame transformation for this object's parent
   */
  render(matrixWorld) {
    // clone and update the world matrix
    var current = new THREE.Matrix4().copy(matrixWorld).multiply(this.getMatrix());

    // invoke callback (possibly empty)
    this.drawObject(current);

    // recurse through children, who will use the current matrix
    // as their "world"
    // for (var i = 0; i < this.children.length; ++i) {
    //     let child = this.children[i];

    //     child.render(current);
    // }

    for (let i = 0; i < this.renderedChunks.length; ++i) {
        let chunk = this.renderedChunks[i];
        chunk.render(current);
    }
  }
}