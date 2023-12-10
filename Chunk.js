class Chunk extends CS336Object {

    static CHUNK_SIZE_X = 16;
    static CHUNK_SIZE_Z = 16;
    static WORLD_HEIGHT = 128;
    static SEA_LEVEL = Chunk.WORLD_HEIGHT / 4;
    static OCTAVES = 3;

    constructor(x, z, world) {
        super();

        this.blocks = createNDimArray([Chunk.CHUNK_SIZE_X, Chunk.WORLD_HEIGHT, Chunk.CHUNK_SIZE_Z]);
        this.height = createNDimArray([Chunk.CHUNK_SIZE_X, Chunk.CHUNK_SIZE_Z]);

        this.world = world;
        this.x = x;
        this.z = z;

        for (let x = 0; x < Chunk.CHUNK_SIZE_X; ++x) {
            for (let y = 0; y < Chunk.WORLD_HEIGHT; ++y) {
                for (let z = 0; z < Chunk.CHUNK_SIZE_Z; ++z) {
                    this.blocks[x][y][z] = null;
                }
            }
        }


        this.setPosition(Chunk.CHUNK_SIZE_X * x, 0, Chunk.CHUNK_SIZE_Z * z);

        this.createHeightMap();

        this.createBlocks();

        world.addChild(this);
    }

    createHeightMap() {

        let i = 0;
        let j = 0;
        let k = 0;
        let lancunarity = 1.8715;
        let gain = 1.0 / lancunarity;

        // let damper = changeScale(noise.perlin2(this.x, this.z), -0.5, 0.5, 1, 10);
        let damper = 3;

        console.log(damper);

        for (let x = this.x * Chunk.CHUNK_SIZE_X; x < this.x * Chunk.CHUNK_SIZE_X + Chunk.CHUNK_SIZE_X; ++x) {
            for (let z = this.z * Chunk.CHUNK_SIZE_Z; z < this.z * Chunk.CHUNK_SIZE_Z + Chunk.CHUNK_SIZE_Z; ++z) {

                let y = 0.0;
                let frequency = 0.025;
                let amplitude = gain * damper;

                for (k = 0; k < Chunk.OCTAVES; ++k) {    
                    
                    y += noise.perlin2(x * frequency, z * frequency) * amplitude;
                    frequency *= lancunarity;
                    amplitude *= gain;

                    // let changeFactor = .05;
                    // let scale = 15;
                    // let y = perlin.get(x * changeFactor, z * changeFactor);
                    // y = y * scale;
                }

                y = clamp(y, -1, 1);
                y = changeScale(y, -1, 1, 1, Chunk.WORLD_HEIGHT - 1);

                y = Math.round(y);
                this.height[i][j] = y;

                j++;
            }
            i++;
            j = 0;
        }
    }

    createBlocks() {
        let bufferBlocks = this.world.getChunkFromBuffer(this.x, this.z);

        this.world.removeChunkFromBuffer(this.x, this.z);

        for (let i = 0; i < bufferBlocks.length; ++i) {
            let block = bufferBlocks[i];
            block.setChunk(this);
        }

        //use heightmap, set everything to stone
        for (let x = 0; x < Chunk.CHUNK_SIZE_X; ++x) {
            for (let z = 0; z < Chunk.CHUNK_SIZE_Z; ++z) {
                for (let y = 0; y < this.height[x][z]; ++y) {
                    new Block(x, y, z, this, Block.Type.STONE);
                }
            }
        }

        //fill up to sea level with water
        for (let x = 0; x < Chunk.CHUNK_SIZE_X; ++x) {
            for (let z = 0; z < Chunk.CHUNK_SIZE_Z; ++z) {
                for (let y = 0; y < Chunk.SEA_LEVEL; ++y) {
                    if (this.blocks[x][y][z] == null) {
                        new Block(x, y, z, this, Block.Type.WATER);
                    }
                }
            }
        }

        for (let x = 0; x < Chunk.CHUNK_SIZE_X; ++x) {
            for (let z = 0; z < Chunk.CHUNK_SIZE_Z; ++z) {
                let y = this.height[x][z] - 1;
                let block = this.blocks[x][y][z];

                //make top layer grass with 2 blocks dirt under it
                if (block.blockType != Block.Type.WATER && !block.hasUpstairsNeighbor()) {
                    this.blocks[x][y][z].blockType = Block.Type.GRASS;
                    this.blocks[x][y - 1][z].blockType = Block.Type.DIRT;
                    this.blocks[x][y - 2][z].blockType = Block.Type.DIRT;


                    //add trees
                    if (block.blockType != Block.Type.WATER && getRandomInteger(1, 30) == 10) {
                       // this.buildTree(x, y + 1, z);
                    }
                }
            }
        }
    }

    /**
     * Determines if the blocks in the cube with the given vertices are empty
     */
    isEmpty(x1, y1, z1, x2, y2, z2) {
        let tmp;
        if (x1 > x2) {
            tmp = x1;
            x1 = x2;
            x2 = tmp
        }
        if (y1 > y2) {
            tmp = y1;
            y1 = y2;
            y2 = tmp
        }
        if (z1 > z2) {
            tmp = z1;
            z1 = z2;
            z2 = tmp
        }

        for (let x = Math.max(x1, 0); x <= x2 && x < Chunk.CHUNK_SIZE_X; x++) {
            for (let y = Math.max(y1, 0); y <= y2 && y < Chunk.WORLD_HEIGHT; y++) {
                for (let z = Math.max(z1, 0); z <= z2 && z < Chunk.CHUNK_SIZE_Z; z++) {
                    if (this.blocks[x][y][z] != null) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    buildTreeHelper(i, j) {
        let chunk = null;
        let bufferKey = null;
        let xIndex;
        let zIndex;
        let xMax = Chunk.CHUNK_SIZE_X;
        let zMax = Chunk.CHUNK_SIZE_Z;

        if (i >= 0 && i < xMax && j >= 0 && j < zMax) {
            //this chunk
            chunk = this;
            xIndex = i;
            zIndex = j;
        }
        else if (i < 0 && j < 0) {
            //southwest
            chunk = this.world.chunks[this.x - 1][this.z - 1];
            bufferKey = [this.x - 1, this.z - 1];
            xIndex = i + xMax;
            zIndex = j + zMax;
        }
        else if (i < 0 && j >= zMax) {
            //northwest
            chunk = this.world.chunks[this.x - 1][this.z + 1];
            bufferKey = [this.x - 1, this.z + 1];
            xIndex = i + xMax;
            zIndex = j - zMax;
        }
        else if (i >= xMax && j < 0) {
            //southeast
            chunk = this.world.chunks[this.x + 1][this.z - 1];
            bufferKey = [this.x + 1, this.z - 1];
            xIndex = i - xMax;
            zIndex = j + zMax;
        }
        else if (i >= xMax && j >= zMax) {
            //northeast
            chunk = this.world.chunks[this.x + 1][this.z + 1];
            bufferKey = [this.x + 1, this.z + 1];
            xIndex = i - xMax;
            zIndex = j - zMax;
        }
        else if (i < 0) {
            //west
            chunk = this.world.chunks[this.x - 1][this.z];
            bufferKey = [this.x - 1, this.z];
            xIndex = i + xMax;
            zIndex = j;
        }
        else if (j < 0) {
            //south
            chunk = this.world.chunks[this.x][this.z - 1];
            bufferKey = [this.x, this.z - 1];
            xIndex = i;
            zIndex = j + zMax;
        }
        else if (i >= xMax) {
            //east
            chunk = this.world.chunks[this.x + 1][this.z];
            bufferKey = [this.x + 1, this.z];
            xIndex = i - xMax;
            zIndex = j;
        }
        else if (j >= zMax) {
            //north
            chunk = this.world.chunks[this.x][this.z + 1];
            bufferKey = [this.x, this.z + 1];
            xIndex = i;
            zIndex = j - zMax;
        }

        return {
            "chunk" : chunk,
            "bufferKey" : bufferKey,
            "xIndex" : xIndex,
            "zIndex" : zIndex
        }
    }

    /**
     * Places tree with base at x, y, z
     */
    buildTree(x, y, z) {

        if (!this.isEmpty(x - 1, y, z - 1, x + 1, y + 4, z + 1)) {
            return;
        }

        new Block(x, y - 1, z, this, Block.Type.DIRT);

        for (let i = y; i < y + 6; ++i) {
            new Block(x, i, z, this, Block.Type.LOG);
        }

        for (let i = x - 2; i <= x + 2; i++) {
            for (let j = z - 2; j <= z + 2; j++) {

                let helper = this.buildTreeHelper(i, j);

                let chunk = helper.chunk;
                let bufferKey = helper.bufferKey;
                let xIndex = helper.xIndex;
                let zIndex = helper.zIndex;

                let block1 = new Block(xIndex, y + 3, zIndex, null, Block.Type.LEAVES);
                let block2 = new Block(xIndex, y + 4, zIndex, null, Block.Type.LEAVES);

                if (chunk != null) {

                    if (chunk.blocks[xIndex][y + 3][zIndex] == null) {
                        block1.setChunk(chunk);
                    }
                    if (chunk.blocks[xIndex][y + 4][zIndex] == null) {
                        block2.setChunk(chunk);
                    }
                }
                else {
                    this.world.addBlockToBuffer(bufferKey[0], bufferKey[1], block1);
                    this.world.addBlockToBuffer(bufferKey[0], bufferKey[1], block2);
                }
            }
        }

        for (let i = x - 1; i <= x + 1; i++) {
            for (let j = z - 1; j <= z + 1; j++) {
                let helper = this.buildTreeHelper(i, j);

                let chunk = helper.chunk;
                let bufferKey = helper.bufferKey;
                let xIndex = helper.xIndex;
                let zIndex = helper.zIndex;

                let block1 = new Block(xIndex, y + 5, zIndex, null, Block.Type.LEAVES);
                let block2 = new Block(xIndex, y + 6, zIndex, null, Block.Type.LEAVES);

                if (chunk != null) {

                    if (chunk.blocks[xIndex][y + 5][zIndex] == null) {
                        block1.setChunk(chunk);
                    }
                    if (chunk.blocks[xIndex][y + 6][zIndex] == null) {
                        block2.setChunk(chunk);
                    }
                }
                else {
                    this.world.addBlockToBuffer(bufferKey[0], bufferKey[1], block1);
                    this.world.addBlockToBuffer(bufferKey[0], bufferKey[1], block2);
                }
            }
        }
    }

    getHighestY(x, z) {
        let y;
        for (y = 0; this.blocks[x][y][z] != null; ++y);
        return y;
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
        for (var i = 0; i < this.children.length; ++i) {
            let child = this.children[i];

            if (child.needsUpdate) {
                child.update();
            }

            let dontDraw = child.isSurrounded();

            if (!dontDraw) {
                child.render(current);
            }
        }
    }
}