<?php

/**
 * @file
 * AMB Asset Multiload Field API hooks.
 */

/**
 * Implements hook_field_info_alter().
 */
function amb_asset_multiload_field_info_alter(&$info) {
  foreach (_amb_asset_multiload_field_types() as $field_type) {
    if (isset($info[$field_type])) {
      $info[$field_type]['instance_settings']['multiload'] = 0;
    }
  }
}

/**
 * Implements hook_form_form_field_ui_field_edit_form_alter().
 */
function amb_asset_multiload_form_field_ui_field_edit_form_alter(&$form, &$form_state, $form_id) {
  foreach (_amb_asset_multiload_field_types() as $field_type) {
    if ($form['#field']['type'] === $field_type) {
      $settings = $form['#instance']['settings'];

      $form['instance']['settings']['multiload'] = array(
        '#type' => 'checkbox',
        '#title' => t('Enable <em>Multi-load</em>.'),
        '#default_value' => $settings['multiload'],
        '#description' => t('The Multi-load AJAX element allows multiple simultaneous asset uploads.'),
        '#weight' => 14,
      );
    }
  }
}

/**
 * Implements hook_field_widget_form_alter().
 */
function amb_asset_multiload_field_widget_form_alter(&$element, &$form_state, $context) {
  foreach (_amb_asset_multiload_field_types() as $field_type) {
    if (isset($element['#type']) && $element['#type'] == $field_type) {
      $element['#process'] = array_merge($element['#process'], array('amb_asset_multiload_field_widget_process'));
    }
  }
}

/**
 * Widget #process callback.
 */
function amb_asset_multiload_field_widget_process($element, &$form_state, $form) {
  $instance = field_widget_instance($element, $form_state);
  $settings = $instance['settings'];

  if ($settings['multiload']) {
    $field = field_widget_field($element, $form_state);

    $element['multiload'] = array(
      '#type' => 'amb_asset_multiload',
      '#toggle' => TRUE,
      '#theme_wrappers' => array(),
      '#access' => empty($element['#value']['aid']),
    );

    $items = drupal_array_get_nested_value($form, array_slice($element['#array_parents'], 0, -1));
    preg_match('/id="(.+)"/', $items['#prefix'], $matches);
    $wrapper = $matches[1];

    $element['multiload']['submit'] = array(
      '#name' => implode('_', $element['#parents']) . '_multiload_submit',
      '#type' => 'submit',
      '#value' => t('Multiload Submit'),
      '#ajax' => array(
        'callback' => 'amb_asset_multiload_submit_button_ajax',
        'wrapper' => $wrapper,
      ),
      '#submit' => array('amb_asset_multiload_submit'),
      '#limit_validation_errors' => array(
        array_slice($element['#parents'], 0, -1),
      ),
      '#attributes' => array(
        'class' => array(
          'amb-asset-multiload-submit',
          'element-hidden',
        ),
      ),
    );

    $element['upload']['#access'] = FALSE;
    $element['upload_button']['#access'] = FALSE;

    _amb_asset_multiload_field_add_js($field, $settings);
  }

  return $element;
}

/**
 * Helper function adds amb_asset_browser field-specific javascript settings.
 */
function _amb_asset_multiload_field_add_js($field, $settings) {
  static $drupal_static_fast;
  if (!isset($drupal_static_fast)) {
    $drupal_static_fast['perm'] = &drupal_static(__FUNCTION__);
  }
  $perm = &$drupal_static_fast['perm'];

  $field_name = $field['field_name'];

  if (!isset($perm[$field_name])) {
    $field_settings = array(
      'limit' => $field['cardinality'] == -1 ? 0 : $field['cardinality'],
    );

    $perm[$field_name] = drupal_add_js(array('amb_asset_multiload' => array('field_settings' => array($field_name => $field_settings))), 'setting') ? TRUE : FALSE;
  }
}

/**
 * Multiload field submit button #submit callback.
 */
function amb_asset_multiload_submit($form, &$form_state) {
  $array_parents = array_slice($form_state['triggering_element']['#array_parents'], 0, -2);

  $element = drupal_array_get_nested_value($form, $array_parents);
  $field_parents = $element['#field_parents'];
  $field_name = $element['#field_name'];
  $langcode = $element['#language'];

  $field_state = field_form_get_state($field_parents, $field_name, $langcode, $form_state);

  if (!empty($element['#value']['multiload']['amb_asset_multiload_ids'])) {
    drupal_array_set_nested_value($form_state['input'], $field_parents, NULL);

    $ids = explode(';', $element['#value']['multiload']['amb_asset_multiload_ids']);

    foreach ($ids as $id) {
      $delta = $field_state['items_count'];

      $form_state['values'][$field_name][$langcode][$delta] = array(
        'aid' => $id,
      );

      $field_state['items_count']++;
      field_form_set_state($field_parents, $field_name, $langcode, $form_state, $field_state);
    }
  }

  $form_state['rebuild'] = TRUE;
}

/**
 * Multiload field submit button #ajax callback.
 */
function amb_asset_multiload_submit_button_ajax($form, $form_state) {
  $array_parents = $form_state['triggering_element']['#array_parents'];

  $element = drupal_array_get_nested_value($form, array_slice($array_parents, 0, -3));
  unset($element['#theme_wrappers']);

  return theme_status_messages(array('display' => NULL)) . drupal_render($element);
}

/**
 * Helper function returns allowable Multiload field types.
 */
function _amb_asset_multiload_field_types() {
  static $field_types = array('amb_asset', 'amb_image');

  return $field_types;
}
