/**
 * @class $N.gui.DynamicTableController
 * @constructor
 */
(function ($N) {
	var DynamicTableController = function () {
		'use strict';
		var selectedCellIndex = null,
			WEAK_MATCH = 1,
			SOLID_MATCH = 2;

		function setSelectedCellIndex(index) {
			selectedCellIndex = index;

		}

		function getSelectedCellIndex() {
			return selectedCellIndex;
		}

		function isBounded(
			selectedBoundary,
			targetBoundary,
			selectedNonBoundaryStart,
			selectedNonBoundaryEnd,
			targetNonBoundaryStart,
			targetNonBoundaryEnd
		) {
			if (selectedBoundary === targetBoundary) {
				if (selectedNonBoundaryStart < targetNonBoundaryEnd && selectedNonBoundaryEnd > targetNonBoundaryStart) {
					return SOLID_MATCH;
				} else if (selectedNonBoundaryStart === targetNonBoundaryEnd || selectedNonBoundaryEnd === targetNonBoundaryStart) {
					return WEAK_MATCH;
				}
			}
			return 0;
		}

		function isCellNavigatable(selectedCell, targetCell, direction) {
			var result = 0;
			switch (direction) {
			case $N.app.constants.UP:
				result = isBounded(
					selectedCell.y,
					targetCell.y + targetCell.height,
					selectedCell.x,
					selectedCell.x + selectedCell.width,
					targetCell.x,
					targetCell.x + targetCell.width
				);
				break;
			case $N.app.constants.DOWN:
				result = isBounded(
					selectedCell.y + selectedCell.height,
					targetCell.y,
					selectedCell.x,
					selectedCell.x + selectedCell.width,
					targetCell.x,
					targetCell.x + targetCell.width
				);
				break;
			case $N.app.constants.LEFT:
				result = isBounded(
					selectedCell.x,
					targetCell.x + targetCell.width,
					selectedCell.y,
					selectedCell.y + selectedCell.height,
					targetCell.y,
					targetCell.y + targetCell.height
				);
				break;
			case $N.app.constants.RIGHT:
				result = isBounded(
					selectedCell.x + selectedCell.width,
					targetCell.x,
					selectedCell.y,
					selectedCell.y + selectedCell.height,
					targetCell.y,
					targetCell.y + targetCell.height
				);
				break;
			}
			return result;
		}

		function getDestinationCellIndex(cells, direction) {
			var cellIndex = null,
				bestCell,
				currentCellNavigable,
				isBestCellSolidMatch,
				count,
				i,
				temp;
			if (selectedCellIndex !== null) {
				count = cells.length;
				for (i = 0; i < count; i++) {
					temp = cells[i];
					currentCellNavigable = isCellNavigatable(cells[selectedCellIndex], temp, direction);
					if (currentCellNavigable && (currentCellNavigable === SOLID_MATCH || !isBestCellSolidMatch)) {
						if (!bestCell || (temp.x <= bestCell.x && temp.y <= bestCell.y) || (!isBestCellSolidMatch && currentCellNavigable === SOLID_MATCH)) {
							cellIndex = i;
							bestCell = temp;
							if (currentCellNavigable === SOLID_MATCH) {
								isBestCellSolidMatch = true;
							}
						}
					}
				}
			}
			return cellIndex;
		}

		/* Public interface */
		return {
			setSelectedCellIndex : setSelectedCellIndex,
			getSelectedCellIndex : getSelectedCellIndex,
			getDestinationCellIndex : getDestinationCellIndex
		};
	};

	$N.gui = $N.gui || {};
	$N.gui.DynamicTableController = DynamicTableController;
}($N || {}));