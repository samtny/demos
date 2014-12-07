<?php

/**
 * @file
 * JSON callbacks for AMB Persona.
 */

/**
 * Menu callback (secured by administrative permission) for Persona JSON.
 */
function amb_persona_ajax($action = NULL) {
  $data = array();

  switch ($action) {
    case 'token':
      $data['token'] = amb_persona_get_admin_token();
      break;
  }

  drupal_json_output($data);
}
