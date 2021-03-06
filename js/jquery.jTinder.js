/*
 * jTinder v.1.0.0
 * https://github.com/do-web/jTinder
 * Requires jQuery 1.7+, jQuery transform2d
 *
 * Copyright (c) 2014, Dominik Weber
 * Licensed under GPL Version 2.
 * https://github.com/do-web/jTinder/blob/master/LICENSE
 */
;(function ($, window, document, undefined) {
	var pluginName = "jTinder",
		defaults = {
			onDislike: null,
			onLike: null,
			animationRevertSpeed: 200,
			animationSpeed: 400,
			threshold: 1,
			likeSelector: '.like',
			dislikeSelector: '.dislike'
		};

	function Plugin(element, options) {
		this.element = element;
		this.settings = $.extend({}, defaults, options);
		this._defaults = defaults;
		this._name = pluginName;
		this.init(element);
	}

	Plugin.prototype = {

		init: function (element) {
			this.pane = $(element);
			this.pane_width = this.pane.width();
			this.touchStart = false;
			this.xStart = 0;
			this.yStart = 0;
			this.scrollStart = 0;
			this.lastPosX = 0;
			this.lastPosY = 0;
			this.posX = 0;
			this.posY = 0;

			$(element).bind('touchstart', $.proxy(this.handler, this));
			$(element).bind('touchmove', $.proxy(this.handler, this));
			$(element).bind('touchend', $.proxy(this.touchEndHandler, this));
		},

		next: function () {
			likePane.animate({'opacity': 0}, 1000);
			dislikePane.animate({'opacity': 0}, 1000);
		},

		dislike: function() {
			if(this.settings.onDislike) {
				this.settings.onDislike(this.pane);
			}
			this.next();
		},

		like: function() {
			if(this.settings.onLike) {
				this.settings.onLike(this.pane);
			}
			this.next();
		},

		calcPos: function (pageX, pageY) {
			var delta = {
				x: parseInt(pageX) - parseInt(this.xStart),
				y: parseInt(pageY) - parseInt(this.yStart)
			};
			this.posX = delta.x + this.lastPosX;
			this.posY = delta.y + this.lastPosY;
			return delta;
		},

		calcOpacity: function (delta) {
			var x = delta.x;
			var t = 1 + Math.abs(x);
			if (t > 100.0)
				t = 100.0;
			var y = Math.abs(delta.y);
			var s = 2.0 * Math.abs($(window).scrollTop() - this.scrollStart);
			if (s > y)
				y = s;
			var ratio = y / t;
			if(ratio > 1.0)
				x /= ratio;
			var opa = (Math.abs(x) / this.settings.threshold) / 100;
			if(opa > 1.0) {
				opa = 1.0;
			}
			return opa;
		},

		handler: function (ev) {
			switch (ev.type) {
				case 'touchstart':
					if(this.touchStart === false) {
						this.touchStart = true;
						this.xStart = ev.originalEvent.touches[0].pageX;
						this.yStart = ev.originalEvent.touches[0].pageY;
						this.scrollStart = $(window).scrollTop();
					}
				case 'mousedown':
					if(this.touchStart === false) {
						ev.preventDefault();
						this.touchStart = true;
						this.xStart = ev.pageX;
						this.yStart = ev.pageY;
						this.scrollStart = $(window).scrollTop();
					}
				case 'mousemove':
				case 'touchmove':
					if(this.touchStart === true) {
						if(ev.type == 'mousemove')
							ev.preventDefault();
						var pageX = typeof ev.pageX == 'undefined' ? ev.originalEvent.touches[0].pageX : ev.pageX;
						var pageY = typeof ev.pageY == 'undefined' ? ev.originalEvent.touches[0].pageY : ev.pageY;
						var delta = this.calcPos(pageX, pageY);

						var percent = delta.x * 100 / this.pane_width;

						var opa = this.calcOpacity(delta);
						if (opa >= 0.2)
							ev.preventDefault();

						likePane = this.pane.find(this.settings.likeSelector);
						dislikePane = this.pane.find(this.settings.dislikeSelector);

						if (this.posX >= 0) {
							likePane.css('transform', "translate(" + this.posX + "px, 0px) rotate(" + (percent / 2) + "deg)");
							likePane.css('opacity', opa);
							dislikePane.css('opacity', 0);
						} else if (this.posX < 0) {
							dislikePane.css('transform', "translate(" + this.posX + "px, 0px) rotate(" + (percent / 2) + "deg)");
							dislikePane.css('opacity', opa);
							likePane.css('opacity', 0);
						}
					}
					break;
			}
		},

		touchEndHandler: function (ev) {
			if(ev.type == 'mouseup')
				ev.preventDefault();

			this.touchStart = false;
      var pageX = (typeof ev.pageX == 'undefined') ? ev.originalEvent.changedTouches[0].pageX : ev.pageX;
      var pageY = (typeof ev.pageY == 'undefined') ? ev.originalEvent.changedTouches[0].pageY : ev.pageY;
			var delta = this.calcPos(pageX, pageY);
			var opa = this.calcOpacity(delta);

			var self = this;
			if (opa >= 1) {
				if (this.posX > 0) {
					this.like();
				} else {
					this.dislike();
				}
			} else {
				this.lastPosX = 0;
				this.lastPosY = 0;
				this.pane.find(this.settings.likeSelector).animate({"opacity": 0, "transform": "translate(0px,0px) rotate(0deg)"}, this.settings.animationRevertSpeed);
				this.pane.find(this.settings.dislikeSelector).animate({"opacity": 0, "transform": "translate(0px,0px) rotate(0deg)"}, this.settings.animationRevertSpeed);
			}
		}
	};

	$.fn[ pluginName ] = function (options) {
		this.each(function () {
			if (!$.data(this, "plugin_" + pluginName)) {
				$.data(this, "plugin_" + pluginName, new Plugin(this, options));
			}
			else if ($.isFunction(Plugin.prototype[options])) {
				$.data(this, 'plugin_' + pluginName)[options]();
		    }
		});

		return this;
	};

})(jQuery, window, document);
