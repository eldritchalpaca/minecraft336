class Chunk extends CS336Object {

    constructor(x, z, world, biome) {
        super();

        this.blocks = createNDimArray([CHUNK_SIZE_X, WORLD_HEIGHT, CHUNK_SIZE_Z]);
        this.height = createNDimArray([CHUNK_SIZE_X, CHUNK_SIZE_Z]);

        this.world = world;
        this.x = x;
        this.z = z;
        this.biome = biome;

        for (let x = 0; x < CHUNK_SIZE_X; ++x) {
            for (let y = 0; y < WORLD_HEIGHT; ++y) {
                for (let z = 0; z < CHUNK_SIZE_Z; ++z) {
                    this.blocks[x][y][z] = null;
                }
            }
        }


        this.setPosition(CHUNK_SIZE_X * x, 0, CHUNK_SIZE_Z * z);

        this.createHeightMap(biome.amplitude, biome.frequency);

        this.createBlocks(biome.top_block, biome.under_block);

        world.addChild(this);
    }

    createHeightMap(damper, freq) {

        let i = 0;
        let j = 0;
        let k = 0;
        let lancunarity = 1.8715;
        let gain = 1.0 / lancunarity;

        for (let x = this.x * CHUNK_SIZE_X; x < this.x * CHUNK_SIZE_X + CHUNK_SIZE_X; ++x) {
            for (let z = this.z * CHUNK_SIZE_Z; z < this.z * CHUNK_SIZE_Z + CHUNK_SIZE_Z; ++z) {

                let y = 0.0;
                let frequency = freq;
                let amplitude = gain * damper;

                for (k = 0; k < OCTAVES; ++k) {    
                    
                    y += noise.perlin2(x * frequency, z * frequency) * amplitude;
                    frequency *= lancunarity;
                    amplitude *= gain;
                }

                y = clamp(y, -0.75, 1);
                y = changeScale(y, -0.75, 1, this.biome.lowestPoint, this.biome.highestPoint);

                y = Math.round(y);
                this.height[i][j] = y;

                j++;
            }
            i++;
            j = 0;
        }
    }

    createBlocks(topBlock, topBlock2) {
        let bufferBlocks = this.world.getChunkFromBuffer(this.x, this.z);

        this.world.removeChunkFromBuffer(this.x, this.z);

        for (let i = 0; i < bufferBlocks.length; ++i) {
            let block = bufferBlocks[i];
            block.setChunk(this);
        }

        //use heightmap, set everything to stone
        for (let x = 0; x < CHUNK_SIZE_X; ++x) {
            for (let z = 0; z < CHUNK_SIZE_Z; ++z) {
                for (let y = 0; y < this.height[x][z]; ++y) {
                    new Block(x, y, z, this, BlockType.STONE);
                }
            }
        }

        //fill up to sea level with water
        for (let x = 0; x < CHUNK_SIZE_X; ++x) {
            for (let z = 0; z < CHUNK_SIZE_Z; ++z) {
                for (let y = 0; y < SEA_LEVEL; ++y) {
                    if (this.blocks[x][y][z] == null) {
                        new Block(x, y, z, this, BlockType.WATER);
                    }
                }
            }
        }

        for (let x = 0; x < CHUNK_SIZE_X; ++x) {
            for (let z = 0; z < CHUNK_SIZE_Z; ++z) {
                let y = this.height[x][z] - 1;
                let block = this.blocks[x][y][z];

                //make top layer grass with 2 blocks dirt under it
                if (block.blockType != BlockType.WATER && !block.hasUpstairsNeighbor()) {
                    this.blocks[x][y][z].blockType = topBlock;
                    this.blocks[x][y - 1][z].blockType = topBlock2;
                    this.blocks[x][y - 2][z].blockType = topBlock2;


                    //add trees
                    if (this.biome.hasTrees && block.blockType != BlockType.WATER && getRandomInteger(1, this.biome.treeRate) == 1) {
                       this.buildTree(x, y + 1, z);
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

        for (let x = Math.max(x1, 0); x <= x2 && x < CHUNK_SIZE_X; x++) {
            for (let y = Math.max(y1, 0); y <= y2 && y < WORLD_HEIGHT; y++) {
                for (let z = Math.max(z1, 0); z <= z2 && z < CHUNK_SIZE_Z; z++) {
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
        let xMax = CHUNK_SIZE_X;
        let zMax = CHUNK_SIZE_Z;

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

        new Block(x, y - 1, z, this, BlockType.DIRT);

        for (let i = y; i < y + 6; ++i) {
            new Block(x, i, z, this, BlockType.LOG);
        }

        for (let i = x - 2; i <= x + 2; i++) {
            for (let j = z - 2; j <= z + 2; j++) {

                let helper = this.buildTreeHelper(i, j);

                let chunk = helper.chunk;
                let bufferKey = helper.bufferKey;
                let xIndex = helper.xIndex;
                let zIndex = helper.zIndex;

                let block1 = new Block(xIndex, y + 3, zIndex, null, BlockType.LEAVES);
                let block2 = new Block(xIndex, y + 4, zIndex, null, BlockType.LEAVES);

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

                let block1 = new Block(xIndex, y + 5, zIndex, null, BlockType.LEAVES);
                let block2 = new Block(xIndex, y + 6, zIndex, null, BlockType.LEAVES);

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