const BlockType = {
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

const CHUNK_SIZE_X = 16;
const CHUNK_SIZE_Z = 16;
const WORLD_HEIGHT = 128;
const SEA_LEVEL = WORLD_HEIGHT / 4;
const OCTAVES = 3;

const WORLD_SIZE = 100;
const PLAYER_HEIGHT = 1.97;
const RENDER_DISTANCE = 4;