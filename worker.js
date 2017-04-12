importScripts('util.js');
importScripts('graph.js');
importScripts('findCluster.js');

onmessage = function (event) {
    var action = event.data.action;

    switch (action) {
        case 'findClusters': {
            var matrWithClusters = findClusters(event.data.matrix);
            postMessage({action: 'findClusters', matrix: matrWithClusters});
            break;
        }
        case 'findPath': {
            var result = findPath(event.data.matrix);
            postMessage({action: 'prepareMatrix', arr: result.arr});
            postMessage({action: 'info', info: result.statistics });

            break;
        }

        case 'iterations': {
            var matrixWithClusters = findClusters(event.data.matrix);
            var result = findPath(matrixWithClusters);
            postMessage({
                action: 'iterations',
                arr: result.arr,
                statistics: result.statistics,
                p: event.data.p,
                matrix: matrixWithClusters,
                i: event.data.i
            });

            break;
        }

        case 'graph': {
            var matrix = event.data.matrix;
            var from = event.data.from;
            var to = event.data.to;

            var clustered = finder.findClusters(matrix);

            postMessage({action: 'graph', path: graph.makeGraph(clustered, from, to), matrix: clustered});
        }
    }
};

function findClusters(matrix) {
    var k = 0;
    var watched = [];

    for (var i = 0; i < matrix.length; i++) {
        for (var j = 0; j < matrix.length; j++) {
            var elm = matrix[i][j];

            if (elm.color !== 'white') {
                watched.push(elm);

                var left = getMatrixElement(i, j - 1, matrix);
                var top = getMatrixElement(i - 1, j, matrix);

                if (left && left.color == 'white') left = null;
                if (top && top.color == 'white') top = null;

                if (!left && !top) {
                    elm.cluster = k++;
                    elm.color = getRandomColor();

                } else if (left && top) {
                    if (left.cluster < top.cluster) {

                        elm.cluster = left.cluster;
                        mergeClusters(left.cluster, top.cluster, watched);

                    } else {
                        elm.cluster = top.cluster;
                        mergeClusters(top.cluster, left.cluster, watched);
                    }

                } else if (left) {
                    elm.cluster = left.cluster;
                    elm.color = left.color;

                } else if (top) {
                    elm.cluster = top.cluster;
                    elm.color = top.color;
                }

            } else {
                elm.cluster = -1;
            }
        }
    }

    return matrix;
}

function mergeClusters(less, more, watched) {
    var color = getRandomColor();

    watched.forEach(function (elm) {
        if (elm.cluster == less || elm.cluster == more) {
            elm.cluster = less;
            elm.color = color;
        }
    });
}

function findPath(matrix) {
    var wavedUp = waveUp(matrix);

    //postMessage({action: 'minPhased', matrix: matrix});

    var possibleWays = [];

    wavedUp.minPhasedElements.forEach(function (elm) {
        var arr = prepareMatrix(wavedUp.matrix, elm);

        //postMessage({action: 'prepareMatrix', arr: arr});

        var path = waveDown(arr, matrix);

        //postMessage({action: 'path', path: path});

        possibleWays.push(path);
    });

    var statistics = [];

    for (var i = 0; i < possibleWays.length; i++) {
        statistics.push(getPathStatistic(possibleWays[i], i));
    }

    var minWhiteCells = Number.MAX_VALUE;

    for (var i = 0; i < statistics.length; i++) {
        if (statistics[i].whiteCells < minWhiteCells) {
            minWhiteCells = statistics[i].whiteCells;
        }
    }

    statistics = statistics.filter(function(s) {
        return s.whiteCells == minWhiteCells;
    });

    var minLength = Number.MAX_VALUE;

    for (var i = 0; i < statistics.length; i++) {
        if (statistics[i].length < minLength) {
            minLength = statistics[i].length;
        }
    }

    statistics = statistics.filter(function(s) {
        return s.length == minLength;
    });

    return  {
        arr: possibleWays[statistics[0].idx],
        statistics: statistics[0]
    };
}

function getPathStatistic(path, idx) {
    var length = path.length, whiteCells = 0;

    for (var i = 0; i < path.length; i++) {
        if (path[i].color == 'white') {
            whiteCells++;
        }
    }

    return {
        idx: idx,
        length: length,
        whiteCells: whiteCells
    }
}

function waveDown(arr, matrix) {
    var copiedMatrix = createMatrix(matrix.length);

    for (var i = 0; i < copiedMatrix.length; i++) {
        for (var j = 0; j < copiedMatrix.length; j++) {
            copiedMatrix[i][j] = {
                cluster: -5,
                color: 'white',
                i: i,
                j: j,
                id: i + ':' + j
            }
        }
    }

    for (var i = 0; i < arr.length; i++) {
        var elm = JSON.parse(JSON.stringify(arr[i]));
        delete elm.wavePhase;

        copiedMatrix[elm.i][elm.j] = elm;
    }

    for (var i = 0, j = 0; j < copiedMatrix.length; j++) {
        if (copiedMatrix[i][j].cluster !== -5)
            copiedMatrix[i][j].wavePhase = 0;
    }

    var phase = 0;

    while (!rowWaved('bottom', copiedMatrix)) {
        phase++;

        for (var i = 0; i < copiedMatrix.length; i++) {
            for (var j = 0; j < copiedMatrix.length; j++) {
                var cell = copiedMatrix[i][j];

                if (cell.hasOwnProperty('wavePhase') && cell.wavePhase == phase - 1) {
                    var neighbours = getNeighbours(cell.i, cell.j, copiedMatrix).filter(function (n) {
                        return n.cluster !== -5;
                    });

                    neighbours.forEach(function (n) {
                        if (!n.hasOwnProperty('wavePhase'))
                            n.wavePhase = phase;
                    });
                }
            }
        }
    }

    return getPath(copiedMatrix, phase);
}

function getPath(matrix, maxPhase) {
    var start;

    for (var i = matrix.length - 1, j = 0; j < matrix.length; j++) {
        if (matrix[i][j].wavePhase == maxPhase) {
            start = matrix[i][j];
            break;
        }
    }

    var current = start;

    var path = [];
    path.push(current);

    while (current.wavePhase !== 0) {
        var neighbours = getNeighbours(current.i, current.j, matrix);
        for (var i = 0; i < neighbours.length; i++) {
            var n = neighbours[i];

            if (n.wavePhase == current.wavePhase - 1) {
                path.push(n);
                current = n;
                break;
            }
        }
    }

    return path;
}

function prepareMatrix(matrix, minPhasedElement) {

    var resultCells = [];

    if (minPhasedElement.cluster !== -1) {
        var cluster = getCluster(minPhasedElement.cluster, matrix);
        resultCells = resultCells.concat(cluster);

    } else {
        resultCells.push(minPhasedElement);
    }
    do {
        resultCells.forEach(function (cell) {
            /*if (cell.cluster !== -1) {
             var cluster = getCluster(cell.cluster, matrix);

             cluster.forEach(function (c) {
             if (resultCells.indexOf(c) == -1) {
             resultCells.push(c);
             }
             });
             }*/

            var neighbours = getNeighbours(cell.i, cell.j, matrix);

            neighbours.forEach(function (n) {
                if (n.wavePhase == (cell.wavePhase - 1) && resultCells.indexOf(n) == -1) {

                    if (n.cluster !== -1) {
                        var cluster = getCluster(n.cluster, matrix);
                        resultCells = resultCells.concat(cluster);

                    } else {
                        resultCells.push(n);
                    }
                }
            });
        });
    } while (resultCells[resultCells.length - 1].wavePhase !== 0);

    return resultCells;
}

function getCluster(cluster, matrix) {
    var arr = [];

    for (var i = 0; i < matrix.length; i++) {
        for (var j = 0; j < matrix.length; j++) {
            if (matrix[i][j].cluster == cluster) {
                arr.push(matrix[i][j]);
            }
        }
    }

    return arr;
}

function waveUp(matrix) {
    initRow('bottom', matrix);

    var phase = 0;

    while (!rowWaved('top', matrix)) {
        phase++;

        for (var i = 0; i < matrix.length; i++) {
            for (var j = 0; j < matrix.length; j++) {
                var cell = matrix[i][j];

                if (cell.hasOwnProperty('wavePhase') && cell.wavePhase == phase - 1) {
                    var neighbours = getNeighbours(cell.i, cell.j, matrix);

                    neighbours.forEach(function (n) {
                        if (!n.hasOwnProperty('wavePhase')) {
                            if (n.cluster !== -1) {
                                var cluster = getCluster(n.cluster, matrix);
                                cluster.forEach(function (c) {
                                    c.wavePhase = phase;
                                });

                            } else {
                                n.wavePhase = phase;
                            }
                        }
                    });
                }
            }
        }
    }

    return {
        matrix: matrix,
        minPhasedElements: getMinRowPhasedElements(0, matrix)
    };
}

function getMinRowPhasedElements(rowIdx, matrix) {
    var minPhase = Number.MAX_VALUE, arr = [];

    for (var i = rowIdx, j = 0; j < matrix.length; j++) {
        if (matrix[i][j].hasOwnProperty('wavePhase') && matrix[i][j].wavePhase < minPhase) {
            minPhase = matrix[i][j].wavePhase;
        }
    }

    for (var i = rowIdx, j = 0; j < matrix.length; j++) {
        if (matrix[i][j].wavePhase == minPhase) {
            arr.push(matrix[i][j]);
        }
    }

    return arr;
}

function getNeighbours(i, j, matrix) {
    var left = getMatrixElement(i, j - 1, matrix);
    var top = getMatrixElement(i - 1, j, matrix);
    var right = getMatrixElement(i, j + 1, matrix);
    var bottom = getMatrixElement(i + 1, j, matrix);

    return [left, top, right, bottom].filter(function (n) {
        return n !== null;
    });
}

function getMatrixElement(i, j, matrix) {
    if (i >= 0 &&
        i < matrix.length &&
        j >= 0 &&
        j < matrix.length &&
        matrix[i][j] !== undefined &&
        matrix[i][j] !== null) {
        return matrix[i][j];

    } else {
        return null;
    }
}

function rowWaved(side, matrix) {
    var i = side == 'top' ? 0 : matrix.length - 1;

    for (var j = 0; j < matrix.length; j++) {
        if (matrix[i][j].hasOwnProperty('wavePhase')) {
            return true;
        }
    }

    return false;
}

function initRow(side, matrix) {
    var initialized = [];

    var i = side == 'top' ? 0 : matrix.length - 1;

    for (var j = 0; j < matrix.length; j++) {
        initialized = initialized.concat(initCell(matrix, i, j, 0));
    }

    return initialized;
}

function initCell(matrix, iIdx, jIdx, wavePhase) {
    var arr = [];

    if (matrix[iIdx][jIdx].cluster == -1) {
        matrix[iIdx][jIdx].wavePhase = wavePhase;

        arr.push(matrix[iIdx][jIdx]);

    } else {
        for (var i = 0; i < matrix.length; i++) {
            for (var j = 0; j < matrix.length; j++) {
                if (matrix[i][j].cluster == matrix[iIdx][jIdx].cluster) {
                    matrix[i][j].wavePhase = wavePhase;
                    arr.push(matrix[i][j]);
                }
            }
        }
    }

    return arr;
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function createMatrix(N) {
    var matrix = [];
    for (var i = 0; i < N; i++) {
        matrix[i] = new Array(N);
    }

    return matrix;
}