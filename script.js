var worker = new Worker('worker.js');
var start, end;

var globalMatrix = createMatrix();
var clusteredMatrix;

var iterationsArray = [];
var globalResults = {};
var matrices = [];
var forbidden = [];
var route = [];

initGlobalMatrix();

function createMatrix() {
    var N = parseInt(getElm('N').value);
    var matrix = [];
    for (var i = 0; i < N; i++) {
        matrix[i] = new Array(N);
    }

    return matrix;
}

function initGlobalMatrix() {
    globalMatrix = createMatrix();

    var p = 1 - parseFloat(getElm('p').value);
    var cnt = 0;

    for (var i = 0; i < globalMatrix.length; i++) {
        for (var j = 0; j < globalMatrix.length; j++) {
            globalMatrix[i][j] = {
                color: Math.random() > p ? 'black' : 'white',
                id: i + ':' + j,
                i: i,
                j: j,
                idx: cnt++
            }
        }
    }

    drawTable(globalMatrix);
}

function createRandomMatrix(p) {
    var matrix = createMatrix();

    for (var i = 0; i < matrix.length; i++) {
        for (var j = 0; j < matrix.length; j++) {
            matrix[i][j] = {
                color: Math.random() > p ? 'black' : 'white',
                id: i + ':' + j,
                i: i,
                j: j
            }
        }
    }

    return matrix;
}

function setGraph() {
    worker.postMessage({
        action: 'graph',
        matrix: util.copy(globalMatrix),
        from: route[0].idx,
        to: route[1].idx,
        forbidden: forbidden
    });
}

/*function setGraph() {

 if (forbidden.length !== 2) {
 alert('Choose from and to cells!');
 return;
 }

 var matrix = util.copy(globalMatrix);
 var clustered = finder.findClusters(matrix);
 var path = graph.makeGraph(clustered, forbidden[0].idx, forbidden[1].idx);

 path = path.split(' ');

 for (var i = 0; i < matrix.length; i++) {
 for (var j = 0; j < matrix.length; j++) {
 for (var k = 0; k < path.length; k++) {
 if (path[k] == matrix[i][j].idx) {
 getElm(i + ':' + j).style.border = '3px solid red';
 }
 }
 }
 }
 }*/

function findNew() {

    var matrix = util.copy(globalMatrix);

    var start = new Date().getTime();

    var clustered = finder.findClusters(matrix);
    var wavedUp = wave.waveUp(clustered, forbidden);
    var prepared = wave.prepare(wavedUp);
    var wavedDown = wave.waveDown(wavedUp, prepared, forbidden);
    var path = wave.getPath(wavedDown);

    var end = new Date().getTime();
    console.log('Time: ' + (end - start));

    drawTable(wavedUp, 'wavePhase');

    //paintMatrix('black');

    path.forEach(function (p) {
        var elm = getElm(p.i + ':' + p.j);

        if (elm.style.backgroundColor !== 'white') {
            elm.style.backgroundColor = 'orange';

        } else {
            elm.style.backgroundColor = 'red';
        }
    });

}

function initGlobalMatrixGradient() {
    resetMatrix();

    var p = parseFloat(getElm('p').value);
    var maxP = parseFloat(getElm('maxP').value);

    var startP = p * 2 - maxP;

    var step = (maxP - startP) / (globalMatrix.length / 2);

    for (var i = 0, pos = startP; i < globalMatrix.length / 2; i++, pos += step) {
        for (var j = 0; j < globalMatrix.length; j++) {
            globalMatrix[i][j] = createCell(i, j, Math.random() > pos ? 'white' : 'black');
        }
    }

    for (var i = globalMatrix.length / 2 - 1, pos = maxP; i < globalMatrix.length; i++, pos -= step) {
        for (var j = 0; j < globalMatrix.length; j++) {
            globalMatrix[i][j] = createCell(i, j, Math.random() > pos ? 'white' : 'black');
        }
    }

    drawTable(globalMatrix);
}

function setIndeces() {
    var cnt = 0;
    for (var i = 0; i < globalMatrix.length; i++) {
        for (var j = 0; j < globalMatrix.length; j++) {
            globalMatrix[i][j].idx = cnt++;
        }
    }
}

function resetMatrix() {
    for (var i = 0; i < globalMatrix.length; i++) {
        for (var j = 0; j < globalMatrix.length; j++) {
            globalMatrix[i][j] = {
                color: 'white',
                id: i + ':' + j,
                i: i,
                j: j
            }
        }
    }
}

function fillRow(rowIdx, start, end, matrix, color) {
    for (var j = start; j < end; j++) {
        matrix[rowIdx][j].color = color;
    }
}

function fillColumn(columnIdx, start, end, matrix, color) {
    for (var i = start; i < end; i++) {
        matrix[i][columnIdx].color = color;
    }
}

function makeRings() {
    resetMatrix();

    for (var i = 0, j = 0; i < globalMatrix.length / 2; i += 2, j += 2) {
        var first = i;
        var second = globalMatrix.length - i - 1;

        fillRow(first, j, globalMatrix.length - j, globalMatrix, 'black');
        fillRow(second, j, globalMatrix.length - j, globalMatrix, 'black');
    }

    for (var i = 0, j = 0; i < globalMatrix.length / 2; i += 2, j += 2) {
        var first = i;
        var second = globalMatrix.length - i - 1;

        fillColumn(first, j, globalMatrix.length - j, globalMatrix, 'black');
        fillColumn(second, j, globalMatrix.length - j, globalMatrix, 'black');
    }

    drawTable(globalMatrix);
}

function iterations() {
    globalResults = {};
    getElm('results').innerHTML = '';

    var cnt = parseInt(getElm('iterations').value);

    for (var p = 0.05; p <= 0.95; p += 0.05) {
        count(1 - p);
    }
}

function count(p) {
    var iterations = parseInt(getElm('iterations').value);

    for (var i = 0; i < iterations; i++) {
        worker.postMessage({action: 'iterations', matrix: createRandomMatrix(p), p: p, i: i});
    }
}

function makeChess() {
    resetMatrix();

    for (var i = 0; i < globalMatrix.length; i++) {
        for (var j = 0; j < globalMatrix.length; j++) {
            if (i % 2 == 0) {
                if (j % 2 == 0) {
                    globalMatrix[i][j] = createCell(i, j, 'black');
                } else {
                    globalMatrix[i][j] = createCell(i, j, 'white');
                }
            } else {
                if (j % 2 == 0) {
                    globalMatrix[i][j] = createCell(i, j, 'white');
                } else {
                    globalMatrix[i][j] = createCell(i, j, 'black');
                }
            }
        }
    }

    drawTable(globalMatrix);
}

function createCell(i, j, color) {
    return {
        id: i + ':' + j,
        i: i,
        j: j,
        color: color
    }
}

function drawTable(matrix, field) {
    setIndeces();

    forbidden = [];

    var N = matrix.length;
    var size = 800;

    var tdSize = size / N;

    var table = getElm('table');
    table.innerHTML = '';

    for (var i = 0; i < matrix.length; i++) {
        var tr = document.createElement('tr');

        for (var j = 0; j < matrix.length; j++) {
            var td = document.createElement('td');
            td.style.width = tdSize + 'px';
            td.style.height = tdSize + 'px';

            td.onclick = tdClick;

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

function tdClick(e) {

    var obj = {};
    var id = this.getAttribute('id');

    obj.i = parseInt(id.split(':')[0]);
    obj.j = parseInt(id.split(':')[1]);
    obj.idx = globalMatrix[obj.i][obj.j].idx;

    if (!e.ctrlKey) {

        if (route.length == 2) {
            route = route.slice(1);
        }

        route.push(obj);

        route.forEach(function(r) {
            getElm(r.i + ':' + r.j).style.backgroundColor = 'green';
        });

    } else {
        forbidden.push(obj);

        forbidden.forEach(function(f) {
            getElm(f.i + ':' + f.j).style.backgroundColor = 'cyan';
        });
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

        case 'info': {
            onInfo(event.data.info);
            break;
        }

        case 'minPhased': {
            onMinPhased(event.data.matrix);
            break;
        }

        case 'iterations': {
            onIterations(event.data);
            break;
        }
        case 'path': {
            onPath(event.data.path);
            break;
        }

        case 'graph': {
            onGraph(event.data.path, event.data.matrix);
            break;
        }
    }
});

function onIterations(data) {
    getElm('info').innerHTML = 'Концентрация: ' + (1 - parseFloat(data.p) + ', итерация: ' + data.i);

    var div = document.createElement('div');
    div.innerHTML = data.i + ', ' + (1 - parseFloat(data.p));
    div.className += 'result';

    getElm('results').appendChild(div);

    div.onclick = function () {
        drawTable(data.matrix);
        onPrepareMatrix(data.arr);
        onInfo(data.statistics);
    }

    if (!globalResults[data.p]) {
        globalResults[data.p] = [];
    }

    globalResults[data.p].push(data);

    var iterations = parseInt(getElm('iterations').value);

    var cnt = 0;

    for (var prop in globalResults) {
        cnt++;
    }

    if (cnt == 18) {
        var arrCnt = 0;

        for (var prop in globalResults) {
            if (globalResults[prop].length >= iterations) {
                arrCnt++;
            }
        }

        if (arrCnt == 18) {
            alert('READY!!!!');

            processData();
        }
    }
}

function processData() {
    var trace = {
        x: [],
        y: []
    }

    var trace1 = {
        x: [],
        y: []
    }

    for (var prop in globalResults) {
        trace.x.push(1 - prop);
        trace1.x.push(1 - prop);

        trace.y.push(averageRed(globalResults[prop]));
        trace1.y.push(averagePathLength(globalResults[prop]));
    }

    var layout = {
        xaxis: {title: 'Концентрация'},
        yaxis: {title: 'Количество красных'}
    };

    var layout1 = {
        xaxis: {title: 'Длина пути'},
        yaxis: {title: 'Количество красных'}
    };

    Plotly.newPlot('plot', [trace], layout);

    Plotly.newPlot('length', [trace1], layout1);
}

function averagePathLength(arr) {
    var length = 0;

    for (var i = 0; i < arr.length; i++) {
        length += arr[i].statistics.length;
    }

    return length / arr.length;
}

function averageRed(arr) {
    var red = 0;

    for (var i = 0; i < arr.length; i++) {
        red += arr[i].statistics.whiteCells;
    }

    return red / arr.length;
}

function onPath(path) {
    for (var i = 0; i < path.length; i++) {
        var elm = path[i];
        var td = getElm(elm.i + ':' + elm.j);

        td.style.backgroundColor = 'red';
    }
}

function onMinPhased(matrix) {
    drawTable(matrix, 'wavePhase');
}

function onInfo(info) {
    getElm('info').innerHTML = 'Длина: ' + info.length + '. Кол-во добавленных: ' + info.whiteCells;
}

function paintMatrix(color) {
    for (var i = 0; i < globalMatrix.length; i++) {
        for (var j = 0; j < globalMatrix.length; j++) {
            var td = getElm(i + ':' + j);

            if (td.style.backgroundColor !== 'white')
                td.style.backgroundColor = color;
        }
    }
}

function onPrepareMatrix(arr) {
    paintMatrix('black');

    for (var i = 0; i < arr.length; i++) {
        var elm = arr[i];
        var td = getElm(elm.i + ':' + elm.j);

        //td.style.border = '3px solid red';

        if (arr[i].color == 'white') {
            td.style.backgroundColor = 'red';
            td.style.border = '3px solid red';
        } else {
            td.style.backgroundColor = 'orange';
        }
    }
}

function makeHorizontal() {
    resetMatrix();

    for (var i = 0; i < globalMatrix.length; i++) {
        for (var j = 0; j < globalMatrix.length; j++) {
            if (i % 2 == 0) {
                globalMatrix[i][j] = createCell(i, j, 'black');

            } else {
                globalMatrix[i][j] = createCell(i, j, 'white');
            }
        }
    }

    drawTable(globalMatrix);
}

function makeVertical() {
    resetMatrix();

    for (var i = 0; i < globalMatrix.length; i++) {
        for (var j = 0; j < globalMatrix.length; j++) {
            if (j % 2 == 0) {
                globalMatrix[i][j] = createCell(i, j, 'black');

            } else {
                globalMatrix[i][j] = createCell(i, j, 'white');
            }
        }
    }

    drawTable(globalMatrix);
}

function makeRain() {
    resetMatrix();

    for (var j = 0; j < globalMatrix.length; j += 2) {
        for (var i = 0; i < globalMatrix.length; i++) {

            var number = Math.floor(Math.random() * 3 + 1);

            var a = (i + number) > globalMatrix.length ? globalMatrix.length - 1 : i + number;
            for (var k = i; k < a; k++) {
                globalMatrix[k][j] = createCell(k, j, 'black');
            }

            i += (number + 2);
        }
    }

    drawTable(globalMatrix);
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

function onGraph(path, matrix) {
    path = path.split(' ');

    for (var i = 0; i < matrix.length; i++) {
        for (var j = 0; j < matrix.length; j++) {
            for (var k = 0; k < path.length; k++) {
                if (path[k] == globalMatrix[i][j].idx) {
                    var elm = getElm(i + ':' + j);

                    if (elm.style.border == '3px solid red') {
                        elm.style.border = '3px solid orange';

                    } else {
                        elm.style.border = '3px solid red'
                    }

                }
            }
        }
    }
}