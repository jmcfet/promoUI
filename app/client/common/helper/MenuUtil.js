/**
 * Helper class for lists
 *
 * @class $N.app.MenuUtil
 * @author rhill
 * @static
 * @requires $N.apps.core.Log
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.MenuUtil = (function () {
		var ITEM_POSITIONS_PREVIEW = [{x: 37, y: -180},	{x: 37, y: -60}, {x: 37, y: 60}, {x: 37, y: 180}, {x: 37, y: 300}, {x: 37, y: 420},	{x: 37, y: 540}, {x: 37, y: 660}, {x: 37, y: 780}, {x: 37, y: 900},	{x: 37, y: 1020}],
			ITEM_POSITIONS_ACTIVE = [{x: 0, y: -180}, {x: 0, y: -60}, {x: 0, y: 60}, {x: 0, y: 180}, {x: 0, y: 300}, {x: 100000, y: 420}, {x: 0, y: 724}, {x: 0, y: 844}, {x: 0, y: 964}, {x: 0, y: 1084}, {x: 0, y: 1204}],
			ITEM_POSITIONS_ACTIVE_STRIP = [{x: 23, y: -180}, {x: 23, y: -60}, {x: 23, y: 60}, {x: 23, y: 180}, {x: 23, y: 300}, {x: 100000, y: 420}, {x: 23, y: 724}, {x: 23, y: 844}, {x: 23, y: 964}, {x: 23, y: 1084}, {x: 23, y: 1204}],
			ITEM_POSITIONS_OPTIONS_MENU = [{x: 0, y: 0}, {x: 156, y: 0}, {x: 312, y: 0}, {x: 468, y: 0}, {x: 624, y: 0}, {x: 780, y: 0}, {x: 936, y: 0}, {x: 1092, y: 0}, {x: 1248, y: 0}],
			OPACITY_VALUES = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
			OPACITY_VALUES_SELECTOR = [0, 0.2, 0.2, 0.5, 0.8, 1, 0.8, 0.5, 0.2, 0.2, 0],
			ITEM_HIGHLIGHTED_TIMEOUT_MS = 200;

		// Public
		return {
			getItemPositionsPreview: function () {
				return ITEM_POSITIONS_PREVIEW;
			},
			getItemPositionsActive: function () {
				return ITEM_POSITIONS_ACTIVE;
			},
			getItemPositionsActiveStrip: function () {
				return ITEM_POSITIONS_ACTIVE_STRIP;
			},
			getItemPositions: function () {
				return [ITEM_POSITIONS_PREVIEW, ITEM_POSITIONS_ACTIVE];
			},
			getItemPositionsStrip: function () {
				return [ITEM_POSITIONS_PREVIEW, ITEM_POSITIONS_ACTIVE_STRIP];
			},
			getItemPositionsOptionsMenu: function () {
				return ITEM_POSITIONS_OPTIONS_MENU;
			},
			getOpacityValues: function () {
				return OPACITY_VALUES;
			},
			getOpacityValuesSelector: function () {
				return OPACITY_VALUES_SELECTOR;
			},
			getTimeout: function () {
				return ITEM_HIGHLIGHTED_TIMEOUT_MS;
			}
		};
	}());

}($N || {}));