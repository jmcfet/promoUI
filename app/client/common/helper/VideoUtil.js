/**
 * @class $N.app.VideoUtil
 * @author aprice
 * @static
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.VideoUtil = (function () {
		// Public
		return {
			/**
			* Checks to see if 3d Mode is On or Off In Middleware
			* @method is3dModeOn
			* @return {Boolean} returns true or false
			*/
			is3DModeOn: function () {
				return (CCOM.System.get3dMode().mode === CCOM.System.STEREOSCOPIC_3D_MODE_ON);
			},

			/**
			 * Enables 3d Mode in the Middleware
			 * @method enable3dMode
			 */
			enable3DMode: function () {
				CCOM.System.set3dMode(CCOM.System.STEREOSCOPIC_3D_MODE_ON);
			},

			/**
			* Disables 3d Mode in the Middleware
			* @method disable3dMode
			*/
			disable3DMode: function () {
				CCOM.System.set3dMode(CCOM.System.STEREOSCOPIC_3D_MODE_OFF);
			}
		};
	}());

}($N || {}));
