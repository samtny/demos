/**
 * @file
 * Javascript methods for updating AMB Asset metadata.
 */

(function ($) {
    amb_asset_ajax_input_onchange = function () {
      var input = this,
        target = !$(input).parent().hasClass('resizable-textarea') ? $(input) : $(input).parent(),
        throbber = $('<div class="ajax-progress ajax-progress-throbber"><div class="throbber">&nbsp;</div></div>').insertAfter(target),
        adel = Drupal.behaviors.amb_element_ajax.adel,
        adige = Drupal.behaviors.amb_element_ajax.adige,
        amb_id = $(input).attr('amb-id'),
        namespace = Drupal.settings.amb_persona.site_application,
        properties = {};

      properties[namespace] = {};
      properties[namespace][$(input).attr('amb-key')] = $(input).val();

      $('input.amb-element-ajax').prop('disabled', true);

      adel.getResource(amb_id)
        .done(function (data) {
          adige.updateResource(
            amb_id,
            { properties: data.properties !== undefined ? $.extend(true, {}, data.properties, properties) : properties }
          )
            .always(function () {
              $('input.amb-element-ajax').prop('disabled', false);
              throbber.remove();
            });
        });
    };

  function amb_asset_ajax_add_ck(instance) {
    console.log(instance);
    instance.on('blur', function() {
      if (this.checkDirty()) {
        alert('changed...');
      }
    })
  }

  Drupal.behaviors.amb_element_ajax = {
    attach: function (context, settings) {
      Drupal.behaviors.amb_element_ajax.adige = Drupal.behaviors.amb_element_ajax.adige || Drupal.behaviors.amb_adige.createAdigeClient();
      Drupal.behaviors.amb_element_ajax.adel = Drupal.behaviors.amb_element_ajax.adel || new $.amb.adel({ endpoint: settings.amb_adel.endpoint });

      $('.amb-element-ajax', context).once('amb-element-ajax', function () {
        var input = this;

        if (window.CKEDITOR !== undefined && window.CKEDITOR.instances[$(input).attr('id')] !== undefined) {
          var proxy = window.CKEDITOR.instances[$(input).attr('id')];
          amb_asset_ajax_add_ck(proxy);
        } else {
          input.onchange = amb_asset_ajax_input_onchange;
        }
      });
    }
  };
}(jQuery));
