var worker = new Worker('worker.js');
var start, end;

var N = 10;

var globalMatrix = createMatrix(N);
var clusteredMatrix;

initGlobalMatrix();

function createMatrix(N) {
    var matrix = [];
    for (var i = 0; i < N; i++) {
        matrix[i] = new Array(N);
    }

    return matrix;
}

function initGlobalMatrix() {
    var p = 1 - parseFloat(getElm('p').value);

    for (var i = 0; i < N; i++) {
        for (var j = 0; j < N; j++) {
            globalMatrix[i][j] = {
                color: Math.random() > p ? 'black' : 'white',
                id: i + ':' + j,
                i: i,
                j: j
            }
        }
    }

    drawTable(globalMatrix);
}

function drawTable(matrix, field) {
    var table = getElm('table');
    table.innerHTML = '';

    for (var i = 0; i < N; i++) {
        var tr = document.createElement('tr');

        for (var j = 0; j < N; j++) {
            var td = document.createElement('td');
            td.innerHTML =
                matrix[i][j][field] !== undefined
                    ? matrix[i][j][field] + ''
                    : '';

            td.style.backgroundColor = matrix[i][j].color;
            td.setAttribute('id', i + ':' + j);
            tr.appendChild(td);
        }

        table.appendChild(tr);
    }
}

function getElm(id) {
    return document.getElementById(id);
}

function findPath() {
    if (clusteredMatrix) {
        worker.postMessage({action: 'findPath', matrix: clusteredMatrix});

    } else {
        alert('Сначала найдите кластеры!');
    }

}

function findClusters() {
    start = new Date().getTime();
    worker.postMessage({action: 'findClusters', matrix: globalMatrix});
}

worker.addEventListener('message', function (event) {
    switch (event.data.action) {
        case 'findClusters': {
            onFindClusters(event.data.matrix);
            break;
        }
        case 'findPath': {
            onFindPath(event.data.matrix);
            break;
        }

        case 'prepareMatrix': {
            onPrepareMatrix(event.data.arr);
            break;
        }
    }
});

function onPrepareMatrix(arr) {
    for (var i = 0; i < arr.length; i++) {
        var elm = arr[i];
        var td = getElm(elm.i + ':' + elm.j);
        td.style.border = '3px solid red';
    }
}

function onFindClusters(matrix) {
    end = new Date().getTime();
    console.log('Time: ' + (end - start));

    clusteredMatrix = matrix;
    drawTable(matrix, 'cluster');
}

function onFindPath(matrix) {
    drawTable(matrix, 'wavePhase');
}
