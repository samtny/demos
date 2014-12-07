<?php

/**
 * @file
 * Field API hooks for AMB Asset Browser.
 */

/**
 * Implements hook_field_info_alter().
 */
function amb_asset_browser_field_info_alter(&$info) {
  foreach (_amb_asset_browser_field_types() as $field_type) {
    if (isset($info[$field_type])) {
      $info[$field_type]['instance_settings']['browser'] = 0;
      $info[$field_type]['instance_settings']['browser_resource_types'] = array('asset');
    }
  }
}

/**
 * Implements hook_form_form_field_ui_field_edit_form_alter().
 */
function amb_asset_browser_form_field_ui_field_edit_form_alter(&$form, &$form_state, $form_id) {
  foreach (_amb_asset_browser_field_types() as $field_type) {
    if ($form['#field']['type'] === $field_type) {
      $settings = $form['#instance']['settings'];

      $form['instance']['settings']['browser'] = array(
        '#type' => 'checkbox',
        '#title' => t('Enable <em>AMB Browser</em>.'),
        '#default_value' => $settings['browser'],
        '#description' => t('The AMB Browser element allows search of existing Resources in AMB.'),
        '#weight' => 15,
      );

      $options = _amb_resource_types_options();

      $form['instance']['settings']['browser_resource_types'] = array(
        '#type' => 'select',
        '#title' => t('<em>AMB Browser</em> Resource Types'),
        '#default_value' => !empty($settings['browser_resource_types']) ? $settings['browser_resource_types'] : array('asset'),
        '#options' => $options,
        '#description' => t('Select the Resource Types to search using the AMB Browser.'),
        '#multiple' => TRUE,
        '#size' => 5,
        '#weight' => 16,
      );
    }
  }
}

/**
 * Implements hook_field_widget_form_alter().
 */
function amb_asset_browser_field_widget_form_alter(&$element, &$form_state, $context) {
  foreach (_amb_asset_browser_field_types() as $field_type) {
    if (isset($element['#type']) && $element['#type'] == $field_type) {
      $element['#process'] = array_merge($element['#process'], array('amb_asset_browser_field_widget_process'));
    }
  }
}

/**
 * Widget #process callback.
 */
function amb_asset_browser_field_widget_process($element, &$form_state, $form) {
  $field = field_widget_field($element, $form_state);
  $instance = field_widget_instance($element, $form_state);
  $settings = $instance['settings'];

  if ($settings['browser']) {
    $element['browser'] = array(
      '#type' => 'amb_asset_browser',
      '#theme_wrappers' => array(),
      '#weight' => 10,
      '#access' => empty($element['#value']['aid']),
    );

    $wrapper = NULL;

    $items = drupal_array_get_nested_value($form, array_slice($element['#array_parents'], 0, -1));
    if ($field['cardinality'] == FIELD_CARDINALITY_UNLIMITED) {
      $wrapper = $items['add_more']['#ajax']['wrapper'];
    }
    else {
      preg_match('/id="(.+)"/', $items['#prefix'], $matches);
      $wrapper = $matches[1];
    }

    $element['browser']['submit'] = array(
      '#name' => implode('_', $element['#parents']) . '_amb_asset_browser_submit',
      '#type' => 'submit',
      '#value' => t('AMB Asset Browser Submit'),
      '#ajax' => array(
        'callback' => 'amb_asset_browser_submit_button_ajax',
        'wrapper' => $wrapper,
      ),
      '#submit' => array('amb_asset_browser_submit'),
      '#limit_validation_errors' => array(
        array_slice($element['#parents'], 0, -1),
      ),
      '#attributes' => array(
        'class' => array(
          'amb-asset-browser-submit',
          'element-hidden',
        ),
      ),
    );

    _amb_asset_browser_field_add_js($field, $settings);
  }

  return $element;
}

/**
 * Helper function adds amb_asset_browser field-specific javascript settings.
 */
function _amb_asset_browser_field_add_js($field, $settings) {
  static $drupal_static_fast;
  if (!isset($drupal_static_fast)) {
    $drupal_static_fast['perm'] = &drupal_static(__FUNCTION__);
  }
  $perm = &$drupal_static_fast['perm'];

  $field_name = $field['field_name'];

  if (!isset($perm[$field_name])) {
    $field_settings = array(
      'limit' => $field['cardinality'] == -1 ? 0 : $field['cardinality'],
      'resource_types' => array_keys($settings['browser_resource_types']),
    );

    $perm[$field_name] = drupal_add_js(array('amb_asset_browser' => array('field_settings' => array($field_name => $field_settings))), 'setting') ? TRUE : FALSE;
  }
}

/**
 * Submit callback for amb_asset_browser_submit button.
 */
function amb_asset_browser_submit($form, &$form_state) {
  $array_parents = array_slice($form_state['triggering_element']['#array_parents'], 0, -2);
  $element = drupal_array_get_nested_value($form, $array_parents);

  $field_parents = $element['#field_parents'];
  $field_name = $element['#field_name'];
  $langcode = $element['#language'];

  $field_state = field_form_get_state($field_parents, $field_name, $langcode, $form_state);

  if (!empty($element['#value']['browser']['amb_asset_browser_ids'])) {
    drupal_array_set_nested_value($form_state['input'], $field_parents, NULL);

    $ids = explode(';', $element['#value']['browser']['amb_asset_browser_ids']);
    $delta = end($array_parents);

    foreach ($ids as $id) {
      if ($field_state['field']['cardinality'] == FIELD_CARDINALITY_UNLIMITED) {
        if (empty($form_state['values'][$field_name][$langcode][$delta]['aid'])) {
          $form_state['values'][$field_name][$langcode][$delta] = array(
            'aid' => $id,
          );
        }
        else {
          array_splice($form_state['values'][$field_name][$langcode], $delta, 0, array(array('aid' => $id)));
        }
      }
      else {
        $form_state['values'][$field_name][$langcode][$delta] = array(
          'aid' => $id,
        );
      }

      ++$delta;

      if ($delta == $field_state['field']['cardinality']) {
        break;
      }
    }

    if ($field_state['field']['cardinality'] == FIELD_CARDINALITY_UNLIMITED) {
      $items_count = 0;
      foreach ($form_state['values'][$field_name][$langcode] as $item) {
        if (is_array($item)) {
          ++$items_count;
        }
      }
      $field_state['items_count'] = $items_count - 1;

      field_form_set_state($field_parents, $field_name, $langcode, $form_state, $field_state);
    }
  }

  $form_state['rebuild'] = TRUE;
}

/**
 * AJAX callback for amb_asset_browser_submit button.
 */
function amb_asset_browser_submit_button_ajax($form, $form_state) {
  $array_parents = $form_state['triggering_element']['#array_parents'];

  $element = drupal_array_get_nested_value($form, array_slice($array_parents, 0, -3));
  unset($element['#theme_wrappers']);

  return theme_status_messages(array('display' => NULL)) . drupal_render($element);
}

/**
 * Helper function returns allowable Asset Browser field types.
 */
function _amb_asset_browser_field_types() {
  static $field_types = array('amb_asset', 'amb_image');

  return $field_types;
}
