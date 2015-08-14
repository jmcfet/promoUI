/**
 * NowPane is used to contain the menus, gallery, asset info, e.t.c... that are required in the NOW context
 *
 * @class $N.gui.NowPane
 * @constructor
 * @extends $N.gui.GUIObject
 * @param {Object} docRef
 * @param {Object} parent
 */
var $N = window.parent.$N;
(function ($N) {
	var NowPane = function (docRef, parent) {
		this._log = new $N.apps.core.Log("NOW", "NowPane");
		NowPane.superConstructor.call(this, docRef);

		this._container = new $N.gui.Container(docRef);
		this._type = null;
		this._component = null;
		this.contentUID = -1;
		this._focusState = true;

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(NowPane, $N.gui.GUIObject);

	/**
	 * @method _updateComponent
	 * @param {Number} type
	 * @param {Object} component
	 */
	NowPane.prototype._updateComponent = function (type, component) {
		this._log("_updateComponent", "Enter");
		if (component && this._component !== component) {
			if (this._component) {
				this._component.removeFromParent();
			}
			this.addChild(component);
			this._type = type;
			this._component = component;
		}
		this._log("_updateComponent", "Enter");
	};

	/**
	 * @method _selectItemByChildUID
	 * @param {number} childUID
	 */
	NowPane.prototype._selectItemByChildUID = function (childUID) {
		if (this._component.selectRowByValidation) {
			this._component.selectRowByValidation(function (itemData) {
				return (itemData.id === childUID);
			});
		}
	};

	/**
	 * @method _updateData
	 * @param {Object} data
	 * @param {number} folderUID
	 * @param {number} childUID
	 */
	NowPane.prototype._updateData = function (data, folderUID, childUID) {
		this._log("_updateData", "Enter");
		if (data) {
			this.contentUID = folderUID;
			this._component.setData(data);
		}
		this._selectItemByChildUID(childUID);
		if (this._focusState) {
			this._component.focus();
		} else {
			this._component.defocus();
		}
		if (this._component.displayData) {
			this._component.displayData(!this._focusState, !this._focusState);
		}
		this._log("_updateData", "Enter");
	};

	/**
	 * @method update
	 * @param {Number} type
	 * @param {Object} component
	 * @param {Object} data
	 * @param {Number} childUID (optional)
	 */
	NowPane.prototype.update = function (type, component, data, folderUID, childUID) {
		this._log("update", "Enter");
		this._updateComponent(type, component);
		this._updateData(data, folderUID, childUID);
		this._log("update", "Enter");
	};

	/**
	 * @method getType
	 * @return {number}
	 */
	NowPane.prototype.getType = function () {
		return this._type;
	};

	/**
	 * @method select
	 */
	NowPane.prototype.select = function () {
		if (this._component && this._component.select) {
			this._component.select();
		}
	};

	/**
	 * @method focus
	 */
	NowPane.prototype.focus = function () {
		if (this._component && this._component.focus) {
			this._component.focus();
		}
		this._focusState = true;
	};

	/**
	 * @method defocus
	 */
	NowPane.prototype.defocus = function () {
		if (this._component && this._component.defocus) {
			this._component.defocus();
		}
		this._focusState = false;
	};

	/**
	 * @method setCssClass
	 * @param {String} className Name of the CSS class.
	 */
	NowPane.prototype.setCssClass = function (cssClass) {
		this._container.setCssClass(cssClass);
	};

	/**
	 * Triggers the HTML animation
	 * @method animate
	 */
	NowPane.prototype.animate = function () {
		this._container.animate();
	};

	/**
	 * @method hide
	 * @param {String} key
	 * @return {bool} handled
	 */
	NowPane.prototype.keyHandler = function (key) {
		var handled = false;
		if (this._component && this._component.keyHandler) {
			handled = this._component.keyHandler(key);
		}
		return handled;
	};

	$N.gui.NowPane = NowPane;
}($N || {}));