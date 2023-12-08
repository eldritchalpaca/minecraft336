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
        
        this.x = x;
        this.y = y;
        this.z = z;
        this.blockType = blockType;

        this.visible = false;
        this.needsUpdate = true;
        this.isHighlighted = false;

        if (chunk != null) {
            this.setChunk(chunk);
        }
    }

    destroy() {
        this.chunk.blocks[this.x][this.y][this.z] = null;
        this.chunk.removeChild(this);
        this.getNeighbors().forEach(function(block) {
            block.needsUpdate = true;
        });
        setHighlightedBlock();
    }

    equals(o) {
        return this.x == o.x && this.y == o.y && this.z == o.z && this.chunk.x == o.chunk.x && this.chunk.z == o.chunk.z;
    }

    setChunk(chunk) {
        chunk.addChild(this);
        chunk.blocks[this.x][this.y][this.z] = this;
        this.chunk = chunk;
    }

    update() {
        this.isSurrounded();
        this.needsUpdate = false;
    }

    hasNorthNeighbor() {
        return this.getNorthNeighbor() != null;
    }

    getNorthNeighbor() {

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

        return neighbor;
    }

    hasSouthNeighbor() {
        return this.getSouthNeighbor() != null;
    }
    getSouthNeighbor() {
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

        return neighbor;
    }

    hasEastNeighbor() {
        return this.getEastNeighbor() != null;
    }
    getEastNeighbor() {
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

        return neighbor;
    }
    hasWestNeighbor() {
        return this.getWestNeighbor() != null;
    }
    getWestNeighbor() {

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

        return neighbor;
    }

    hasUpstairsNeighbor() {
        return this.getUpstairsNeighbor() != null;
    }
    getUpstairsNeighbor() {
        let neighbor;
        try {
            neighbor = this.chunk.blocks[this.x][this.y + 1][this.z];
        } catch (err) {
            neighbor = null;
        }
        return neighbor;
    }
    hasDownstairsNeighbor(){
        return this.getDownstairsNeighbor() != null;
    }
    getDownstairsNeighbor() {
        let neighbor;
        try {
            neighbor = this.chunk.blocks[this.x][this.y - 1][this.z];
        } catch (err) {
            neighbor = null;
        }
        return neighbor;
    }

    getNeighbors() {
        let neighbors = [];

        let block = this.getUpstairsNeighbor();
        block != null ? neighbors.push(block) : null;

        block = this.getDownstairsNeighbor();
        block != null ? neighbors.push(block) : null;

        block = this.getEastNeighbor();
        block != null ? neighbors.push(block) : null;

        block = this.getWestNeighbor();
        block != null ? neighbors.push(block) : null;

        block = this.getNorthNeighbor();
        block != null ? neighbors.push(block) : null;

        block = this.getSouthNeighbor();
        block != null ? neighbors.push(block) : null;

        return neighbors;
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
        this.drawObject(current, this.blockType, this.isHighlighted);
    }
}