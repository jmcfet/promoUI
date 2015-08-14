/**
 * @class N.gui.Breadcrumb
 * @constructor
 * @extends N.gui.GUIObject
 * @param {Object} docRef
 * @param {Object} parent
 * @requires $N.gui.InlineLabel
 */
(function ($N) {
	var Breadcrumb = function (docRef, parent) {
		Breadcrumb.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonGUI", "Breadcrumb");

		this._path = [];

		this._container = new $N.gui.Container(this._docRef);
		this._parentFolderLabel = new $N.gui.InlineLabel(this._docRef, this._container);
		this._currentFolderLabel = new $N.gui.InlineLabel(this._docRef, this._container);
		this._catchupLabel = new $N.gui.InlineLabel(this._docRef, this._container);

		this._container.configure({
			height: 72,
			width: 1265
		});
		this._parentFolderLabel.configure({
			cssClass: "breadcrumbParent"
		});
		this._currentFolderLabel.configure({
			cssClass: "breadcrumbCurrent"
		});

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(Breadcrumb, $N.gui.GUIObject);

	/**
	 * @method _updateLabels
	 */
	Breadcrumb.prototype._updateLabels = function () {
		if (this._path.length <= 1) {
			if (this._path.length === 0) {
				this._parentFolderLabel.setText("");
			} else {
				this._parentFolderLabel.setText(this._path[this._path.length - 1]);
			}
			this._currentFolderLabel.setText("");
		} else {
			this._parentFolderLabel.setText(this._path[this._path.length - 2]);
			this._currentFolderLabel.setText(this._path[this._path.length - 1]);
		}
	};

	/**
	 * @method push
	 * @param {String} folderName
	 */
	Breadcrumb.prototype.push = function (folderName) {
		this._path.push(folderName);
		this._updateLabels();
	};

	/**
	 * @method showCatchup
	 * @param {String} catchupText
	 */
	Breadcrumb.prototype.showCatchup = function (catchupText) {
		this._catchupLabel.setText(catchupText);
		this._catchupLabel.show();
	};

	/**
	 * @method hideCatchup
	 */
	Breadcrumb.prototype.hideCatchup = function () {
		this._catchupLabel.hide();
	};

	/**
	 * @method pop
	 */
	Breadcrumb.prototype.pop = function () {
		this._path.pop();
		this._updateLabels();
	};

	/**
	 * @method setCssClass
	 * @param {String} cssClass
	 */
	Breadcrumb.prototype.setCssClass = function (cssClass) {
		this._container.setCssClass(cssClass);
	};

	/**
	 * @method setLabelCss
	 */
	Breadcrumb.prototype.setParentLabelCss = function (parentLabelCss) {
		this._parentFolderLabel.setCssClass(parentLabelCss);
	};


	/**
	 * @method setLabelCss
	 */

	Breadcrumb.prototype.setChildLabelCss = function (childLabelCss) {
		this._currentFolderLabel.setCssClass(childLabelCss);
	};

	/**
	 * @method setLabelCss
	 * @param {String} catchupLabelCss
	 */

	Breadcrumb.prototype.setCatchupLabelCss = function (catchupLabelCss) {
		this._catchupLabel.setCssClass(catchupLabelCss);
	};

	/**
	 * @method reset
	 */
	Breadcrumb.prototype.reset = function () {
		this._path = [];
		this._updateLabels();
	};

	/**
	 * @method setPath
	 * @param {Array} path
	 */
	Breadcrumb.prototype.setPath = function (path) {
		this._path = path.slice(0);
		this._updateLabels();
	};

	$N.gui = $N.gui || {};
	$N.gui.Breadcrumb = Breadcrumb;
}($N || {}));
