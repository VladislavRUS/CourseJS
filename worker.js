onmessage = function (event) {
    var action = event.data.action;

    switch (action) {
        case 'findClusters': {
            var matrWithClusters = findClusters(event.data.matrix);
            postMessage({action: 'findClusters', matrix: matrWithClusters});
            break;
        }
        case 'findPath': {
            findPath(event.data.matrix);
            break;
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

    postMessage({action: 'findPath', matrix: wavedUp.matrix});

    postMessage({action: 'prepareMatrix', arr: prepareMatrix(wavedUp.matrix, wavedUp.minPhasedElement)});



    //var matrixDown = waveDown(matrixUp);
    //console.log(matrixDown);
}

function prepareMatrix(matrix, minPhasedElement) {

    var resultCells = [];

    if (minPhasedElement.cluster == -1) {
        resultCells.push(minPhasedElement);

    } else {
        resultCells = resultCells.concat(getCluster(minPhasedElement.cluster, matrix));
    }

    var currentCell;

    do {
        currentCell = resultCells[resultCells.length - 1];

        for (var i = 0; i < resultCells.length; i++) {
            var cell = resultCells[i];

            if (cell.wavePhase == currentCell.wavePhase) {

                var neighbours = getNeighbours(cell.i, cell.j, matrix);

                for (var j = 0; j < neighbours.length; j++) {
                    var n = neighbours[j];

                    if (n.hasOwnProperty('wavePhase') && n.wavePhase == (currentCell.wavePhase - 1)) {
                        if (n.cluster == -1) {
                            resultCells.push(n);
                        } else {
                            resultCells = resultCells.concat(getCluster(n.cluster, matrix));
                        }
                        break;
                    }
                }
            }
        }

    } while (currentCell.wavePhase !== 0);

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
                if (matrix[i][j].wavePhase == (phase - 1)) {
                    markNeighbours(i, j, phase, matrix);
                }
            }
        }
    }

    return {
        matrix: matrix,
        minPhasedElement: getMinRowPhasedElement(0, matrix)
    };
}

function getMinRowPhasedElement(rowIdx, matrix) {
    var minPhase = Number.MAX_VALUE, elm;

    for (var i = rowIdx, j = 0; j < matrix.length; j++) {
        if (matrix[i][j].hasOwnProperty('wavePhase') && matrix[i][j].wavePhase < minPhase) {
            minPhase = matrix[i][j].wavePhase;
            elm = matrix[i][j];
        }
    }

    return elm;
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

function markNeighbours(i, j, phase, matrix) {
    getNeighbours(i, j, matrix).forEach(function (n) {
        if (!(n.hasOwnProperty('wavePhase')) || n.wavePhase > phase) {
            if (n.cluster == -1) {
                n.wavePhase = phase;

            } else {
                initCell(matrix, n.i, n.j, phase);
            }
        }
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
        if (matrix[i][j].wavePhase) {
            return true;
        }
    }

    return false;
}

function initRow(side, matrix) {
    var i = side == 'top' ? 0 : matrix.length - 1;

    for (var j = 0; j < matrix.length; j++) {
        initCell(matrix, i, j, 0);
    }
}

function initCell(matrix, iIdx, jIdx, wavePhase) {
    if (matrix[iIdx][jIdx].cluster == -1) {
        matrix[iIdx][jIdx].wavePhase = wavePhase;

    } else {
        for (var i = 0; i < matrix.length; i++) {
            for (var j = 0; j < matrix.length; j++) {
                if (matrix[i][j].cluster == matrix[iIdx][jIdx].cluster) {
                    matrix[i][j].wavePhase = wavePhase;
                }
            }
        }
    }
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}