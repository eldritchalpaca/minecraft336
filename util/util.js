function createNDimArray(dimensions) {
    var t, i = 0, s = dimensions[0], arr = new Array(s);
    if ( dimensions.length < 3 ) for ( t = dimensions[1] ; i < s ; ) arr[i++] = new Array(t);
    else for ( t = dimensions.slice(1) ; i < s ; ) arr[i++] = createNDimArray(t);
    return arr;
}

function changeScale(val, oldLow, oldHigh, newLow, newHigh) {
    return (val - oldLow) * (newHigh - newLow) / (oldHigh - oldLow) + newLow;
}

/**
 * bounds inclusive
 */
function getRandomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
  }

  function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }