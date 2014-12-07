<?php

/**
 * @file
 * AMB Adel admin menu callbacks.
 */

/**
 * AMB Adel general configuration form callback.
 */
function amb_adel_general_form($form, &$form_state) {
  $settings = variable_get('amb_adel', array());

  $form['amb_adel'] = array(
    '#tree' => TRUE,
  );

  $form['amb_adel']['endpoint'] = array(
    '#type' => 'textfield',
    '#title' => 'Adel Resources Endpoint',
    '#description' => t('All AMB Resource URLs will be generated using this endpoint as root.'),
    '#size' => 80,
    '#maxlength' => 128,
    '#required' => TRUE,
    '#default_value' => isset($settings['endpoint']) ? $settings['endpoint'] : '',
  );

  return system_settings_form($form);
}
