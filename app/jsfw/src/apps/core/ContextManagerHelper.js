/**
 * ContextManagerHelper is an abstraction class used exclusively
 * by ContextManager
 *
 * @class $N.apps.core.ContextManagerHelper
 * @singleton
 */

define('jsfw/apps/core/ContextManagerHelper',
	[],
	function () {
		window.$N = $N || {};
		$N.apps = $N.apps || {};
		$N.apps.core = $N.apps.core || {};
		$N.apps.core.ContextManagerHelper = (function () {

			var XLINK_NS = "http://www.w3.org/1999/xlink";
			var mode = navigator.userAgent.indexOf("Ekioh") > -1 ? "SVG" : "HTML";

			var domAbstraction = {
				SVG: {
					setParentSize: function (resolution) {
						document.documentElement.setAttribute("viewBox", "0 0 " + resolution.width + " " + resolution.height);
						document.documentElement.setAttribute("preserveAspectRatio", "preserve");
					},
					showContextElement: function (element) {
						element.setAttribute("display", "inline");
						if (element.beginElement) {
							element.beginElement();
							document.documentElement.setFocus(element);
						}
					},
					hideContextElement: function (element) {
						if (element.endElement) {
							element.endElement();
						} else {
							element.setAttribute("display", "none"); //-- removed as causes a graphical glitch
						}
					},
					clearContextContent: function (element) {
						element.setAttributeNS(XLINK_NS, "href", "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=");
					},
					setContextSource: function (element, url) {
						element.setAttributeNS(XLINK_NS, "href", url);
					},
					createContextElement: function (id, width, height, x, y, url, htmlType) {
						var contextElem;
						if (htmlType === "DIV") {
							var contextElemiframe = document.createElement("animation");
						    contextElemiframe.setAttribute("id", id + '-iframe');
						    contextElemiframe.setAttribute("display", "none");
						    if (url) {
								this.setContextSource(contextElemiframe, url);
						    }
						    contextElem = document.createElement("g");
						    contextElem.setAttribute("id", id);
						    contextElem.setAttribute("display", "none");
						    contextElem.appendChild(contextElemiframe);
						    return contextElem;
						} else {
							contextElem = document.createElement("animation");
						    contextElem.setAttribute("id", id);
						    contextElem.setAttribute("display", "none");
						    contextElem.setAttribute("width", width);
						    contextElem.setAttribute("height", height);
						    contextElem.setAttribute("x", x);
						    contextElem.setAttribute("y", y);
						    contextElem.setAttribute("preserveAspectRatio", "preserve");
						    if (url) {
								this.setContextSource(contextElem, url);
						    }
						    return contextElem;
					    }
					},
					bringContextToTop: function (element) {
						if (element.beginElement) {
							element.parentNode.appendChild(element);
						}
					}
				},
				HTML: {
					setParentSize: function (resolution) {},
					showContextElement: function (element) {
						element.style.display = "inline";
					},
					hideContextElement: function (element) {
						element.style.display = "none";
					},
					clearContextContent: function (element) {
						element.setAttribute("src", "about:blank");
					},
					setContextSource: function (element, url) {
						element.setAttribute("src", url);
					},
					createContextElement: function (id, width, height, x, y, url, htmlType) {
						var contextElem;
						if (htmlType === "DIV") {
							var contextElemiframe = document.createElement("iframe");
						    contextElemiframe.setAttribute("id", id + '-iframe');
						    contextElemiframe.style.display = "none";
						    contextElemiframe.style.width = "0px";
						    contextElemiframe.style.height = "0px";
						    if (url) {
								contextElemiframe.setAttribute("src", url);
						    }
						    contextElem = document.createElement("div");
						    contextElem.setAttribute("id", id);
						    contextElem.style.display = "none";
						    contextElem.style.width = width + "px";
						    contextElem.style.height = height + "px";
						    contextElem.style.left = x + "px";
						    contextElem.style.top = y + "px";
						    contextElem.style.position = "absolute";
						    contextElem.appendChild(contextElemiframe);
						} else {
							contextElem = document.createElement("iframe");
						    contextElem.setAttribute("id", id);
						    contextElem.style.display = "none";
						    contextElem.style.width = width + "px";
						    contextElem.style.height = height + "px";
						    contextElem.style.left = x + "px";
						    contextElem.style.top = y + "px";
						    contextElem.style.position = "absolute";
							contextElem.setAttribute("scrolling", "no");
							contextElem.setAttribute("frameBorder", "0");
							contextElem.setAttribute("marginHeight", "0");
							contextElem.setAttribute("marginWidth", "0");
							contextElem.setAttribute("overflow", "hidden");
						    if (url) {
								contextElem.setAttribute("src", url);
						    }
						}
						this.contextX = x;
						this.contextY = y;
						return contextElem;
					},
					bringContextToTop: function () {
						//TODO: change the z-order if required
					}
				}
			}[mode];

			return {
				/**
				 * Returns an object containing a set of methods that abstract the DOM
				 * interaction so the ContextManager can be used in an SVG or HTML environment
				 * @method getDomAbstraction
				 * @return {Object}
				 */
				getDomAbstraction: function () {
					return domAbstraction;
				}
			};

		}());
		return $N.apps.core.ContextManagerHelper;
	}
);
