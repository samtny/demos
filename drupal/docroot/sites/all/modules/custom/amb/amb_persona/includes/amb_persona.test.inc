<?php

/**
 * @file
 * AMB Persona test menu callbacks.
 */

/**
 * AMB Persona test form callback.
 */
function amb_persona_test_form($form, &$form_state) {
  $libs = libraries_load('amb-persona-php');

  if ($libs['installed'] === TRUE) {
    module_load_include('inc', 'amb_persona', 'includes/amb_persona.test');
    $form['amb_persona']['test_result'] = _amb_persona_test_all();
  }
  else {
    drupal_set_message(t('Error: unable to load AMB Persona client libraries.  Please insure /sites/all/libraries/amb-sdks exists.'), 'error');
  }

  return $form;
}

/**
 * Helper function runs AMB Persona tests and returns result array.
 */
function _amb_persona_test_all() {
  $header = array(
    t('Test Case'),
    t('Result'),
    t('Response'),
    t('Debug'),
  );

  $rows = array();

  $settings = variable_get('amb_persona', array());

  $debug = TRUE;

  $test = 'Digest authentication test (Admin credentials)';
  $credential = new Credential($settings['site_credential_email'], $settings['site_credential_password']);
  $response = amb_persona_authenticate($credential, $debug);
  $rows[] = array(
    $test,
    $response['success'] ? 'Success' : 'Fail',
    print_r($response['body'], TRUE),
    print_r($response['debug'], TRUE),
  );

  if ($response['success']) {
    $admin_access_token = json_decode($response['body'])->access_token;

    $random = _amb_persona_random_account();

    $test = 'User creation test';
    $response = amb_persona_create_user($random, $debug);
    $rows[] = array(
      $test,
      $response['success'] ? 'Success' : 'Fail',
      print_r($response['body'], TRUE),
      print_r($response['debug'], TRUE),
    );

    if ($response['success']) {
      $random['user_id'] = json_decode($response['body'])->user_id;
      $random['access_token'] = json_decode($response['body'])->access_token;

      $test = 'User deletion test';
      // User deletes self for now;
      $response = amb_persona_delete_user($random, $random['access_token'], $debug);
      $rows[] = array(
        $test,
        $response['success'] ? 'Success' : 'Fail',
        print_r($response['body'], TRUE),
        print_r($response['debug'], TRUE),
      );
    }

    $message = ($response['success'] ? 'All tests completed successfully' : 'At least one test failed');
    $peak_mem = number_format(memory_get_peak_usage());

    $rows[] = array(
      array(
        'data' => t('@message.  Peak memory usage: @peak_mem', array(
          '@message' => $message,
          '@peak_mem' => $peak_mem)
        ),
        'colspan' => count($header),
      ),
    );

  }
  else {
    $rows[] = array(
      array(
        'data' => t('Aborting remaining tests due to authentication failure...'),
        'colspan' => count($header),
      ),
    );
  }

  $table = array(
    '#theme' => 'table',
    '#header' => $header,
    '#rows' => $rows,
    '#empty' => t('No results'),
  );

  return $table;
}

/**
 * Helper function generates random account data.
 */
function _amb_persona_random_account() {
  return array(
    'email' => 'T' . substr(md5(microtime()), 0, 10) . '@' . $_SERVER['HTTP_HOST'],
    'name' => 'Tester',
    'display_name' => 'Tester',
    'password' => base64_encode(substr(md5(microtime()), 0, 10) . '@Aa1'),
    'status' => 'enabled',
    'do_authentication' => 'digest',
  );
}
