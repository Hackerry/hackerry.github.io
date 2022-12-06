function getNthUnityRoots(n, inverse = false) {
    if (n === 0) return [];
    else if (n < 0) n = -n;

    var roots = [];
    for (var i = 0; i < n; i++) {
        if (!inverse) roots.push([Math.cos(2 * Math.PI / n * i), Math.sin(2 * Math.PI / n * i)]);
        else roots.push([Math.cos(2 * Math.PI / n * i), -Math.sin(2 * Math.PI / n * i)]);
    }

    return roots;
}

function multiplyComplex(a, b) {
    return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
}
function addComplex(a, b) {
    return [a[0] + b[0], a[1] + b[1]];
}
function minusComplex(a, b) {
    return [a[0] - b[0], a[1] - b[1]];
}

// Default FT is e^(-2pi*i)
function NormalFT(list, k, inverse=false) {
    var result = [];
    var sum;
    var N = list.length;
    for(var i = 0; i < k; i++) {
        sum = [0,0];
        for(var j = 0; j < N; j++) {
            if(inverse) sum = addComplex(sum, multiplyComplex(list[j], [Math.cos(Math.PI*2*i*j/N), Math.sin(Math.PI*2*i*j/N)]));
            else sum = addComplex(sum, multiplyComplex(list[j], [Math.cos(Math.PI*2*i*j/N), -Math.sin(Math.PI*2*i*j/N)]));
        }
        result.push(sum);
    }

    return result;
}

function toPowerOfTwo(n) {
    var mask = 0x80000000 >>> Math.clz32(n);
    if((mask ^ n) == 0) return mask;
    else return (mask << 1);
}

function ComputeCnNormal(points, numCircles) {
    var P = points.length;
    if (P < 0 || numCircles < 0) return null;

    var newPoints = [];
    for(var i = 0; i < P; i++) {
        newPoints.push(points[i]);
    }

    var cn = NormalFT(newPoints, numCircles, false);
    return cn;
}

function ComputeCnSum(cn, n) {
    var result = NormalFT(cn, n, true);
    for(var i = 0; i < result.length; i++) {
        result[i][0] /= 1.0*n;
        result[i][1] /= 1.0*n;
    }
    return result;
}

function ComputeCnsAtT(cn, numCirclesUsed, t) {
    if(t < 0 || t > 1) return null;

    var result = [];
    var N = Math.min(cn.length, numCirclesUsed);
    for(var i = 0; i < N; i++) {
        result.push(multiplyComplex([Math.cos(Math.PI*2*cn[i][2]*t)/cn.length, -Math.sin(Math.PI*2*cn[i][2]*t)/cn.length], cn[i]));
        // The inverse transform needs to be divided by n
    }

    return result;
}

function CenterPoints(points) {
    var newPoints = [];
    var maxX = Number.MIN_VALUE, minX = Number.MAX_VALUE, maxY = Number.MIN_VALUE, minY = Number.MAX_VALUE;
    for(var i = 0; i < points.length; i++) {
        if(points[i][0] < minX) minX = points[i][0];
        if(points[i][0] > maxX) maxX = points[i][0];
        if(points[i][1] < minY) minY = points[i][1];
        if(points[i][1] > maxY) maxY = points[i][1];
    }
    var cX = (maxX+minX)/2;
    var cY = (maxY+minY)/2;
    for(var i = 0; i < points.length; i++) {
        newPoints.push([points[i][0] - cX, cY - points[i][1]]);
    }

    return newPoints;
}

// console.log(FFTPolynomialMultiplication([3,1,-2,10], [-5,2,7,1]));
function test() {
    var points = [[2, 4],[3, 3],[4, 4],[5, 3],[4, 2],[3, 1],[2, 2],[1, 3]];
    console.log("ihh", points, points.length, points[0]);
    var numCircles = 11;

    var coefficients = ComputeFourierSeries(points, numCircles);
    console.log(coefficients);
    var tInterval = 1 / numCircles;
    for (var i = 0; i < numCircles; i++) {
        sum = [0,0];
        for (var j = 0; j < points.length; j++) {
            sum = addComplex(sum, [-Math.cos(tInterval * i), -Math.sin(tInterval * i)]);
        }
        console.log("Point:", points[i], "Approximation:", sum);
    }
}