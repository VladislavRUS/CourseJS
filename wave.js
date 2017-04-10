var wave = {
    waveUp: function (matr, forbidden) {
        var self = this;

        var matrix = util.copy(matr);

        var wavePhase = 0;

        self.initRow('bottom', matrix);

        for (var i = 0; i < matrix.length; i++) {
            for (var j = 0; j < matrix.length; j++) {
                matrix[i][j].forbidden = false;
            }
        }

        forbidden.forEach(function(f) {
            matrix[f.i][f.j].forbidden = true;
        });

        while (!this.rowWaved('top', matrix)) {
            wavePhase++;

            for (var i = 0; i < matrix.length; i++) {
                for (var j = 0; j < matrix.length; j++) {
                    var cell = matrix[i][j];

                    if (cell.hasOwnProperty('wavePhase') && cell.wavePhase == wavePhase - 1 && !cell.forbidden) {

                        var neighbours = util.getNeighbours(i, j, matrix).filter(function(n) {
                            return !n.forbidden;
                        });

                        neighbours.forEach(function (n) {
                            if (!n.hasOwnProperty('wavePhase') || (n.wavePhase > wavePhase + 1)) {
                                if (n.cluster !== -1) {
                                    var cluster = self.getCluster(n.cluster, matrix);

                                    cluster.filter(function(c) {
                                        return !c.forbidden;
                                    });

                                    cluster.forEach(function (c) {
                                        c.wavePhase = wavePhase;
                                    });

                                } else {
                                    n.wavePhase = wavePhase;
                                }
                            }
                        })
                    }
                }
            }
        }

        return matrix;
    },

    waveDown: function (wavedUpMatrix, prepared, forbidden) {
        var matrix = util.copy(wavedUpMatrix);

        prepared.forEach(function (p) {
            matrix[p.i][p.j].allowed = true;
        });

        for (var i = 0; i < matrix.length; i++) {
            for (var j = 0; j < matrix.length; j++) {
                delete matrix[i][j].wavePhase;
            }
        }

        forbidden.forEach(function(f) {
            matrix[f.i][f.j].allowed = false;
        });

        var wavePhase = 0;

        var row = 0;
        for (var j = 0; j < matrix.length; j++) {
            matrix[row][j].wavePhase = wavePhase;
        }

        while (!this.rowWaved('bottom', matrix)) {
            for (var i = 0; i < matrix.length; i++) {
                for (var j = 0; j < matrix.length; j++) {
                    var cell = matrix[i][j];

                    if (cell.wavePhase == wavePhase && cell.allowed) {
                        var neighbours = util.getNeighbours(i, j, matrix).filter(function (n) {
                            return n.allowed == true;
                        });

                        neighbours.forEach(function (n) {
                            if (!n.hasOwnProperty('wavePhase') || (n.wavePhase > wavePhase + 1)) {
                                n.wavePhase = wavePhase + 1;
                            }
                        });
                    }
                }
            }

            wavePhase++;
        }

        return matrix;
    },

    prepare: function (wavedUpMatrix) {
        var self = this;

        var matrix = util.copy(wavedUpMatrix);
        var lastIteration = [];

        var row = 0;
        for (var j = 0; j < matrix.length; j++) {
            if (matrix[row][j].hasOwnProperty('wavePhase')) {
                lastIteration.push(matrix[row][j]);
            }
        }

        var result = [];
        result = result.concat(lastIteration);

        do {

            var iteration = [];

            lastIteration.forEach(function (cell) {
                var neighbours = util.getNeighbours(cell.i, cell.j, matrix).filter(function(n) {
                    return !n.forbidden;
                });

                neighbours.forEach(function (n) {
                    if ((n.wavePhase == (cell.wavePhase - 1) || n.wavePhase == (cell.wavePhase)) && result.indexOf(n) == -1 && iteration.indexOf(n) == -1) {
                        iteration.push(n);
                    }
                });
            });

            result = result.concat(iteration);
            lastIteration = iteration;
        } while (!(result.filter(function (r) {
            return r.wavePhase == 0;

        }).length > 0));

        result.forEach(function (r, idx) {
            if (r.wavePhase == 0) {
                result.splice(idx, 1);

                var cluster = self.getCluster(r.cluster, matrix);
                result = result.concat(cluster);
            }
        });

        return result.forEach(function(r) {
            return !r.forbidden;
        });
    },

    makePath: function (start, matrix) {
        var self = this;

        var current = start;
        var path = [];

        path.push(current);

        do {

            current = path[path.length - 1];

            var neighbours = util.getNeighbours(current.i, current.j, matrix)
                .filter(function (n) {
                    return n.hasOwnProperty('wavePhase') && n.wavePhase <= current.wavePhase && (path.indexOf(n) == -1);
                });

            var desired = neighbours.filter(function (n) {
                return n.cluster !== -1;
            });

            if (desired.length > 0) {
                path.push(self.getWithMinPhaseFromArray(desired));

            } else {

                path.push(self.getWithMinPhaseFromArray(neighbours));
            }
        } while (!(path[path.length - 1].wavePhase == 0));

        return path;
    },

    getPath: function (waveDownMatrix) {
        var self = this;

        var minElements = [];

        var row = waveDownMatrix.length - 1;

        for (var j = 0; j < waveDownMatrix.length; j++) {
            if (waveDownMatrix[row][j].hasOwnProperty('wavePhase')) {
                minElements.push(waveDownMatrix[row][j]);
            }
        }

        var paths = [];

        for (var i = 0; i < minElements.length; i++) {
            paths.push(self.makePath(minElements[i], waveDownMatrix));
        }

        return self.getBestPath(paths);
    },

    getBestPath: function (paths) {
        var self = this;

        var min = self.getNumberOfRed(paths[0]), best = paths[0];

        for (var i = 1; i < paths.length; i++) {
            var red = self.getNumberOfRed(paths[i]);

            if (red < min) {
                min = red;
                best = paths[i];
            }
        }

        paths = paths.filter(function (path) {
            return self.getNumberOfRed(path) == min;
        });

        var shortest = paths[0], length = paths[0].length;

        for (var i = 1; i < paths.length; i++) {
            if (paths[i].length < length) {
                length = paths[i].length;
                shortest = paths[i];
            }
        }

        return shortest;
    },

    getNumberOfRed: function (path) {
        var num = 0;

        for (var i = 0; i < path.length; i++) {
            if (path[i].cluster == -1) {
                num++;
            }
        }

        return num;
    },

    getWithMinPhaseFromArray: function (arr) {
        var min = arr[0], minPhase = arr[0].wavePhase;

        for (var i = 1; i < arr.length; i++) {
            if (arr[i].wavePhase < minPhase) {
                min = arr[i];
                minPhase = min.wavePhase;
            }
        }

        return min;
    },

    rowWaved: function (side, matrix) {
        var row = this.getRowIndexBySide(side, matrix);

        for (var j = 0; j < matrix.length; j++) {
            if (matrix[row][j].hasOwnProperty('wavePhase')) {
                return true;
            }
        }

        return false;
    },

    getCluster: function (cluster, matrix) {
        var clusterArr = [];

        for (var i = 0; i < matrix.length; i++) {
            for (var j = 0; j < matrix.length; j++) {
                if (matrix[i][j].cluster == cluster) {
                    clusterArr.push(matrix[i][j]);
                }
            }
        }

        return clusterArr;
    },

    getRowIndexBySide: function (side, matrix) {
        var row;

        if (side == 'top') {
            row = 0;

        } else if (side == 'bottom') {
            row = matrix.length - 1;

        } else {
            throw new Error('There is no such side!');
        }

        return row;
    },

    initRow: function (side, matrix) {
        var row = this.getRowIndexBySide(side, matrix);

        for (var j = 0; j < matrix.length; j++) {

            if (matrix[row][j].cluster !== -1) {
                var cluster = this.getCluster(matrix[row][j].cluster, matrix);

                cluster.forEach(function (clusterCell) {
                    clusterCell.wavePhase = 0;
                });

            } else {
                matrix[row][j].wavePhase = 0;
            }
        }
    }
};