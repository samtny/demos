<?php
/**
 * @file
 * Knockout.js template for AMB Asset Browser.
 */
?>

<div id="amb-asset-browser-modal" class="aab layerize element-hidden" title="AMB Asset Browser">
  <div class="aab-section aab-header">
    <div class="aab-row">
      <input type="text" id="aab-search" class="form-text" data-bind="value: searchString, valueUpdate: 'keyup', event: { keyup: searchKeyUp }" autocomplete="off" placeholder="Enter search text ...">
      <div class="aab-actions">
        <button type="button" id="aab-search-button" class="form-submit" data-bind="click: searchClick">Search</button>
        <label for="aab-sort-fields">Sort:</label>
        <select id="aab-sort-fields" class="aab-sort-fields" data-bind="options: sortFields, optionsText: 'title', value: selectedSortField, event: { change: searchClick }"></select>
        <button type="button" id="aab-order-button" data-bind="click: $root.toggleSortOrder, text: selectedSortOrder"></button>
      </div>
      <button type="button" id="aab-status" class="aab-status" data-bind="text: statusText, click: toggleOptions"></button>
    </div>
  </div>
  <div id="aab-body" class="aab-section aab-body" data-bind="event: { scroll: scrolled }">
    <div id="aab-results-container" class="aab-row">
      <ul id="aab-results" class="aab-results" data-bind="foreach: { data: viewportResults }">
        <li data-bind="event: { click: $root.resultClick }, css: { selected: selected() == true }">
          <img data-bind="attr: { src: image }" />
          <span class="aab-image-label" data-bind="text: title"></span>
        </li>
      </ul>
    </div>
  </div>
  <div class="aab-section aab-footer">
    <div class="aab-row">
      <ul class="aab-results-selected" data-bind="foreach: { data: selected }">
        <li data-bind="event: { click: $root.selectedResultClick }">
          <img data-bind="attr: { src: image }" />
        </li>
      </ul>
      <button type="button" id="aab-done-button" class="form-submit pull-right" data-bind="click: doneClick, enable: selected().length > 0">Choose</button>
      <button type="button" id="aab-cancel-button" class="form-submit pull-right" data-bind="click: cancelClick">Cancel</button>
    </div>
  </div>
</div>
