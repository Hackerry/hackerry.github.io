const ALL_DEGREE = 2*Math.PI;
const initialScale = 10;       // Scale up the base 1.0 to 10.0 for obj files

// Inspiration from & A good walkthrough
// https://wblut.com/reading-an-obj-file-in-processing/
function parseObjFile(input) {
    var lines = input.split('\n');
    var points = {};
    var counter = 1;            // Obj file is 1-based indexing
    var edges = [];
    for(var i = 0; i < lines.length; i++) {
        var parts = lines[i].split(' ');
        switch(parts[0]) {
            case 'v':
                // A vertex, store it
                var coordinates = lines[i].split(' ');
                var newPoint = [parseFloat(coordinates[1])*initialScale, parseFloat(coordinates[2])*initialScale, parseFloat(coordinates[3])*initialScale];
                points[counter++] = newPoint;
                break;
            case 'f':
                // A face, record edges
                var facePoints = lines[i].split(' ');
                var lastPoint = null, currPoint;
                for(var j = 1; j < facePoints.length; j++) {
                    currPoint = facePoints[j].split('/')[0];

                    if(lastPoint !== null) {
                        edges.push([lastPoint, currPoint]);
                    }

                    lastPoint = currPoint;
                }

                // Closed face
                edges.push([lastPoint, facePoints[1].split('/')[0]]);
                break;
            default:
                continue;
        }
    }

    // console.log(points, edges);
    console.log("Loaded", Object.keys(points).length, "vertices and", edges.length, "edges");

    return [points, edges];
}

function getCube(size) {
    if(size <= 0) {
        console.error("Cube size is not positive");
        return [null, null];
    }
    size /= 2.0;
    var points = {
        'a': [size,size,size],
        'b': [size,-size,size],
        'c': [size,size,-size],
        'd': [-size,size,size],
        'e': [size,-size,-size],
        'f': [-size,size,-size],
        'g': [-size,-size,size],
        'h': [-size,-size,-size],
    };
    var edges = [['a', 'b'], ['a', 'c'], ['a', 'd'], ['b', 'e'], ['b', 'g'], ['c', 'e'], ['c', 'f'], ['d', 'f'], ['d', 'g'], ['e', 'h'], ['f', 'h'], ['g', 'h']];

    return [points, edges];
}

function getTetrahedron(height) {
    if(size <= 0) {
        console.error("Tetrahedron size is not positive");
        return [null, null];
    }
    var size = 2.0 * height / Math.sqrt(3);
    var upperHeight = size / Math.sqrt(3);
    var lowerHeight = height - upperHeight;
    var points = {
        a: [0,0,upperHeight],
        b: [-size/2,-lowerHeight,-lowerHeight],
        c: [size/2,-lowerHeight,-lowerHeight],
        d: [0,upperHeight,-lowerHeight]
    }
    var edges = [['a', 'b'], ['a', 'c'], ['a', 'd'], ['b', 'c'], ['b', 'd'], ['c', 'd']];

    return [points, edges];
}

function getPointsOnCircle(radius, numPoints) {
    // Polar point
    if(radius === 0) {
        return [[0, 0, 0]];
    }

    // Edge case check
    if(radius < 0) {
        console.error("Circle radius is negative");
        return null;
    } else if(numPoints <= 0) {
        console.error("Circle loop # is negative");
        return null;
    }

    var gapDegree = ALL_DEGREE / numPoints;
    // console.log('Circle gap degree:', toDegree(gapDegree));

    var points = [];
    var startPoint = [radius, 0, 0];
    for(var i = 0; i < numPoints; i++) {
        var newPoint = [[...startPoint]];
        rotateZ(newPoint, i*gapDegree)
        points.push(newPoint[0]);
    }

    // console.log('Circle points:', points);

    return points;
}

function getSphere(radius, numLoops) {
    // Edge case check
    if(radius < 0) {
        console.error("Sphere radius is negative");
        return [null, null];
    } else if(numLoops <= 1) {
        console.error("Sphere loop # is <= 1");
        return [null, null];
    }

    var points = {};
    var edges = [];
    var counter = 0;
    var gapDegree = ALL_DEGREE / (2 * numLoops);
    // console.log('Loop gap degree:', toDegree(gapDegree));

    // Add latitude loops
    for(var i = 1; i < numLoops; i++) {
        var circlePoints = getPointsOnCircle(Math.cos(Math.PI/2 - i*gapDegree) * radius, numLoops);

        // Get z coordinate
        var z = Math.sin(Math.PI/2 - i*gapDegree) * radius;

        // Add latitude points and connect them
        var startCounter = counter;
        // console.log("Connect to prev loop");
        for(var j in circlePoints) {
            var point = circlePoints[j];
            point[2] = z;

            // Connect vertices to form longitude loops
            if(i !== 1) {
                edges.push([counter, counter-numLoops]);
                // console.log("Add edge:", [counter, counter-numLoops]);
            }
            points[counter++] = point;
        }

        // Connect vertices to form a circle
        // console.log("Connect cicle");
        for(var j = 0; j < numLoops-1; j++) {
            edges.push([startCounter, ++startCounter]);
            // console.log("Add edge:", [startCounter-1, startCounter]);
        }
        edges.push([startCounter, startCounter-numLoops+1]);
        // console.log("Add edge:", [startCounter, startCounter-numLoops+1]);
    }

    // Add polar point coordinates
    var topPolarCounter = counter;
    points[counter++] = [0, 0, radius]
    var botPolarCounter = counter;
    points[counter++] = [0, 0, -radius]

    // Connect polar points to latitude loops
    for(var j = 0; j < numLoops; j++) {
        edges.push([topPolarCounter, j]);
        edges.push([botPolarCounter, topPolarCounter-j-1]);
    }

    // console.log(points);
    // console.log(edges);

    return [points, edges];
}

function testPerformance(points) {
    // Copy points
    var copyPoints = {};

    var numRun = 100000;

    // Prerun - copy points
    for(var i in copyPoints) {
        copyPoints[i] = [points[i][0], points[i][1], points[i][2]];
    }
    for(var i = 0; i < 2*numRun; i += 0.01) {
        rotateXO(copyPoints, i);
        rotateYO(copyPoints, i);
    }
    var t0 = performance.now()
    for(var i = 0; i < 2*numRun; i += 0.01) {
        rotateXO(copyPoints, i);
        rotateYO(copyPoints, i);
    }
    var t1 = performance.now()
    console.log("Original rotate", (t1-t0), "milliseconds.");

    // Prerun
    for(var i in copyPoints) {
        copyPoints[i] = [points[i][0], points[i][1], points[i][2]];
    }
    for(var i = 0; i < numRun; i += 1) {
        rotateXI(copyPoints, i);
        rotateYI(copyPoints, i);
    }
    t0 = performance.now()
    for(var i = 0; i < 2*numRun; i += 1) {
        rotateXI(copyPoints, i);
        rotateYI(copyPoints, i);
    }
    t1 = performance.now()
    console.log("Rotate with global params", (t1-t0), "milliseconds.");

    // Prerun
    for(var i in copyPoints) {
        copyPoints[i] = [points[i][0], points[i][1], points[i][2]];
    }
    for(var i = 0; i < 2*numRun; i += 1) {
        rotateX(copyPoints, i);
        rotateY(copyPoints, i);
    }
    t0 = performance.now()
    for(var i = 0; i < 2*numRun; i += 1) {
        rotateX(copyPoints, i);
        rotateY(copyPoints, i);
    }
    t1 = performance.now()
    console.log("Rotate with inplace update", (t1-t0), "milliseconds.");

    // Prerun
    for(var i in copyPoints) {
        copyPoints[i] = [points[i][0], points[i][1], points[i][2]];
    }
    for(var i = 0; i < 2*numRun; i += 1) {
        rotateXY(copyPoints, i, i);
    }
    t0 = performance.now()
    for(var i = 0; i < 2*numRun; i += 1) {
        rotateXY(copyPoints, i, i);
    }
    t1 = performance.now()
    console.log("Rotate with single rotation matrix", (t1-t0), "milliseconds.");
}

// Helper functions
function rotateXO(points, degree) {
    for(var v in points)
        points[v] = [points[v][0], Math.cos(degree)*points[v][1]-Math.sin(degree)*points[v][2], Math.sin(degree)*points[v][1]+Math.cos(degree)*points[v][2]];
}

function rotateYO(points, degree) {
    for(var v in points)
        points[v] = [Math.cos(degree)*points[v][0]+Math.sin(degree)*points[v][2], points[v][1], -Math.sin(degree)*points[v][0]+Math.cos(degree)*points[v][2]];
}

function rotateZO(points, degree) {
    for(var v in points)
        points[v] = [Math.cos(degree)*points[v][0]-Math.sin(degree)*points[v][1], Math.sin(degree)*points[v][0]+Math.cos(degree)*points[v][1], points[v][2]];
}

function rotateXI(points, degree) {
    var cosine = Math.cos(degree);
    var sine = Math.sin(degree);
    for(var v in points)
        points[v] = [points[v][0], cosine*points[v][1]-sine*points[v][2], sine*points[v][1]+cosine*points[v][2]];
}

function rotateYI(points, degree) {
    var cosine = Math.cos(degree);
    var sine = Math.sin(degree);
    for(var v in points)
        points[v] = [cosine*points[v][0]+sine*points[v][2], points[v][1], -sine*points[v][0]+cosine*points[v][2]];
}

function rotateZI(points, degree) {
    var cosine = Math.cos(degree);
    var sine = Math.sin(degree);
    for(var v in points)
        points[v] = [cosine*points[v][0]-sine*points[v][1], sine*points[v][0]+cosine*points[v][1], points[v][2]];
}

function rotateX(points, degree) {
    var cosine = Math.cos(degree);
    var sine = Math.sin(degree);
    var x, y, z;
    for(var v in points) {
        x = points[v][0];
        y = points[v][1];
        z = points[v][2];
        points[v][0] = x;
        points[v][1] = cosine*y-sine*z;
        points[v][2] = sine*y+cosine*z;
    }
}

function rotateY(points, degree) {
    var cosine = Math.cos(degree);
    var sine = Math.sin(degree);
    var x, y, z;
    for(var v in points) {
        x = points[v][0];
        y = points[v][1];
        z = points[v][2];
        points[v][0] = cosine*x+sine*z;
        points[v][1] = y;
        points[v][2] = -sine*x+cosine*z;
    }
}

function rotateXY(points, x, y) {
    var xCosine = Math.cos(x);
    var xSine = Math.sin(x);
    var yCosine = Math.cos(y);
    var ySine = Math.sin(y);
    var xSinySin = xSine*ySine;
    var xCosySin = ySine*xCosine;
    var xSinyCos = xSine*yCosine;
    var xCosyCos = xCosine*yCosine;
    var x, y, z;
    for(var v in points) {
        x = points[v][0];
        y = points[v][1];
        z = points[v][2];
        points[v][0] = yCosine*x + xSinySin*y + xCosySin*z;
        points[v][1] = xCosine*y - xSine*z;
        points[v][2] = -ySine*x + xSinyCos*y + xCosyCos*z;
    }
}

function rotateZ(points, degree) {
    var cosine = Math.cos(degree);
    var sine = Math.sin(degree);
    var x, y, z;
    for(var v in points) {
        x = points[v][0];
        y = points[v][1];
        z = points[v][2];
        points[v][0] = cosine*x-sine*y;
        points[v][1] = sine*x+cosine*y;
        points[v][2] = z;
    }
}

function moveX(points, amount) {
    for(var v in points) {
        points[v][0] += amount;
    }
}

function moveY(points, amount) {
    for(var v in points) {
        points[v][1] += amount;
    }
}

function toRadian(degree) {
    return degree * Math.PI / 180;
}

function toDegree(radian) {
    return radian / Math.PI * 180;
}