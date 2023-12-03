class Chunk extends CS336Object {

    static CHUNK_SIZE_X = 16;
    static CHUNK_SIZE_Z = 16;
    static WORLD_HEIGHT = 64;

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
                    this.blocks[x][y][z] = new Block(x, y, z, this);
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
        let dontDraw = (child instanceof Block) && child.isSurrounded();

        if (!dontDraw) {
            child.render(current);
        }
    }
  }
}