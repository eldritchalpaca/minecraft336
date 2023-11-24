class Chunk extends CS336Object {

    static CHUNK_SIZE_X = 2;
    static CHUNK_SIZE_Y = 2;

    constructor(x, y, world) {
        super();
        this.setPosition(Chunk.CHUNK_SIZE_X * x, Chunk.CHUNK_SIZE_Y * y, 0);
        world.addChild(this);
    }
}