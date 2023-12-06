class Block extends CS336Object {

    static Type = {
        BEDROCK : 0,
        STONE : 1,
        ORE : 2,
        GRAVEL : 3,
        DIRT : 4,
        GRASS : 5,
        SAND : 6,
        LOG : 7,
        LEAVES : 8,
        WATER : 9
    }

    constructor(x, y, z, chunk, blockType) {
        super(drawCube);
        this.setPosition(x, y, z);
        chunk.addChild(this);

        chunk.blocks[x][y][z] = this;
        this.chunk = chunk;
        this.x = x;
        this.y = y;
        this.z = z;
        this.blockType = blockType;

        this.visible = false;
        this.needsUpdate = true;
    }

    update() {
        this.isSurrounded();
        this.needsUpdate = false;
    }

    hasNorthNeighbor() {

        let neighbor;

        if (this.z - 1 < 0 && this.chunk.z > 0) {
            let neighborChunk = this.chunk.world.chunks[this.chunk.x][this.chunk.z - 1];
            if (neighborChunk == null) {
                return null;
            }
            neighbor = neighborChunk.blocks[this.x][this.y][Chunk.CHUNK_SIZE_Z - 1];
        }
        else if (this.z - 1 < 0) {
            neighbor = null;
        }
        else {
            neighbor = this.chunk.blocks[this.x][this.y][this.z - 1];
        }

        return neighbor != null;
    }
    hasSouthNeighbor() {
        let neighbor;

        if (this.z + 1 > Chunk.CHUNK_SIZE_Z - 1 && this.chunk.z < World.WORLD_SIZE - 1) {
            let neighborChunk = this.chunk.world.chunks[this.chunk.x][this.chunk.z + 1];
            if (neighborChunk == null) {
                return null;
            }
            neighbor = neighborChunk.blocks[this.x][this.y][0];
        }
        else if (this.z + 1 > Chunk.CHUNK_SIZE_Z - 1) {
            neighbor = null;
        }
        else {
            neighbor = this.chunk.blocks[this.x][this.y][this.z + 1];
        }

        return neighbor != null;
    }
    hasEastNeighbor() {
        let neighbor;

        if (this.x + 1 > Chunk.CHUNK_SIZE_X - 1 && this.chunk.x < World.WORLD_SIZE - 1) {
            let neighborChunk = this.chunk.world.chunks[this.chunk.x + 1][this.chunk.z];
            if (neighborChunk == null) {
                return null;
            }
            neighbor = neighborChunk.blocks[0][this.y][this.z];
        }
        else if (this.x + 1 > Chunk.CHUNK_SIZE_X - 1) {
            neighbor = null;
        } 
        else {
            neighbor = this.chunk.blocks[this.x + 1][this.y][this.z];
        }

        return neighbor != null;
    }
    hasWestNeighbor() {

        let neighbor;

        if (this.x - 1 < 0 && this.chunk.x > 0) {
            let neighborChunk = this.chunk.world.chunks[this.chunk.x - 1][this.chunk.z];
            if (neighborChunk == null) {
                return null;
            }
            neighbor = neighborChunk.blocks[Chunk.CHUNK_SIZE_X - 1][this.y][this.z];
        }
        else if (this.x - 1 < 0) {
            neighbor = null;
        }
        else {
            neighbor = this.chunk.blocks[this.x - 1][this.y][this.z];
        }

        return neighbor != null;
    }
    hasUpstairsNeighbor() {
        let neighbor;
        try {
            neighbor = this.chunk.blocks[this.x][this.y + 1][this.z];
        } catch (err) {
            neighbor = null;
        }
        return neighbor != null;
    }
    hasDownstairsNeighbor() {
        let neighbor;
        try {
            neighbor = this.chunk.blocks[this.x][this.y - 1][this.z];
        } catch (err) {
            neighbor = null;
        }
        return neighbor != null;
    }
    isSurrounded() {
        if (!this.needsUpdate) {
            return !this.visible
        }

        let surrounded =    this.hasUpstairsNeighbor()  && this.hasDownstairsNeighbor() && 
                            this.hasNorthNeighbor()     && this.hasSouthNeighbor() && 
                            this.hasEastNeighbor()      && this.hasWestNeighbor();

        this.visible = !surrounded;

        return surrounded;
    }

    isOnChunkBorder() {
        return this.x == 0 || this.z == 0 || this.x == Chunk.CHUNK_SIZE_X - 1 || this.z == Chunk.CHUNK_SIZE_Z - 1;
    }

    render(matrixWorld) {
        var current = new THREE.Matrix4().copy(matrixWorld).multiply(this.getMatrix());
        this.drawObject(current, this.blockType);
    }
}