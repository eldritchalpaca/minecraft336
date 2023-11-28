class World extends CS336Object {

    static WORLD_SIZE = 5;

    constructor() {
        super();

        this.setPosition(0, 0, 0);

        this.chunks = createNDimArray([World.WORLD_SIZE, World.WORLD_SIZE]);

        this.createChunks();
    }

    createChunks() {
        for (let x = 0; x < World.WORLD_SIZE; x++) {
            for (let z = 0; z < World.WORLD_SIZE; z++) {
                this.chunks[x][z] = new Chunk(x, z, this);
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

        child.render(current);
    }
  }
}