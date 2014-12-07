<?php

/**
 * @file
 * AMB Persona admin menu callbacks.
 */

/**
 * AMB Persona site configuration form callback.
 */
function amb_persona_site_form($form, &$form_state) {
  $settings = variable_get('amb_persona', array());

  $form['amb_persona'] = array(
    '#tree' => TRUE,
  );

  $form['amb_persona']['endpoint'] = array(
    '#type' => 'textfield',
    '#title' => 'Persona Endpoint',
    '#size' => 80,
    '#maxlength' => 128,
    '#required' => TRUE,
    '#default_value' => isset($settings['endpoint']) ? $settings['endpoint'] : '',
    '#attributes' => array(
      'disabled' => TRUE,
    ),
  );

  $form['amb_persona']['site_application'] = array(
    '#type' => 'textfield',
    '#title' => 'Application',
    '#size' => 40,
    '#maxlength' => 128,
    '#required' => TRUE,
    '#default_value' => isset($settings['site_application']) ? $settings['site_application'] : '',
    '#attributes' => array(
      'disabled' => TRUE,
    ),
  );

  $form['amb_persona']['site_api_id'] = array(
    '#type' => 'textfield',
    '#title' => 'API Id',
    '#size' => 40,
    '#maxlength' => 128,
    '#required' => TRUE,
    '#default_value' => isset($settings['site_api_id']) ? $settings['site_api_id'] : '',
    '#attributes' => array(
      'disabled' => TRUE,
    ),
  );

  $form['amb_persona']['site_api_private_key'] = array(
    '#type' => 'textfield',
    '#title' => 'API Private Key',
    '#size' => 40,
    '#maxlength' => 128,
    '#required' => TRUE,
    '#default_value' => isset($settings['site_api_private_key']) ? $settings['site_api_private_key'] : '',
    '#attributes' => array(
      'disabled' => TRUE,
    ),
  );

  $form['amb_persona']['site_credential_email'] = array(
    '#type' => 'textfield',
    '#title' => 'Admin Credential: Email',
    '#size' => 40,
    '#maxlength' => 128,
    '#required' => TRUE,
    '#default_value' => isset($settings['site_credential_email']) ? $settings['site_credential_email'] : '',
    '#attributes' => array(
      'disabled' => TRUE,
    ),
  );

  $form['amb_persona']['site_credential_password'] = array(
    '#type' => 'password',
    '#title' => 'Admin Credential: Password',
    '#size' => 40,
    '#maxlength' => 128,
    '#required' => TRUE,
    '#default_value' => isset($settings['site_credential_password']) ? $settings['site_credential_password'] : '',
    '#attributes' => array(
      'disabled' => TRUE,
    ),
  );

  $form['amb_persona']['site_credential_role'] = array(
    '#type' => 'textfield',
    '#title' => 'Admin Credential: Role',
    '#size' => 40,
    '#maxlength' => 128,
    '#required' => TRUE,
    '#default_value' => isset($settings['site_credential_role']) ? $settings['site_credential_role'] : '',
    '#attributes' => array(
      'disabled' => TRUE,
    ),
  );

  $form['amb_persona']['site_session_slide_interval'] = array(
    '#type' => 'textfield',
    '#title' => 'Admin Token Slide Interval',
    '#size' => 40,
    '#maxlength' => 128,
    '#required' => TRUE,
    '#default_value' => isset($settings['site_session_slide_interval']) ? $settings['site_session_slide_interval'] : '+20 minutes',
    '#attributes' => array(
      'disabled' => TRUE,
    ),
  );

  return $form;
}
