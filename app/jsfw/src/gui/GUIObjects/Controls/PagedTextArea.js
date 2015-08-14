/**
 * PagedTextArea displays text in pages within the boundaries of the given width and height.
 *
 * PagedTextArea can be instantiated in JavaScript like this:
 *
 *     var myMovieDescription = new $N.gui.PagedTextArea(document, view.myContainer);
 *
 * Or, you can use PagedTextArea in mark-up using the custom "nagra" namespace like this:
 *
 *     <nagra:pagedTextArea id="myMovieDescription" x="50" y="100" width="250" height="95" />
 *
 * The text to be displayed can be set by calling the setText method. However, since this class
 * doesn't handle smart breaking of words, it's recommended that callers invoke the setCharWidth
 * method to determine the best possible value.
 *
 * @class $N.gui.PagedTextArea
 * @extends $N.gui.TextArea
 *
 * @requires $N.gui.Container
 * @requires $N.gui.Label
 * @requires $N.gui.Util
 * @requires $N.gui.TextArea
 * @requires $N.gui.FrameworkCore
 *
 * @constructor
 * @param docRef {Object} document element of the page
 * @param parent {Object} the GUI object this should be added as a child of
 */
define('jsfw/gui/GUIObjects/Controls/PagedTextArea',
    [
    'jsfw/gui/GUIObjects/Components/Container',
    'jsfw/gui/GUIObjects/Components/Label',
    'jsfw/gui/helpers/Util',
    'jsfw/gui/GUIObjects/Components/TextArea',
    'jsfw/gui/FrameworkCore'
    ],
    function (Container, Label, Util, TextArea, FrameworkCore) {

		function PagedTextArea(docRef, parent) {
			PagedTextArea.superConstructor.call(this, docRef);
			this._container = new $N.gui.Container(docRef);
			this._container.setRounding(8);
			this._container.setCssStyle('fill: none; stroke: black; opacity: 0.75; stroke-width: 1;');
			this._rootElement = this._container.getRootElement();
			// set the position of the text area
			this._innerElement.setAttribute('x', PagedTextArea.TEXT_PADDING_X);
			this._innerElement.setAttribute('y', PagedTextArea.TEXT_PADDING_Y);
			this.setFontSize(15);
			this._rootElement.appendChild(this._innerElement);
			// the line after which the page numbers are shown
			this._line = this._docRef.createElement('line');
			this._line.setAttribute('style', 'stroke: black; opacity: 0.5; stroke-width: 1;');
			this._line.setAttribute('x1', 0);
			this._rootElement.appendChild(this._line);
			// page number display
			this._pageNumberText = new $N.gui.Label(docRef, this._container);
			this._pageNumberText.setFontSize(15);
			// other private attributes
			this._currentPageNumber = 0;
			this._numberOfPages = 0;
			this._pageTexts = [];
			this._charWidth = 0;
			this._hasNewlines = false;
			if (parent) {
				parent.addChild(this);
			}
		}

		$N.gui.Util.extend(PagedTextArea, $N.gui.TextArea);

		/**
		 * The number of characters that each line will accommodate. This is the value that
		 * will be used instead if callers don't invoke the setCharWidth method.
		 * @property {Number} CHARACTERS_WIDTH
		 * @readonly 10
		 */
		PagedTextArea.CHARACTER_WIDTH = 10;

		/**
		 * Adjustment factor for the line height
		 * @property {Number} LINE_HEIGHT_ADJUSTMENT
		 * @readonly 10
		 */
		PagedTextArea.LINE_HEIGHT_ADJUSTMENT = 10;
		/**
		 * Padding for the x-axis
		 * @property {Number} TEXT_PADDING_X
		 * @readonly 5
		 */
		PagedTextArea.TEXT_PADDING_X = 5;
		/**
		 * Padding for the y-axis
		 * @property {Number} TEXT_PADDING_Y
		 * @readonly 10
		 */
		PagedTextArea.TEXT_PADDING_Y = 10;
		/**
		 * Height reserved for the page number display
		 * @property {Number} PAGE_NUMBER_BLOCK_HEIGHT
		 * @readonly 30
		 */
		PagedTextArea.PAGE_NUMBER_BLOCK_HEIGHT = 30;
		/**
		 * Padding for the page number display
		 * @property {Number} PAGE_NUMBER_BLOCK_PADDING
		 * @readonly 15
		 */
		PagedTextArea.PAGE_NUMBER_BLOCK_PADDING = 15;
		/**
		 * Padding for the text area
		 * @property {Number} INNER_TEXTAREA_PADDING
		 * @readonly 10
		 */
		PagedTextArea.INNER_TEXTAREA_PADDING = 10;

		/**
		 * Calculates the number of characters after which a new page must be started.
		 * @method _getCharactersPerPage
		 * @private
		 * @return {Number}
		 */
		PagedTextArea.prototype._getCharactersPerPage = function () {
			if (this._text) {
				var linesPerPage = Math.round(this.getTextHeight() / (this.getFontSize() + PagedTextArea.LINE_HEIGHT_ADJUSTMENT)),
					charsPerLine = Math.floor(this.getWidth() / (this._charWidth || PagedTextArea.CHARACTER_WIDTH));
				//TODO work out a formula for character width based on the font size
				return Math.floor(linesPerPage * charsPerLine);
			}
			return 0;
		};

		/**
		 * Recalculates the number of pages after a change to height, width or text
		 * and reflows the text
		 * @method _updatePages
		 * @private
		 */
		PagedTextArea.prototype._updatePages = function () {
			var charsPerPage,
				i,
				j,
				startPos = 0,
				linesArray,
				linesPerPage,
				lineCount;
			if (this._text.indexOf('\n') !== -1) {
				this._hasNewlines = true;
				linesArray = this._text.split('\n');
				lineCount = linesArray.length;
				linesPerPage = Math.round(this.getTextHeight() / (this.getFontSize() + PagedTextArea.LINE_HEIGHT_ADJUSTMENT));
				this._numberOfPages = Math.ceil(lineCount / linesPerPage);
				for (i = 0; i < this._numberOfPages; i++) {
					this._pageTexts[i] = [];
					for (j = 0; j < linesPerPage; j++) {
						if (linesArray[(linesPerPage * i) + j] === undefined) {
							this._pageTexts[i].push(linesArray[(linesPerPage * i) + j]);
						}
					}
				}
			} else {
				this._hasNewlines = false;
				charsPerPage = this._getCharactersPerPage();
				if (charsPerPage) {
					this._numberOfPages = Math.ceil(this._text.length / charsPerPage);
					for (i = 0; i < this._numberOfPages; i++) {
						this._pageTexts[i] = this._text.substr(startPos, charsPerPage);
						startPos += charsPerPage;
					}
				}
			}
			this.showPage(this._currentPageNumber);
		};

		/**
		 * Moves to the page indicated by pageNumber
		 * @method showPage
		 * @param newPageNumber {Number} the page to move to. If the new page number
		 * is the same as the current one, nothing happens. If the new page number
		 * is more than the total number of pages (or is less than zero), then it's
		 * reset to zero.
		 */
		PagedTextArea.prototype.showPage = function (newPageNumber) {
			newPageNumber = !isNaN(newPageNumber) ? newPageNumber : 0; // page numbers are 0-based.
			this._pageNumberText.setText(String(newPageNumber + 1) + '/' + String(this._numberOfPages));
			if (newPageNumber >= 0 && newPageNumber < this._numberOfPages) {
				this._currentPageNumber = newPageNumber;
				var newText = this._pageTexts[newPageNumber],
					i;
				if (newText && typeof newText === 'object') {
					// reconstruct the page
					while (this._innerElement.hasChildNodes()) {
						this._innerElement.removeChild(this._innerElement.firstChild);
					}
					for (i = 0; i < newText.length; i++) {
						this._innerElement.appendChild(this._docRef.createTextNode(newText[i]));
						this._innerElement.appendChild(this._docRef.createElement('tbreak'));
					}
				} else {
					this._innerElement.textContent = newText;
				}
			}
		};

		/**
		 * Changes the text that's displayed. This will trigger a recalculation of the number
		 * of pages and result in reflow of the text. The page number will remain unchanged where
		 * possible, but the contents of the current page will change.
		 * @method setText
		 * @param newText {String} the new text that will be displayed
		 */
		PagedTextArea.prototype.setText = function (newText) {
			if (newText && newText.length && newText.length > 0) {
				this._text = newText;
				this._updatePages();
			}
		};

		/**
		 * Sets the control's x coordinate
		 * @method setX
		 * @param x {Number} the x coordinate
		 */
		PagedTextArea.prototype.setX = function (x) {
			x = parseInt(x,	10);
			this._container.setX(x);
			this._pageNumberText.setX((this.getWidth() / 2) - PagedTextArea.PAGE_NUMBER_BLOCK_PADDING);
			this._line.setAttribute('x2', this.getWidth());
		};

		/**
		 * Sets the control's y coordinate
		 * @method setY
		 * @param y {Number} the y coordinate
		 */
		PagedTextArea.prototype.setY = function (y) {
			var yPos = this.getHeight() - PagedTextArea.PAGE_NUMBER_BLOCK_HEIGHT;
			y = parseInt(y, 10);
			this._container.setY(y);
			this._pageNumberText.setY(yPos + (PagedTextArea.PAGE_NUMBER_BLOCK_HEIGHT / 2));
			this._line.setAttribute('y1', yPos);
			this._line.setAttribute('y2', yPos);
		};

		/**
		 * Changes the height of the control. This will trigger a recalculation of the number
		 * of pages and result in reflow of the text. The page number will remain unchanged where
		 * possible, but the contents of the current page might change.
		 * @method setHeight
		 * @param newHeight {Number} the new height
		 */
		PagedTextArea.prototype.setHeight = function (newHeight) {
			newHeight = parseInt(newHeight, 10);
			PagedTextArea.superClass.setHeight.call(this, (newHeight - PagedTextArea.PAGE_NUMBER_BLOCK_HEIGHT));
			this._container.setHeight(newHeight);
			this._pageNumberText.setY(this.getHeight() - (PagedTextArea.PAGE_NUMBER_BLOCK_HEIGHT / 2));
			this._line.setAttribute('y1', newHeight - PagedTextArea.PAGE_NUMBER_BLOCK_HEIGHT);
			this._line.setAttribute('y2', newHeight - PagedTextArea.PAGE_NUMBER_BLOCK_HEIGHT);
			if (this._text && this._text.length && this._text.length > 0) {
				this._updatePages();
			}
		};

		/**
		 * Changes the width of the control. This will trigger a recalculation of the number
		 * of pages and result in reflow of the text. The page number will remain unchanged where
		 * possible, but the contents of the current page might change.
		 * @method setWidth
		 * @param newWidth {Number} the new width
		 */
		PagedTextArea.prototype.setWidth = function (newWidth) {
			newWidth = parseInt(newWidth, 10);
			PagedTextArea.superClass.setWidth.call(this, (newWidth - PagedTextArea.INNER_TEXTAREA_PADDING));
			this._container.setWidth(newWidth);
			this._pageNumberText.setX((this.getWidth() / 2) - PagedTextArea.PAGE_NUMBER_BLOCK_PADDING);
			this._line.setAttribute('x2', newWidth);
			if (this._text && this._text.length && this._text.length > 0) {
				this._updatePages();
			}
		};

		/**
		 * Changes the width of individual characters. This will trigger a recalculation of the number
		 * of pages and result in reflow of the text. The page number will remain unchanged where
		 * possible, but the contents of the current page might change.
		 * @method setCharWidth
		 * @param newWidth {Number} the new width of individual characters
		 */
		PagedTextArea.prototype.setCharWidth = function (newWidth) {
			if (!isNaN(newWidth)) {
				this._charWidth = newWidth;
				if (this._text && this._text.length && this._text.length > 0) {
					this._updatePages();
				}
			}
		};

		/**
		 * Handles key presses while the control is in focus
		 * @method keyHandler
		 * @param key {String} the key that was pressed
		 * @return {Boolean} true if the key press was handled; false otherwise
		 */
		PagedTextArea.prototype.keyHandler = function (key) {
			var keys = $N.gui.FrameworkCore.getKeys();
			// TODO: Use custom keys for LEFT and RIGHT movement
			if (key === keys.KEY_RIGHT) {
				if (this._currentPageNumber < this._numberOfPages - 1) {
					this.showPage(this._currentPageNumber + 1);
				}
				return true;
			}
			if (key === keys.KEY_LEFT) {
				if (this._currentPageNumber > 0) {
					this.showPage(this._currentPageNumber - 1);
				}
				return true;
			}
			if (key === keys.KEY_UP) {
				this.setY(this.getY() - 50);
			} else if (key === keys.KEY_DOWN) {
				this.setY(this.getY() + 50);
			}
			return false;
		};

		/**
		 * Returns the height of the component
		 * @method getHeight
		 * @return {Number} the height of the component
		 */
		PagedTextArea.prototype.getHeight = function () {
			return this._container.getHeight();
		};

		/**
		 * Returns the x coordinate of this control
		 * @method getX
		 * @return {Number}
		 */
		PagedTextArea.prototype.getX = function () {
			return this._container.getX();
		};

		/**
		 * Returns the y coordinate of this control
		 * @method getY
		 * @return {Number}
		 */
		PagedTextArea.prototype.getY = function () {
			return this._container.getY();
		};

		/**
		 * Returns the height of the text area that contains the text
		 * @method getTextHeight
		 * @return {Number} height of the text area
		 */
		PagedTextArea.prototype.getTextHeight = function () {
			var height = this._innerElement.getAttribute('height');
			if (height.indexOf('px') !== -1) {
				height = height.replace(/\s*px/, '');
			}
			return parseInt(height, 10);
		};
		/**
		 * Returns the width of the component
		 * @method getWidth
		 * @return {Number} the width of the component
		 */
		PagedTextArea.prototype.getWidth = function () {
			return this._container.getWidth();
		};

		/**
		 * Returns the width of individual characters of text
		 * @method getCharWidth
		 * @return {Number} the width of individual characters
		 */
		PagedTextArea.prototype.getCharWidth = function () {
			return this._charWidth;
		};

		/**
		 * Returns the total number of pages.
		 * @method getTotalPages
		 * @return {Number}
		 */
		PagedTextArea.prototype.getTotalPages = function () {
			return this._numberOfPages;
		};

		/**
		 * Returns the current page number.
		 * @method getCurrentPageNumber
		 * @return {Number}
		 */
		PagedTextArea.prototype.getCurrentPageNumber = function () {
			return this._currentPageNumber;
		};

		/**
		 * Shows the first page.
		 * @method showFirstPage
		 */
		PagedTextArea.prototype.showFirstPage = function () {
			this.showPage(0);
		};

		/**
		 * Shows the last page.
		 * @method showLastPage
		 */
		PagedTextArea.prototype.showLastPage = function () {
			this.showPage(this.getTotalPages() - 1);
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.PagedTextArea = PagedTextArea;
		return PagedTextArea;
	}
);