
(function ($) {
  "use strict";

  var strTrim = function (x)
  {
    return x.replace(/^\s+|\s+$/gm,'');
  };

  var AMBResultViewModel = function(title, image, sequence, ambid, processTemplate) {
    var self = this;

    self.ambid = ambid;
    self.title = title;
    self.image = image;
    //self.image = 'http://placehold.it/200/' + [ 'ffaacc', 'ffccaa', 'aaffcc', 'aaccff', 'ccffaa', '333333' ][sequence % 5] + '&text=item%20' + (sequence + 1);
    //self.image = 'http://placehold.it/200/' + [ 'ffaacc', 'ffccaa', 'aaffcc', 'aaccff', 'ccffaa', '333333' ][sequence % 6] + '&text=' + title;
    //self.image = 'http://placehold.it/200/' + [ 'ffaacc', 'ffccaa', 'aaffcc', 'aaccff', 'ccffaa', '333333' ][sequence % 6] + '&text=:D';
    self.sequence = sequence;
    self.processTemplate = processTemplate;
    self.selected = ko.observable(false);
    self.new = true;
  };

  var AMBBrowserViewModel = function(options, context) {
    var self = this,
      defaults = {
        amas: null,
        adel: null,
        limit: 0,
        resourceTypes: [],
        sort_options: [
          {
            key: 'time',
            title: 'Date',
            order: 'desc'
          },
          {
            key: 'score',
            title: 'Relevance',
            order: 'desc'
          }
        ],
        onConfirmSelected: undefined
      },
      amas,
      pendingRequest = false,
      scroller = null,
      offsetHeight = 0,
      ticking = false,
      cellHeight = 210,
      cellWidth = 210,
      autoSearchInterval = 500,
      lastAutoSearch = '',
      cols = 0,
      rows = 0,
      pageSize = 0,
      scrollTop = 0,
      currentIndex = 0,
      currentLayoutIndex = -1;

    self.searchString = ko.observable();
    self.results = [];
    self.viewportResults = ko.observableArray();
    self.selected = ko.observableArray();
    self.statusText = ko.observable();
    self.totalResults = undefined;
    self.sortFields = ko.observableArray();
    self.selectedSortField = ko.observable();
    self.selectedSortOrder = ko.observable();
    self.adel = undefined;

    self.getResultPageForIndex = function (index) {
      var normalized = Math.floor(index / pageSize) * pageSize;

      self.getResults(normalized, pageSize);
    };

    self.updateViewportResults = function(fromIndex) {
      for (var i = 0; i < pageSize; i++) {
        if (fromIndex + i < self.totalResults || self.totalResults === undefined) {
          if (self.results[fromIndex + i] === undefined) {
            self.getResultPageForIndex(fromIndex + i);

            return false;
          }
        }
      }

      self.viewportResults(self.results.slice(fromIndex, fromIndex + pageSize));

      return true;
    };

    self.update = function() {
      // re-flow;
      scrollTop = scroller.scrollTop;

      currentIndex = Math.floor(scrollTop / cellHeight) * cols;

      if (currentIndex !== currentLayoutIndex || currentLayoutIndex === -1) {
        // re-layout;
        if (self.updateViewportResults(currentIndex)) {
          $('#aab-results').css({ 'padding-top': currentIndex / cols * cellHeight + 'px' });

          currentLayoutIndex = currentIndex;
        }
      }

      ticking = false;
    };

    self.requestTick = function() {
      if (!ticking) {
        ticking = true;

        requestAnimationFrame(self.update);
        //self.update();
      }
    };

    self.scrolled = function() {
      self.requestTick();
    };

    self.resetResults = function () {
      currentLayoutIndex = -1;

      self.results = [];
      self.viewportResults([]);
      self.totalResults = undefined;

      $(scroller).scrollTop(0);

      self.resetLayout();
    };

    self.searchClick = function () {
      self.resetResults();
      self.getResults(0, pageSize);
    };

    self.searchClickDebounced = _.debounce(self.searchClick, autoSearchInterval);

    self.searchKeyUp = function(unused, e) {
      if (e.keyCode === 13) {
        self.searchClick();

        return false;
      }

      if (strTrim(self.searchString()) != strTrim(lastAutoSearch)) {
        self.searchClickDebounced();

        lastAutoSearch = self.searchString();
      }

      return true;
    };

    self.getResults = function (start, count) {
      if (pendingRequest === false) {
        if (self.searchString() !== undefined && self.searchString().length > 2) {
          pendingRequest = true;

          var request = {
            query: self.searchString(),
            resource_types: self.settings.resourceTypes,
            start: start,
            count: count,
            sort: self.selectedSortField().key,
            order: self.selectedSortField().order,
            error: self.processError,
            done: self.processResults
          };

          amas.search(request);
          //amasDummy.search(request, self.processResults, pageSize);
        }
      }
    };

    self.processError = function (textStatus) {
      self.updateStatusText('Error querying service: ' + textStatus);

      pendingRequest = false;
    };

    self.processResults = function (response) {
      var resource,
        title,
        imageSrc,
        sequence,
        ambId,
        processTemplate;

      if (response.search_information) {
        if (response.search_information.total_items !== self.totalResults) {
          self.totalResults = response.search_information.total_items;

          self.resetLayout();
        }

        if (response.resources !== undefined) {
          var start = response.search_information.start,
            length = response.resources.length,
            changed = false;

          for (var i = 0; i < length; i = i + 1) {
            resource = response.resources[i];
            title = resource.name;
            ambId = resource.amb_id;
            imageSrc = self.adel.resourceUrl(ambId, '200/thumbnail/square.jpg');
            sequence = start + i;
            processTemplate = resource.process_template !== undefined ? resource.process_template : '';

            if (self.results[sequence] === undefined) {
              self.results[sequence] = new AMBResultViewModel(title, imageSrc, sequence, ambId, processTemplate);

              changed = true;
            }
          }

          if (changed === true) {
            currentLayoutIndex = -1;
            self.requestTick();
          }
        }
      }

      self.updateStatusText();

      pendingRequest = false;
    };

    self.resultClick = function (result) {
      if (result.selected() === false) {
        if (parseInt(self.settings.limit) === 1) {
          $(self.selected()).each(function() { this.selected(false); });
          self.selected([result]);
          result.selected(true);
        } else {
          if (self.settings.limit === 0 || self.selected().length < self.settings.limit) {
            result.selected(true);
            self.selected.push(result);
          }
        }
      } else {
        result.selected(false);
        self.selected.remove(result);
      }
    };

    self.selectedResultClick = function (selected) {
      selected.selected(false);

      self.selected.remove(selected);
    };

    self.cancelClick = function () {
      $(self.selected()).each(function() {
        this.selected(false);
      });

      self.selected([]);

      // TODO: this should be callback as we should know nothing about 'dialog'...
      $('.aab').dialog('close');
    };

    self.doneClick = function () {
      if (self.settings && typeof self.settings.onConfirmSelected === 'function' && self.selected().length > 0) {
        self.settings.onConfirmSelected(self.selected());

      }

      $(self.selected()).each(function() {
        this.selected(false);
      });

      self.selected([]);
    };

    self.toggleOptions = function () {
      $('.aab-actions').toggle('fast');
    };

    self.selectedSortField.subscribe(function (newSortField) {
      self.selectedSortOrder(newSortField.order);
    });

    // TODO: mapping plugin instead of most of this;
    self.toggleSortOrder = function () {
      self.selectedSortOrder(self.selectedSortField().order === 'desc' ? 'asc' : 'desc');
      self.selectedSortField().order = self.selectedSortOrder();

      self.searchClick();
    };

    self.updateStatusText = function () {
      if (self.searchString() === undefined || self.searchString().length === 0) {
        self.statusText('AMB Resource Browser');
      } else {
        if (self.results.length === 0) {
          self.statusText('No results');
        } else {
          // TODO: probably wrong now;
          self.statusText('Showing ' + self.results.length + ' of ' + self.totalResults);
        }
      }
    };

    self.resetLayout = function () {
      cols = Math.floor($('.aab')[0].clientWidth / cellWidth);
      rows = Math.ceil($('.aab')[0].clientHeight / cellHeight);
      pageSize = cols * rows;

      $('#aab-results').width(cols * cellWidth);

      var height = Math.ceil(self.totalResults / cols) * cellHeight;

      $('#aab-results-container').css({ 'height': height });
      $('#aab-results').css({ 'padding-top': 0 });

      offsetHeight = scroller.offsetHeight;

      currentLayoutIndex = -1;
      self.requestTick();
    };

    var init = function () {
      self.settings = $.extend(true, {}, defaults, options);

      self.sortFields(self.settings.sort_options);

      amas = self.settings.amas;
      self.adel = self.settings.adel;
      scroller = $('.aab-body', context)[0];
      self.resetLayout();
      self.updateStatusText();
    };

    init();

  };

  $.amb = $.amb || {};

  $.amb.search = function(settings, context) {
    var search = this;

    search.browser = new AMBBrowserViewModel(settings, context);

    ko.applyBindings(search.browser, context);
  }
}(jQuery));
