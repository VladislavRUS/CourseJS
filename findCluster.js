var finder = {
	findClusters: function (matr) {
		var matrix = util.copy(matr);

		var k = 0;
		var watched = [];

		for (var i = 0; i < matrix.length; i++) {
			for (var j = 0; j < matrix.length; j++) {
				var elm = matrix[i][j];

				if (elm.color !== 'white') {
					watched.push(elm);

					var left = util.getMatrixElement(i, j - 1, matrix);
					var top = util.getMatrixElement(i - 1, j, matrix);

					if (left && left.color == 'white') left = null;
					if (top && top.color == 'white') top = null;

					if (!left && !top) {
						elm.cluster = k++;
						elm.color = this.getRandomColor();

					} else if (left && top) {
						if (left.cluster < top.cluster) {

							elm.cluster = left.cluster;
							this.mergeClusters(left.cluster, top.cluster, watched);

						} else {
							elm.cluster = top.cluster;
							this.mergeClusters(top.cluster, left.cluster, watched);
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
	},

	mergeClusters: function (less, more, watched) {
		var color = this.getRandomColor();

		watched.forEach(function (elm) {
			if (elm.cluster == less || elm.cluster == more) {
				elm.cluster = less;
				elm.color = color;
			}
		});
	},

	getRandomColor: function () {
		var letters = '0123456789ABCDEF';
		var color = '#';
		for (var i = 0; i < 6; i++) {
			color += letters[Math.floor(Math.random() * 16)];
		}
		return color;
	}
};