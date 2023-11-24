class Block extends CS336Object {
    constructor(x, y, z, chunk) {
        super(drawCube);
        this.setPosition(x, y, z);
        chunk.addChild(this);
    }
}