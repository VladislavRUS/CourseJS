var wave = {
	waveUp: function (matr) {
		var self = this;

		var matrix = util.copy(matr);

		var wavePhase = 0;

		var initialized = this.initRow('bottom', matrix);

		while (!this.rowWaved('top', matrix)) {
			var iterationInitialized = [];

			initialized.forEach(function (cell) {
				var neighbours = util.getNeighbours(cell.i, cell.j, matrix);

				neighbours.forEach(function (n) {
					if (!n.hasOwnProperty('wavePhase')) {
						if (n.cluster !== -1) {
							var clusterArr = self.getCluster(n.cluster, matrix);

							clusterArr.forEach(function (n) {
								n.wavePhase = wavePhase + 1;
							});
							iterationInitialized = iterationInitialized.concat(clusterArr);

						} else {
							n.wavePhase = wavePhase + 1;
							iterationInitialized.push(n);
						}
					}
				});
			});

			initialized = iterationInitialized;

			wavePhase++;
		}

		return matrix;
	},

	waveDown: function (wavedUpMatrix, prepared) {
		var matrix = util.copy(wavedUpMatrix);

		prepared.forEach(function(p) {
			matrix[p.i][p.j].allowed = true;
		});

		for (var i = 0; i < matrix.length; i++) {
			for (var j = 0; j < matrix.length; j++) {
				delete matrix[i][j].wavePhase;
			}
		}

		var wavePhase = 0;

		var row = 0;
		for (var j = 0; j < matrix.length; j++) {
			matrix[row][j].wavePhase = wavePhase;
		}

		while (!this.rowWaved('bottom', matrix)) {
			for (var i = 0; i < matrix.length; i++) {
				for (var j = 0; j < matrix.length; j++) {
					if (matrix[i][j].wavePhase == wavePhase && matrix[i][j].allowed) {
						var neighbours = util.getNeighbours(i, j, matrix).filter(function(n) {
							return n.allowed == true;
						});

						neighbours.forEach(function (n) {
							if (!n.hasOwnProperty('wavePhase')) {
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

		var phase = lastIteration[lastIteration.length - 1];

		var result = [];
		result = result.concat(lastIteration);

		do {

			var iteration = [];

			lastIteration.forEach(function (cell) {
				var neighbours = util.getNeighbours(cell.i, cell.j, matrix);

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

		result.forEach(function(r, idx) {
			if (r.wavePhase == 0) {
				result.splice(idx, 1);

				var cluster = self.getCluster(r.cluster, matrix);
				result = result.concat(cluster);
			}
		});

		return result;
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
		var initialized = [];

		for (var j = 0; j < matrix.length; j++) {

			if (matrix[row][j].cluster !== -1) {
				var cluster = this.getCluster(matrix[row][j].cluster, matrix);

				cluster.forEach(function (clusterCell) {
					clusterCell.wavePhase = 0;
				});
				initialized = initialized.concat(cluster);

			} else {
				matrix[row][j].wavePhase = 0;
				initialized.push(matrix[row][j]);
			}
		}

		return initialized;
	}
};