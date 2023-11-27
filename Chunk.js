class Chunk extends CS336Object {

    static CHUNK_SIZE_X = 16;
    static CHUNK_SIZE_Z = 16;
    static WORLD_HEIGHT = 8;

    constructor(x, z, world) {
        super();

        this.blocks = createNDimArray([Chunk.CHUNK_SIZE_X, Chunk.WORLD_HEIGHT, Chunk.CHUNK_SIZE_Z]);

        for (let x = 0; x < Chunk.CHUNK_SIZE_X; ++x) {
            for (let y = 0; y < Chunk.WORLD_HEIGHT; ++y) {
                for (let z = 0; z < Chunk.CHUNK_SIZE_Z; ++z) {
                    this.blocks[x][y][z] = null;
                }
            }
        }


        this.setPosition(Chunk.CHUNK_SIZE_X * x, 0, Chunk.CHUNK_SIZE_Z * z);

        this.createBlocks();

        world.addChild(this);

        this.world = world;
        this.x = x;
        this.z = z;
    }

    createBlocks() {
        
        for (let x = 0; x < Chunk.CHUNK_SIZE_X; ++x) {
            for (let y = Chunk.WORLD_HEIGHT / 2 - 1; y > -1; --y) {
                for (let z = 0; z < Chunk.CHUNK_SIZE_Z; ++z) {
                    this.blocks[x][y][z] = new Block(x, y, z, this);
                    //console.log(x, y, z);
                }
            }
        }
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