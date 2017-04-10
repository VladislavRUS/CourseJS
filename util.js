var util = {
	getMatrixElement: function (i, j, matrix) {
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
	},

	getNeighbours: function (i, j, matrix) {
		var left = this.getMatrixElement(i, j - 1, matrix);
		var top = this.getMatrixElement(i - 1, j, matrix);
		var right = this.getMatrixElement(i, j + 1, matrix);
		var bottom = this.getMatrixElement(i + 1, j, matrix);

		return [left, top, right, bottom].filter(function (n) {
			return n !== null;
		});
	},

	copy: function(obj) {
		return JSON.parse(JSON.stringify(obj));
	}
};