/**
 * Dummy class to allow PlayoutManager to run within OTV applications that use requireJS
 *
 * @author Nigel Thorne
 */
/* global define */
define('jsfw/platform/output/DRM',
    [],
	function () {

		function DRM() {

		}

		var proto = DRM.prototype;

		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.output = $N.platform.output || {};
		$N.platform.output.DRM = DRM;
		return DRM;
	}
);