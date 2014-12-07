
(function ($) {
  Drupal.behaviors.amb_image = {
    attach: function (context, settings) {
      $('img.amb-image-derivative', context).once('amb_image', function () {
        $(this).imgtry();
      });
    }
  };
}(jQuery));
