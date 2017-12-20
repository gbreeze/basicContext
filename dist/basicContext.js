'use strict';

(function (name, definition) {

		if (typeof module != 'undefined' && module.exports) module.exports = definition();else if (typeof define == 'function' && define.amd) define(definition);else window[name] = definition();
})('basicContext', function () {

		var closeOnTouchMove = true;
		var overflow = null;

		var ITEM = 'item',
		    SEPARATOR = 'separator';

		var dom = function dom() {
				var elem = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

				return document.querySelector('.basicContext ' + elem);
		};

		var isTouchEvent = function isTouchEvent(e) {

				return e.sourceCapabilities ? e.sourceCapabilities.firesTouchEvents : 'ontouchstart' in document.documentElement;
		};

		var valid = function valid() {
				var item = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

				var emptyItem = Object.keys(item).length === 0 ? true : false;

				if (emptyItem === true) item.type = SEPARATOR;
				if (item.type == null) item.type = ITEM;
				if (item['class'] == null) item['class'] = '';
				if (item.visible !== false) item.visible = true;
				if (item.icon == null) item.icon = null;
				if (item.title == null) item.title = 'Undefined';

				// Add disabled class when item disabled
				if (item.disabled !== true) item.disabled = false;
				if (item.disabled === true) item['class'] += ' basicContext__item--disabled';

				// Item requires a function when
				// it's not a separator and not disabled
				if (item.fn == null && item.type !== SEPARATOR && item.disabled === false) {

						console.warn('Missing fn for item \'' + item.title + '\'');
						return false;
				}

				return true;
		};

		var buildItem = function buildItem(item, num) {

				var html = '',
				    span = '';

				// Parse and validate item
				if (valid(item) === false) return '';

				// Skip when invisible
				if (item.visible === false) return '';

				// Give item a unique number
				item.num = num;

				// Generate span/icon-element
				if (item.icon !== null) span = '<span class=\'basicContext__icon ' + item.icon + '\'></span>';

				// Generate item
				if (item.type === ITEM) {

						html = '\n\t\t       <tr class=\'basicContext__item ' + item['class'] + '\' data-num=\'' + item.num + '\'>\n\t\t           <td class=\'basicContext__data\'>' + span + item.title + '</td>\n\t\t       </tr>\n\t\t       ';
				} else if (item.type === SEPARATOR) {

						html = '\n\t\t       <tr class=\'basicContext__item basicContext__item--separator\'></tr>\n\t\t       ';
				}

				return html;
		};

		var build = function build(items) {

				var html = '';

				html += '\n\t        <div class=\'basicContextContainer\'>\n\t            <div class=\'basicContext\'>\n\t                <table>\n\t                    <tbody>\n\t        ';

				items.forEach(function (item, i) {
						return html += buildItem(item, i);
				});

				html += '\n\t                    </tbody>\n\t                </table>\n\t            </div>\n\t        </div>\n\t        ';

				return html;
		};

		var getNormalizedEvent = function getNormalizedEvent() {
				var e = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

				var pos = {
						x: e.clientX,
						y: e.clientY
				};

				if (e.type === 'touchend' && (pos.x == null || pos.y == null)) {

						// We need to capture clientX and clientY from original event
						// when the event 'touchend' does not return the touch position

						var touches = e.changedTouches;

						if (touches != null && touches.length > 0) {
								pos.x = touches[0].clientX;
								pos.y = touches[0].clientY;
						}
				}

				// Position unknown
				if (pos.x == null || pos.x < 0) pos.x = 0;
				if (pos.y == null || pos.y < 0) pos.y = 0;

				return pos;
		};

		var getPosition = function getPosition(e, context) {

				// Get the click position
				var normalizedEvent = getNormalizedEvent(e);

				// Set the initial position
				var x = normalizedEvent.x,
				    y = normalizedEvent.y;

				// Get size of browser
				var browserSize = {
						width: window.innerWidth,
						height: window.innerHeight
				};

				// Get size of context
				var contextSize = {
						width: context.offsetWidth,
						height: context.offsetHeight
				};

				// Set position for touch devices
				if (isTouchEvent(e)) {
						x = x - contextSize.width;
						y = y - contextSize.height;

						// Fix position based on context and browser size
						if (x < 0) x = 0;
						if (y < 0) y = y + contextSize.height;
				} else {
						// Fix position based on context and browser size
						if (x + contextSize.width > browserSize.width) x = x - (x + contextSize.width - browserSize.width);
						if (y + contextSize.height > browserSize.height) y = y - (y + contextSize.height - browserSize.height);
				}

				// Make context scrollable and start at the top of the browser
				// when context is higher than the browser
				if (contextSize.height > browserSize.height) {
						y = 0;
						context.classList.add('basicContext--scrollable');
				}

				// Calculate the relative position of the mouse to the context
				var rx = normalizedEvent.x - x,
				    ry = normalizedEvent.y - y;

				return { x: x, y: y, rx: rx, ry: ry };
		};

		var bind = function bind() {
				var item = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

				if (item.fn == null) return false;
				if (item.visible === false) return false;
				if (item.disabled === true) return false;

				dom('tr[data-num=\'' + item.num + '\']').onclick = item.fn;
				dom('tr[data-num=\'' + item.num + '\']').oncontextmenu = item.fn;

				return true;
		};

		var show = function show(items, e, fnClose, fnCallback) {

				// Build context
				var html = build(items);

				// Add context to the body
				document.body.insertAdjacentHTML('beforeend', html);

				// Save current overflow and block scrolling of site
				if (overflow == null) {
						overflow = document.body.style.overflow;
						document.body.style.overflow = 'hidden';
				}

				// Cache the context
				var context = dom();

				// Set touch style
				if (isTouchEvent(e)) {
						context.classList.add("touch");
				}

				// Calculate position
				var position = getPosition(e, context);

				// Set position
				context.style.left = position.x + 'px';
				context.style.top = position.y + 'px';
				context.style.transformOrigin = position.rx + 'px ' + position.ry + 'px';
				context.style.opacity = 1;

				// Close fn fallback
				if (fnClose == null) fnClose = close;

				// Bind click on background
				context.parentElement.onclick = fnClose;
				context.parentElement.oncontextmenu = fnClose;

				// Bind click on items
				items.forEach(bind);

				// Bind touchmove
				if (closeOnTouchMove) {
						document.body.addEventListener("touchmove", fnClose);
				}

				// Do not trigger default event or further propagation
				if (typeof e.preventDefault === 'function') e.preventDefault();
				if (typeof e.stopPropagation === 'function') e.stopPropagation();

				// Call callback when a function
				if (typeof fnCallback === 'function') fnCallback();

				return true;
		};

		var visible = function visible() {

				var elem = dom();

				if (elem == null || elem.length === 0) return false;else return true;
		};

		var close = function close(event) {

				if (visible() === false) return false;

				event.preventDefault();

				var container = document.querySelector('.basicContextContainer');

				container.parentElement.removeChild(container);

				// Reset overflow to its original value
				if (overflow != null) {
						document.body.style.overflow = overflow;
						overflow = null;
				}

				if (closeOnTouchMove) {
						document.body.removeEventListener("touchmove", close);
				}

				return true;
		};

		return {
				ITEM: ITEM,
				SEPARATOR: SEPARATOR,
				show: show,
				visible: visible,
				close: close,
				closeOnTouchMove: closeOnTouchMove
		};
});