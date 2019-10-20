importScripts("perlin.js");

const perlin = new Perlin();

const posOffset = (x,y,z) => z * 256 + y * 16 + x;

function createNetherChunk(x, y) {
    var result = {
        x: x, y: y,
        dirty: true,
        saved: true,
        data: []
    };

    // bedrock layer
    for (var j=0; j<16*16; j++) {
        result.data.push(1);
    }

    var extraLayer = 127 - (result.data.length / (16*16));
    for (var i=0; i<extraLayer; i++) {

        for (var j=0; j<16*16; j++) {
            result.data.push(0);
        }

    }

    for (var x2=0; x2<16; x2++)
    for (var y2=0; y2<16; y2++)
    for (var z2=1; z2<127; z2++) {

        

        const realX = x*16+x2;
        const realY = y*16+y2;

        var val = perlin.get(realX * 0.1, realY * 0.1, z2 * 0.1);

        var factor = Math.min(0.6, Math.pow( Math.min(z2, 127-z2),2)/400);
        
        //=MIN(POW(MIN(A1,127-A1),2)/400, 0.6)


        if (val > factor) {
            result.data[posOffset(x2,y2,z2)] = 16;
        } else {
            if (z2 < 20) {
                result.data[posOffset(x2,y2,z2)] = 18;
            }
        }
    }

    // bedrock layer
    for (var j=0; j<16*16; j++) {
        result.data.push(1);
    }

    return result;
}

function createChunk(x, y) {
    var result = {
        x: x, y: y,
        dirty: true,
        saved: true,
        data: []
    };

    // bedrock layer
    for (var j=0; j<16*16; j++) {
        result.data.push(1);
    }

    var extraLayer = 128 - (result.data.length / (16*16));
    for (var i=0; i<extraLayer; i++) {

        for (var j=0; j<16*16; j++) {
            result.data.push(0);
        }

    }

    for (var x2=0; x2<16; x2++)
    for (var y2=0; y2<16; y2++) {

        const realX = x*16+x2;
        const realY = y*16+y2;

        //const height = Math.floor(perlin.get(realX*0.05,realY*0.05,0.5) * 10)+25;

        //var height = perlin.get(realX*0.005,realY*0.005,0.5);
        //height += (perlin.get(realX * 0.05, realY * 0.05, 0.5) - 0.5) * 0.2;

        //height = Math.floor(height*80)+10;
        var multiply = 0.005;
        var multiply2 = 0.04;
        var rough = perlin.get(realX * multiply,realY * multiply, 0.5);
        rough += (perlin.get(realX * multiply2, realY * multiply2, 0.5) - 0.5) * 0.2;
        
        rough = Math.max(Math.min((rough-0.5) * 10, 1.0), 0.0);

        var noGrass = rough > 0.05 && rough < 0.95;

        rough += (perlin.get(realX * multiply2, realY * multiply2, 0.5) - 0.5) * 0.2;

        var height = rough * 50 + 4;

        height = Math.floor(height);

        for (var i=0; i<height; i++) {
            result.data[posOffset(x2,y2,i+1)] = 2;
        }
        result.data[posOffset(x2,y2,height+1)] = noGrass ? 2 : 4;
        result.data[posOffset(x2,y2,height+2)] = noGrass ? 2 : 4;
        result.data[posOffset(x2,y2,height+3)] = noGrass ? 2 : 5;
    }

    for (var x2=0; x2<16; x2++)
    for (var y2=0; y2<16; y2++)
    for (var z2=0; z2<64; z2++) {

        if (result.data[posOffset(x2,y2,z2)] != 2)  continue;

        const realX = x*16+x2;
        const realY = y*16+y2;

        var val = perlin.get(realX * 0.1, realY * 0.1, z2 * 0.1);

        if (val > 0.8) {
            result.data[posOffset(x2,y2,z2)] = 10;
        } 
    }

    return result;
}

function createMinimalChunk(x, y) {
    var result = {
        x: x, y: y,
        dirty: true,
        saved: true,
        data: []
    };

    // bedrock layer
    for (var j=0; j<16*16; j++) {
        result.data.push(1);
    }

    // air layers
    for (var i=0; i<127; i++) {
        for (var j=0; j<16*16; j++) {
            result.data.push(0);
        }
    }

    return result;
}

let exposedFunctions = {
    createNetherChunk: createNetherChunk,
    createChunk: createChunk,
    createMinimalChunk: createMinimalChunk
};

onmessage = function(e) {
    console.log("Worker: message received", e.data);

    const func = exposedFunctions[e.data.function];
    const params = e.data.parameters;
    const tag = e.data.tag;
    const result = func.apply(null, params);

    postMessage({
        result: result,
        tag: tag
    });
    
}