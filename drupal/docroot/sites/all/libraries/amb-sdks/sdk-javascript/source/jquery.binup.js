/**
 * jquery.binup.js
 * Author: Sam Thompson
 * Version: 1.0
 *
 * Supplies a factory method ("$.amb.binup.binupResumable(options, persona)") to set up a Resumable.js instance
 * which is compatible with AMB binary upload service.  The 'persona' parameter need only contain a valid 'access_token' property.
 *
 * Dependencies:
 *
 *  -Resumable.js - http://resumablejs.com/
 *  -SparkMD5 - https://github.com/satazor/SparkMD5
 *
 * jslint bitwise: true, indent: 2
 */

(function ($) {
  "use strict";
  var generateUniqueIdentifier = function () {
    var uuid = "", i, random;
    for (i = 0; i < 32; i += 1) {
      random = Math.random() * 16 | 0;
      if (i === 8 || i === 12 || i === 16 || i === 20) {
        uuid += "-";
      }
      uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
    }
    return uuid;

  }, query = function (resumableFile, resumableChunk) {
    return { 'keyAmbCheckSum': resumableFile.hashes[resumableChunk.offset] };
  }, computeHashes = function (resumableFile, offset, fileReader) {
    var round = resumableFile.resumableObj.getOpt('forceChunkSize') ? Math.ceil : Math.floor,
      chunkSize = resumableFile.getOpt('chunkSize'),
      numChunks = Math.max(round(resumableFile.file.size / chunkSize), 1),
      forceChunkSize = resumableFile.getOpt('forceChunkSize'),
      startByte,
      endByte,
      func = (resumableFile.file.slice ? 'slice' : (resumableFile.file.mozSlice ? 'mozSlice' : (resumableFile.file.webkitSlice ? 'webkitSlice' : 'slice'))),
      bytes;

    resumableFile.hashes = resumableFile.hashes || [];
    fileReader = fileReader || new FileReader();
    offset = offset || 0;

    if (resumableFile.resumableObj.cancelled === false) {
      startByte = offset * chunkSize;
      endByte = Math.min(resumableFile.file.size, (offset + 1) * chunkSize);

      if (resumableFile.file.size - endByte < chunkSize && !forceChunkSize) {
        endByte = resumableFile.file.size;
      }
      bytes  = resumableFile.file[func](startByte, endByte);

      fileReader.onloadend = function (e) {
        var spark = SparkMD5.ArrayBuffer.hash(e.target.result);
        resumableFile.hashes.push(spark);

        if (numChunks > offset + 1) {
          computeHashes(resumableFile, offset + 1, fileReader);
        }
      };

      fileReader.readAsArrayBuffer(bytes);
    }
  }, defaults = {
    target: 'http://dev.binup.amb-api.com/upload',
    chunkSize: 1024 * 1024,
    simultaneousUploads: 3,
    testChunks: false,
    generateUniqueIdentifier: generateUniqueIdentifier,
    query: query,
    chunkRetryInterval: 250,
    maxChunkRetries: 600,
    throttleProgressCallbacks: 0.5,
    permanentErrors: [401, 404, 415, 500, 501],
    maxFiles: undefined,
    headers: { 'Authorization': undefined }
  };

  $.amb = $.amb || {};

  $.amb.binup = {
    binupResumable: function (settings, persona) {
      var opts = $.extend({}, defaults, settings),
        resumable = new Resumable(opts);

      resumable.persona = persona;

      resumable.on('fileAdded', function (file) {
        resumable.cancelled = false;
        computeHashes(file);
      });

      resumable.on('uploadStart', function () {
        resumable.opts.headers = { 'Authorization': resumable.persona.access_token };
      });

      resumable.on('cancel', function () {
        resumable.cancelled = true;
      });

      return resumable;
    }
  };

}(jQuery));
