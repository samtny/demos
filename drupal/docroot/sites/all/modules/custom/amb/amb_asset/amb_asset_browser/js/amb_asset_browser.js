/**
 * @file
 * Attaches behaviors for AMB Asset Browser.
 */

(function($) {
  Drupal.behaviors.amb_asset_browser = {
    attach: function (context, settings) {
      $('.amb-asset-browser-element', context).once('amb_asset_browser', function () {
        var wrapper = this,
          fieldName = _.last($(wrapper).attr('id').match(/.+(field-.+)-und-[0-9]+-browser/)).replace(/-/g, '_'),
          fieldSettingsAsset = Drupal.settings.amb_asset.field_settings[fieldName],
          fieldSettingsBrowser = Drupal.settings.amb_asset_browser.field_settings[fieldName];

        wrapper.limit = fieldSettingsBrowser.limit;
        wrapper.resourceTypes = fieldSettingsBrowser.resource_types;

        wrapper.onConfirmSelected = function (selected) {
          if (selected.length > 0) {
            var ambids = [],
              adige = Drupal.behaviors.amb_adige.createAdigeClient();

            for (var i = 0; i < selected.length; i++) {
              var asset = selected[i],
                amb_id = asset.ambid;

              var options = {
                // accessGate: fieldSettingsAsset.access_gate
              };

              if (asset.processTemplate === undefined || asset.processTemplate !== wrapper.processTemplate) {
                console.log('re-processing');
                options.process_template = fieldSettingsAsset.process_template
              }

              (function(adige, amb_id, options) {
                var processAfter = function () {
                  adige.updateResource(amb_id, options);
                };

                setTimeout(processAfter, 0);
              }(adige, amb_id, options));

              ambids.push(amb_id);
            }

            $('.amb-asset-browser-ids', wrapper).val(ambids.join(';'));

            $('.aab').dialog('close');

            $('.amb-asset-browser-submit', wrapper).trigger('mousedown');
          }
        };

        $('.browse', wrapper).first().click(function (e) {
          if (Drupal.behaviors.amb_asset_browser.search === undefined) {
            var persona = Drupal.behaviors.amb_persona.createPersonaClient(),
              amas = new $.amb.amas({
                endpoint: settings.amb_amas.search_endpoint,
                persona: persona
              }),
              adel = new $.amb.adel({ endpoint: settings.amb_adel.endpoint });

            Drupal.behaviors.amb_asset_browser.search = new $.amb.search({
              amas: amas,
              adel: adel
            });

            if (typeof STEgg === 'function') {
              window.st_egg = function() {
                Drupal.behaviors.amb_asset_browser.search.browser.adel = new STEgg(200, 200);

                return Drupal.behaviors.amb_asset_browser.search.browser.adel.recipe;
              };
            }
          }

          wrapper.search = Drupal.behaviors.amb_asset_browser.search;

          // FIXME: singleton behavior of 'search.browser' thing makes this ugly;
          wrapper.search.browser.settings.limit = wrapper.limit;
          wrapper.search.browser.settings.resourceTypes = wrapper.resourceTypes;
          wrapper.search.browser.settings.onConfirmSelected = wrapper.onConfirmSelected;

          $('body').addClass('noscroll');

          $('.aab').first().dialog({
            modal: true,
            width: document.documentElement.clientWidth - 60,
            height: document.documentElement.clientHeight - 60,
            position: 'center',
            resizable: true,
            closeOnEscape: false,
            open: function () {
              wrapper.search.browser.resetLayout();
            },
            resizeStop: function () {
              wrapper.search.browser.resetLayout();
            },
            beforeClose: function() {
              $('body').removeClass('noscroll');
            },
            dialogClass: 'no-close aab-dialog',
            show: {
              effect: 'fade',
              duration: 125
            },
            hide: {
              effect: 'fade',
              duration: 125
            }
          });

          return false;
        });
      });
    }
  }
}(jQuery));

var STEgg = function() {
  var salad = this;

  var kale = ['aaccff', 'aaffcc', 'ccaaff', 'ccffaa', 'ffaacc', 'ffccaa'],
    leafy = kale.length,
    parmesan = ['', 'g/', 'c/'],
    aged = parmesan.length,
    evoo = -1,
    evoonoo = -1,
    apple = ':D',
    nicoise = false,
    spicy = arguments[0] !== undefined ? arguments[0] : 100,
    spicier = arguments[1] !== undefined ? arguments[1] : false;

  salad.recipe = 'spicy tuna';

  salad.tuna = Math.floor((Math.random()*100)+1);

  salad.toss = function() {
    nicoise = salad.tuna === Math.floor((Math.random()*100)+1);
  };

  salad.resourceUrl = function () {
    salad.toss();

    if (!nicoise) {
      evoo++;
      return 'http://placehold.it/' + spicy + (spicier ? 'x' + spicier : '') + '/' + kale[evoo % leafy] + '&text=' + (arguments[0] !== undefined ? arguments[0].substring(0, 8) : apple);
    } else {
      evoonoo++;
      return 'http://placecage.com/' + parmesan[evoonoo % aged] + spicy + '/' + (spicier ? spicier : spicy);
    }
  };
};
