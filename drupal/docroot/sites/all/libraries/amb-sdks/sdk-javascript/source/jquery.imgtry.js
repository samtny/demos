/**
 * jQuery ImgTry plugin v1.0
 *
 * @author Sam Thompson
 * @description Tries repeatedly to load an <img> tag from data-src attribute.
 * @example <img data-src="http://dev.adel.amb-api.com/v1/resources/xyz/thumbnail.jpg" /><script type="text/javascript">$('img').imgtry(5000);</script>
 * @requires underscore.js
 */

;(function ($) {
  $.fn.imgtry = function (interval) {
    var blank = 'data:image/gif;base64,R0lGODlhEAAJAIAAAP///wAAACH5BAEAAAAALAAAAAAQAAkAAAIKhI+py+0Po5yUFQA7',
      _interval = interval || 1000,
      imgtry = function (imgs) {
        imgs.attr('src', imgs.attr('data-src'));
      },
      error = function () {
        $(this).attr('data-src', $(this).attr('src'))
          .attr('src', blank);

        _.delay(imgtry, _interval, $(this));
      };

    this.on('error', error);

    imgtry(this);

    return this;
  };
}(jQuery));
