//treeRate: lower number means more trees. 1000 means 1 in 1000 chance that a tree will spawn, 2 means 1 in 2 chance etc

const PLAINS = {
    amplitude : 0.15,
    frequency : 0.025,
    top_block : BlockType.GRASS,
    under_block : BlockType.DIRT,
    hasTrees : true,
    treeRate : 1000,
    lowestPoint : SEA_LEVEL,
    highestPoint : WORLD_HEIGHT - 1
}

const DESERT = {
    amplitude : 0.2,
    frequency : 0.025,
    top_block : BlockType.SAND,
    under_block : BlockType.SAND,
    hasTrees : false,
    lowestPoint : SEA_LEVEL,
    highestPoint : WORLD_HEIGHT - 1
}

const MOUNTAIN = {
    amplitude : 2,
    frequency : 0.025,
    top_block : BlockType.GRASS,
    under_block : BlockType.DIRT,
    hasTrees : true,
    treeRate : 100,
    lowestPoint : SEA_LEVEL,
    highestPoint : WORLD_HEIGHT - 1
}

const ISLANDS = {
    amplitude : 1.1,
    frequency : 0.025,
    top_block : BlockType.GRASS,
    under_block : BlockType.DIRT,
    hasTrees : true,
    treeRate : 100,
    lowestPoint : 1,
    highestPoint : WORLD_HEIGHT / 2
}

const FOREST = {
    amplitude : 0.15,
    frequency : 0.025,
    top_block : BlockType.GRASS,
    under_block : BlockType.DIRT,
    hasTrees : true,
    treeRate : 50,
    lowestPoint : SEA_LEVEL,
    highestPoint : WORLD_HEIGHT - 1
}

function randomBiome() {
    let biomes = [
        PLAINS,
        DESERT,
        MOUNTAIN,
        ISLANDS,
        FOREST
    ]

    let index = getRandomInteger(0, biomes.length - 1);

    return biomes[index];
}