<?php

/**
 * @file
 * AMB Adige admin menu callbacks.
 */

/**
 * AMB Adige general configuration form callback.
 */
function amb_adige_general_form($form, &$form_state) {
  $settings = variable_get('amb_adige', array());

  $form['amb_adige'] = array(
    '#tree' => TRUE,
  );

  $form['amb_adige']['site_source_name'] = array(
    '#type' => 'textfield',
    '#title' => 'Site Source Name',
    '#description' => t('This will be included as "source" attribute in all requests to Adige.'),
    '#size' => 80,
    '#maxlength' => 128,
    '#required' => TRUE,
    '#default_value' => isset($settings['site_source_name']) ? $settings['site_source_name'] : '',
  );

  $form['amb_adige']['binary_endpoint'] = array(
    '#type' => 'textfield',
    '#title' => 'Binary Endpoint',
    '#description' => t('All binary data will be sent to this endpoint'),
    '#size' => 80,
    '#maxlength' => 128,
    '#required' => TRUE,
    '#default_value' => isset($settings['binary_endpoint']) ? $settings['binary_endpoint'] : '',
  );

  $form['amb_adige']['binary_port'] = array(
    '#type' => 'textfield',
    '#title' => 'Binary Port',
    '#description' => t('Port to use for binary upload.'),
    '#size' => 10,
    '#maxlength' => 10,
    '#required' => TRUE,
    '#default_value' => isset($settings['binary_port']) ? $settings['binary_port'] : '',
  );

  $form['amb_adige']['resource_endpoint'] = array(
    '#type' => 'textfield',
    '#title' => 'Resource Endpoint',
    '#description' => t('Resource operations will use this endpoint.'),
    '#size' => 80,
    '#maxlength' => 128,
    '#required' => TRUE,
    '#default_value' => isset($settings['resource_endpoint']) ? $settings['resource_endpoint'] : '',
  );

  $form['amb_adige']['resource_port'] = array(
    '#type' => 'textfield',
    '#title' => 'Resource Port',
    '#description' => t('Port to use for Resource operations.'),
    '#size' => 10,
    '#maxlength' => 10,
    '#required' => TRUE,
    '#default_value' => isset($settings['resource_port']) ? $settings['resource_port'] : '',
  );

  return system_settings_form($form);
}
