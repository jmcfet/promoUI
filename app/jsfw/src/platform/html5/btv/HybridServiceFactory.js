/**
 * HybridServiceFactory receives two service objects that are to be merged. It returns a merged object with attributes
 * from either object 1 or from object 2. The rules for determining whether the attributes from object 1 or object 2 are returned are passed in.
 * @class $N.platform.btv.HybridServiceFactory
 * @singleton
 * @author Nigel Thorne
 */
define('jsfw/platform/btv/HybridServiceFactory',
	[
		'jsfw/apps/core/Log'
	],
	function (Log) {

		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.btv = $N.platform.btv || {};

		$N.platform.btv.HybridServiceFactory = (function () {

			var	defineGetter,
				log = new $N.apps.core.Log("btv", "HybridServiceFactory");

		    if (Object.defineProperty) {
		        defineGetter = function (obj, name, func) {
		            Object.defineProperty(obj, name, {
		                get: func
		            });
		        };
		    } else {
			    defineGetter = function (obj, name, func) {
			        obj.__defineGetter__(name, func);
			    };
			}

			function getSecondaryLookup(secondaryOverride) {
				var i,
					lookup = {};

				for (i = 0; i < secondaryOverride.length; i++) {
					lookup[secondaryOverride[i]] = true;
				}
				return lookup;
			}

		    function getMergedObject(primaryObj, secondaryObj, secondaryOverride) {

		        var secondaryLookup = getSecondaryLookup(secondaryOverride),
					merged = {primaryObj: primaryObj,
							secondaryObj: secondaryObj};


		        defineGetter(merged, "serviceId", function () {
					return secondaryLookup.serviceId ? secondaryObj.serviceId :  primaryObj.serviceId;
		        });
		        defineGetter(merged, "logicalChannelNum", function () {
					return secondaryLookup.logicalChannelNum ? secondaryObj.logicalChannelNum :  primaryObj.logicalChannelNum;
		        });
		        defineGetter(merged, "serviceType", function () {
		            return secondaryLookup.serviceType ? secondaryObj.serviceType :  primaryObj.serviceType;
		        });
		        defineGetter(merged, "deliveryMethod", function () {
		            return secondaryLookup.deliveryMethod ? secondaryObj.deliveryMethod :  primaryObj.deliveryMethod;
		        });
		        defineGetter(merged, "serviceName", function () {
					return secondaryLookup.serviceName ? secondaryObj.serviceName :  primaryObj.serviceName;
		        });
		        defineGetter(merged, "uri", function () {
					return secondaryLookup.uri ? secondaryObj.uri :  primaryObj.uri;
		        });
				defineGetter(merged, "parentalRating", function () {
					return secondaryLookup.parentalRating ? secondaryObj.parentalRating :  primaryObj.parentalRating;
		        });
				defineGetter(merged, "isSubscribed", function () {
					return secondaryLookup.isSubscribed ? secondaryObj.isSubscribed :  primaryObj.isSubscribed;
		        });
		        defineGetter(merged, "casId", function () {
					return secondaryLookup.casId ? secondaryObj.casId :  primaryObj.casId;
		        });
		        defineGetter(merged, "logo", function () {
					return secondaryLookup.logo ? secondaryObj.logo :  primaryObj.logo;
		        });
		        defineGetter(merged, "_data", function () {
					return primaryObj._data;
		        });
		        defineGetter(merged, "primaryObject", function () {
					return primaryObj;
		        });
		        defineGetter(merged, "secondaryObject", function () {
					return secondaryObj;
		        });
		        return merged;
		    }

			return {

				/**
				* Takes two service objects from the platform and returns a merged object with attributes taken from either
				* object 2 (if the attribute is defined in the secondaryOverride array) or from object 1 (if it isn't).
				* @method mergeObjects
				* @param {Object} obj Primary service object
				* @param {Object} obj Secondary service object
				* @param {Array} array Secondary override array of fields in secondary object whose values will override those in the primary object
				* @return {Object}
				*/
				mergeObjects: function (primaryObj, secondaryObj, secondaryOverride) {
					if (primaryObj) {
						if (secondaryObj && secondaryOverride) {
							return getMergedObject(primaryObj, secondaryObj, secondaryOverride);
						} else {
							return primaryObj;
						}
					} else {
						return null;
					}
				}
			};
		}());
		return $N.platform.btv.HybridServiceFactory;
	}
);