class Chunk extends CS336Object {

    static CHUNK_SIZE_X = 16;
    static CHUNK_SIZE_Z = 16;
    static WORLD_HEIGHT = 64;
    static SEA_LEVEL = 32;

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

        for (let x = this.x * Chunk.CHUNK_SIZE_X; x < this.x * Chunk.CHUNK_SIZE_X + Chunk.CHUNK_SIZE_X; ++x) {
            for (let z = this.z * Chunk.CHUNK_SIZE_Z; z < this.z * Chunk.CHUNK_SIZE_Z + Chunk.CHUNK_SIZE_Z; ++z) {

                let changeFactor = .05;
                let scale = 15;
                let y = perlin.get (x * changeFactor, z * changeFactor);
                y = y * scale;

                y = changeScale(y, -1 * scale, 1 * scale, 0, Chunk.WORLD_HEIGHT);

                y = Math.round(y);

                this.height[i][j] = y;

                j++;
            }
            i++;
            j = 0;
        }
    }

    createBlocks() {
        for (let x = 0; x < Chunk.CHUNK_SIZE_X; ++x) {
            for (let z = 0; z < Chunk.CHUNK_SIZE_Z; ++z) {
                for (let y = 0; y < this.height[x][z]; ++y) {
                    new Block(x, y, z, this, Block.Type.STONE);
                }
            }
        }

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

                if (block.blockType != Block.Type.WATER && !block.hasUpstairsNeighbor()) {
                    this.blocks[x][y][z].blockType      = Block.Type.GRASS;
                    this.blocks[x][y - 1][z].blockType  = Block.Type.DIRT;
                    this.blocks[x][y - 2][z].blockType  = Block.Type.DIRT;

                    if (block.blockType != Block.Type.WATER && getRandomInteger(1, 30) == 10) {
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

        for (let i = Math.max(x - 2, 0); i <= x + 2 && i < Chunk.CHUNK_SIZE_X; i++) {
            for (let j = Math.max(z - 2, 0); j <= z + 2 && j < Chunk.CHUNK_SIZE_Z; j++) {
                if (this.blocks[i][y + 3][j] == null) {
                    new Block(i, y + 3, j, this, Block.Type.LEAVES);
                }
                if (this.blocks[i][y + 4][j] == null) {
                    new Block(i, y + 4, j, this, Block.Type.LEAVES);
                }
            }
        }

        for (let i = Math.max(x - 1, 0); i <= x + 1 && i < Chunk.CHUNK_SIZE_X; i++) {
            for (let j = Math.max(z - 1, 0); j <= z + 1 && j < Chunk.CHUNK_SIZE_Z; j++) {
                if (this.blocks[i][y + 5][j] == null) {
                    new Block(i, y + 5, j, this, Block.Type.LEAVES);
                }
                if (this.blocks[i][y + 6][j] == null) {
                    new Block(i, y + 6, j, this, Block.Type.LEAVES);
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