<?php

/**
 * @file
 * AMB Amas Admin menu callbacks.
 */

/**
 * AMB Amas General settings form callback.
 */
function amb_amas_general_form($form, &$form_state) {
  $settings = variable_get('amb_amas', array());

  $form['amb_amas'] = array(
    '#tree' => TRUE,
  );

  $form['amb_amas']['search_endpoint'] = array(
    '#type' => 'textfield',
    '#title' => 'Search Endpoint',
    '#description' => t('URL of the Amas Search endpoint.'),
    '#size' => 80,
    '#maxlength' => 128,
    '#required' => TRUE,
    '#default_value' => isset($settings['search_endpoint']) ? $settings['search_endpoint'] : '',
  );

  return system_settings_form($form);
}
