/**
 * jquery.multiload.js
 * Author: Sam Thompson
 * Version: 1.0
 *
 * Provides a UI for uploading files to AMB binary upload service.
 *
 * Dependencies:
 *
 * jquery.binup.js
 *
 * TODO: refactor out Drupal-specific stuff (css "element-hidden" classes, etc.)...
 *
 */

;(function ($) {
  $.amb = $.amb || {};

  $.amb.multiload = function (settings, resumable, adige, context) {
    var multiload = this;

    var totalSize = 0,
      retries = 0,
      cancelled = false,
      complete = 0,
      progressInterval = 250,
      easingScroll = ('easeOutBack' in $.easing) ? 'easeOutBack' : '',
      easingFill = ('easeOutSine' in $.easing) ? 'easeOutSine' : '',
      defaults = {
        limit: 0,
        processTemplate: 'default',
        accessGate: []
      };

    multiload.upload = function() {
      if (resumable.files.length > 0) {
        updateStatus('Uploading...');
        retries = 0;

        resumable.upload();
      }
    };

    multiload.cancel = function() {
      cancelled = true;

      resumable.cancel();

      if (typeof multiload.opts.onCancel === 'function') {
        multiload.opts.onCancel();
      }
    };

    // Resumable.js callbacks:

    function handleFileAdd(file) {
      var els = [];
      els.push('<li id="' + file.uniqueIdentifier + '">');
      els.push('<div class="multiload-meter">');
      els.push('<span class="multiload-fill" style="width: 0%"></span>');
      els.push('<div class="multiload-col1">', '<span>', file.file.name, '</span>', '</div>');
      els.push('<div class="multiload-filesize">', humanFileSize(file.file.size, true), '</div>');
      els.push('<div class="multiload-col2">', '0%', '</div');
      els.push('</div>');
      els.push('</li>');

      $('.multiload-files', context).append(els.join(''));

      updateStatus(resumable.files.length.toString() + ' files added.  Click Upload to begin.');
      totalSize += file.file.size;
      updateTotals();

      cancelled = false;
    }

    function handleFileProgress(file) {
      var progress = Math.floor(100.0 * file.progress());

      $('#' + file.uniqueIdentifier, context).each(function() {
        if (file.success !== true && file.scrolledTo === undefined) {
          $(this).addClass('started');

          $('.multiload-files', context).stop(true, true).scrollTo(this, {
            duration: 300,
            offset: -155,
            'easing': easingScroll
          });

          file.scrolledTo = true;
        }

        if (file.lastProgress === undefined || progress !== file.lastProgress) {
          $('.multiload-fill', this).stop(true, true).animate({width: progress + '%'}, progressInterval, easingFill);
          $('.multiload-progress', this).html(progress + '%');

          file.lastProgress = progress;
        }
      });

      if (progress > 0) {
        updateStatus('Uploading file: ' + file.fileName + '...');
      }

      updateTotals();
    }

    function handleFileSuccess(file, message) {
      file.success = true;

      if (message !== undefined) {
        var parsed = $.parseJSON(message);

        if (parsed.path === undefined || parsed.path.length === 0) {
          $(file.chunks).each(function(index, chunk) {
            parsed = $.parseJSON(chunk.message());

            if (parsed.path !== undefined && parsed.path.length > 0) {
              return false;
            }
          });
        }

        if (parsed.path !== undefined && parsed.path.length > 0) {
          var attributes = {
              name: file.fileName,
              type: file.file.type
            },
            file_path = parsed.path,
            callbacks = {
              'onDone': function (asset) {
                file.asset = asset;

                complete = complete + 1;

                if (complete === resumable.files.length) {
                  var ids = [];

                  $(resumable.files).each(function (index, file) {
                    ids.push(file.asset.id);
                  });

                  updateStatus('Upload complete.');

                  if (typeof multiload.opts.onAssetsCreated === 'function') {
                    multiload.opts.onAssetsCreated(ids);
                  }
                }
              },
              'onError': function (response) {
                console.log('error during asset create: ' + response);
              }
            };

          multiload.adige.createResource(
            'asset',
            {
              attributes: attributes,
              accessGate: multiload.opts.accessGate,
              process_template: multiload.opts.processTemplate,
              file: file_path,
              callbacks: callbacks
            }
          );
        } else {
          console.log('FATAL: path not found in binup response: ', parsed);
        }
      } else {
        console.log('file.response === undefined', file);
      }
    }

    function handleFileRetry(file) {
      retries += 1;
      updateStatus('Retrying file: ' + file.fileName + '...  (retries remaining: ' + (resumable.opts.maxChunkRetries - retries) + ')');
    }

    function handleFileError() {
      updateStatus('Unrecoverable error sending files.  Check your connection and try again.', true);
      resumable.pause();
      retries = 0;
    }

    function handleCancel() {
      $('.multiload-files', context).empty();
      totalSize = 0;
      complete = 0;
      updateTotals();
      initStatus();
    }

    function handleError(message, file) {
      var parsed = $.parseJSON(message);

      if (parsed.status === 'failed' && parsed.message !== undefined && parsed.message.indexOf('o such file or dir') !== -1) {
        file.retry();
      } else {
        console.log('FATAL: error uploading file: ', file, message);
      }
    }

    function handleProgress() {
      //updateTotals();
    }

    function handleComplete() {
      if (cancelled === false) {
        //validateResources();
      }
    }

    // Convenience methods:

    function updateTotals() {
      $('.multiload-footer .multiload-filesize', context).html(humanFileSize(totalSize));

      var progress = 100.0 * resumable.progress();

      if (this.lastProgress === undefined || this.lastProgress !== progress) {
        if (cancelled === false) {
          $('.multiload-footer .multiload-fill', context).stop(true, true).animate({width: progress + '%'}, progressInterval, 'linear');
        } else {
          $('.multiload-footer .multiload-fill', context).stop(true, true).animate({width: '0%'}, 0, 'linear');
        }

        this.lastProgress = progress;
      }

      progress = Math.floor(progress);
      $('.multiload-footer .multiload-progress', context).html(progress + '%');
    }

    function updateStatus(message) {
      $('.multiload-footer .multiload-col1', context).html('<span>' + message + '</span>');
    }

    function humanFileSize(bytes) {
      var result, thresh = 1024, units = ['kB','MB','GB','TB','PB','EB','ZB','YB'], u = -1;
      if (bytes < thresh) {
        result = bytes + ' B';
      } else {
        do {
          bytes /= thresh;
          u += 1;
        } while (bytes >= thresh);
        result = bytes.toFixed(1) + ' ' + units[u];
      }
      return result;
    }

    // Initialization methods:

    function initUI() {
      var markup = '<div class="multiload-header">';
      markup = markup + '<div class="multiload-col1">Filename</div>';
      markup = markup + '<div class="multiload-col2">Status</div>';
      markup = markup + '<div class="multiload-filesize">Size</div>';
      markup = markup + '</div>';

      markup = markup + '<ul class="multiload-files"></ul>';

      markup = markup + '<div class="multiload-footer">';
      markup = markup + '<div class="multiload-meter">';
      markup = markup + '<span class="multiload-fill multiload-fill-green" style="width: 0"></span>';
      markup = markup + '<div class="multiload-col1">Browse files below or drag and drop above.</div>';
      markup = markup + '<div class="multiload-col2">0%</div>';
      markup = markup + '<div class="multiload-filesize">0 b</div>';
      markup = markup + '</div></div>';

      markup = markup + '<div class="multiload-actions">';
      markup = markup + '<label class="multiload-browse">Browse...</label>';
      markup = markup + '<input class="multiload-upload" type="submit" value="Upload">';
      markup = markup + '<input class="multiload-cancel" type="submit" value="Cancel">';
      markup = markup + '</div>';

      $('.multiload', context).append(markup);

      $('.multiload-upload', context).click(function () {
        multiload.upload();

        return false;
      });

      $('.multiload-cancel', context).click(function () {
        multiload.cancel();

        return false;
      });
    }

    function initStatus() {
      updateStatus('Browse files below or drag and drop above' + (multiload.opts.limit > 0 ? (' (max files: ' + multiload.opts.limit + ')') : '.'));
    }

    function initResumable() {
      resumable.on('fileAdded', handleFileAdd);
      resumable.on('fileProgress', handleFileProgress);
      resumable.on('fileSuccess', handleFileSuccess);
      resumable.on('fileRetry', handleFileRetry);
      resumable.on('fileError', handleFileError);
      resumable.on('cancel', handleCancel);
      resumable.on('progress', handleProgress);
      resumable.on('complete', handleComplete);
      resumable.on('error', handleError);
      resumable.assignDrop($('.multiload-files', context));
      resumable.assignBrowse($('.multiload-browse', context), false);
      $('.multiload-browse input', context).on('click', function (e) {
        this.clickCount = this.clickCount || 0;
        if (this.clickCount % 2 === 0) {
          e.preventDefault();
        }
        ++this.clickCount;
      });
    }

    function init() {
      multiload.opts = $.extend(true, {}, defaults, settings);

      multiload.adige = adige;

      initUI();
      initStatus();
      initResumable();
    }

    init();
  }

}(jQuery));