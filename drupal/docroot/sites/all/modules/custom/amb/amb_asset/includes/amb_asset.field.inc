<?php

/**
 * @file
 * AMB Asset Field API hooks.
 */

/**
 * Implements hook_field_info().
 */
function amb_asset_field_info() {
  return array(
    'amb_asset' => array(
      'label' => t('AMB Asset'),
      'settings' => array(
        'process_template' => 'default',
        'access_gate' => 'default',
      ),
      'instance_settings' => array(),
      'default_widget' => 'amb_asset_default',
      'default_formatter' => 'amb_asset_default',
      'property_type' => 'text',
    ),
  );
}

/**
 * Implements hook_field_settings_form().
 */
function amb_asset_field_settings_form($field, $instance, $has_data) {
  $settings = $field['settings'];

  $options = amb_ambar_process_template_options();
  $form['process_template'] = array(
    '#title' => t('Process Template'),
    '#description' => t('Choose the AMB processing template for assets referenced by this field.'),
    '#type' => 'select',
    '#default_value' => isset($settings['process_template']) ? $settings['process_template'] : 'default',
    '#options' => $options,
    '#weight' => 5,
  );

  $options = _amb_access_gates_options();
  $form['access_gate'] = array(
    '#title' => t('Access Gate'),
    '#description' => t('Choose an AMB Access Gate to apply to assets used in this field.'),
    '#type' => 'select',
    '#default_value' => isset($settings['access_gate']) ? $settings['access_gate'] : 'default',
    '#options' => $options,
    '#weight' => 6,
  );

  return $form;
}

/**
 * Implements hook_field_widget_info().
 */
function amb_asset_field_widget_info() {
  return array(
    'amb_asset_default' => array(
      'label' => t('Default'),
      'field types' => array('amb_asset'),
      'settings' => array(),
      'behaviors' => array(
        'multiple values' => FIELD_BEHAVIOR_DEFAULT,
        'default value' => FIELD_BEHAVIOR_NONE,
      ),
    ),
  );
}

/**
 * Implements hook_field_widget_form().
 */
function amb_asset_field_widget_form(&$form, &$form_state, $field, $instance, $langcode, $items, $delta, $element) {
  $element_info = element_info('amb_asset');

  $element += array(
    '#type' => 'amb_asset',
    '#process' => array_merge($element_info['#process'], array('amb_asset_field_widget_process')),
  );

  if (!empty($form_state['values'][$field['field_name']][$langcode][$delta])) {
    $items = $form_state['values'][$field['field_name']][$langcode];
  }

  $defaults = array(
    'aid' => '',
  );

  $element['#default_value'] = isset($items[$delta]) ? $items[$delta] : $defaults;

  return $element;
}

/**
 * Widget #process callback.
 */
function amb_asset_field_widget_process($element, &$form_state, $form) {
  $field = field_widget_field($element, $form_state);
  $settings = $field['settings'];

  $element['#process_template'] = !empty($settings['process_template']) ? $settings['process_template'] : 'default';
  $element['#access_gate'] = !empty($settings['access_gate']) ? $settings['access_gate'] : 'default';

  $items = drupal_array_get_nested_value($form, array_slice($element['#array_parents'], 0, -1));
  preg_match('/id="(.+)"/', $items['#prefix'], $matches);
  $wrapper = $matches[1];

  foreach (element_children($element) as $key) {
    if (isset($element[$key]['#ajax'])) {
      $element[$key]['#ajax']['callback'] = 'amb_asset_field_widget_ajax';
      $element[$key]['#ajax']['wrapper'] = $wrapper;
    }
  }

  _amb_asset_field_add_js($field, $settings);

  return $element;
}

/**
 * Helper function adds AMB Asset field settings javascript.
 */
function _amb_asset_field_add_js($field, $settings) {
  static $drupal_static_fast;
  if (!isset($drupal_static_fast)) {
    $drupal_static_fast['perm'] = &drupal_static(__FUNCTION__);
  }
  $perm = &$drupal_static_fast['perm'];

  $field_name = $field['field_name'];

  if (!isset($perm[$field_name])) {
    $field_settings = array(
      'process_template' => !empty($settings['process_template']) ? $settings['process_template'] : 'default',
      'access_gate' => amb_access_gates_access_gates_info(!empty($settings['access_gate']) ? $settings['access_gate'] : 'default'),
    );

    $perm[$field_name] = drupal_add_js(array('amb_asset' => array('field_settings' => array($field_name => $field_settings))), 'setting') ? TRUE : FALSE;
  }
}

/**
 * AMB Asset field ajax callback.
 */
function amb_asset_field_widget_ajax($form, $form_state) {
  $array_parents = $form_state['triggering_element']['#array_parents'];

  $element = drupal_array_get_nested_value($form, array_slice($array_parents, 0, -2));
  unset($element['#theme_wrappers']);

  return theme_status_messages(array('display' => NULL)) . drupal_render($element);
}

/**
 * Implements hook_field_formatter_info().
 */
function amb_asset_field_formatter_info() {
  return array(
    'amb_asset' => array(
      'label' => t('AMB Asset Default'),
      'field types' => array('amb_asset', 'amb_image'),
    ),
  );
}

/**
 * Implements hook_field_formatter_view().
 */
function amb_asset_field_formatter_view($entity_type, $entity, $field, $instance, $langcode, $items, $display) {
  $element = array();

  switch ($display['type']) {
    case 'amb_asset':
      foreach ($items as $item) {
        $element[] = array(
          '#markup' => '<div>' . $item['aid'] . '</div>',
        );
      }
      break;
  }

  return $element;
}

/**
 * Implements hook_field_is_empty().
 */
function amb_asset_field_is_empty($item, $field) {
  return (empty($item['aid']));
}
