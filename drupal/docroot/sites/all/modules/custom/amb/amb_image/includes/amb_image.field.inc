<?php

/**
 * @file
 * AMB Image Field API hooks.
 */

/**
 * Implements hook_field_info().
 */
function amb_image_field_info() {
  $settings = field_info_field_settings('amb_asset');

  $instance_settings = field_info_instance_settings('amb_asset');
  $instance_settings += array(
    'alt_field' => 0,
    'title_field' => 0,
    'caption_field' => 0,
    'caption_field_element' => 0,
    'photo_credit_field' => 0,
    'thumbnail_derivative' => 0,
    'preview_derivative' => 0,
  );

  return array(
    'amb_image' => array(
      'label' => t('AMB Image'),
      'settings' => $settings,
      'instance_settings' => $instance_settings,
      'default_widget' => 'amb_image_default',
      'default_formatter' => 'amb_image',
      'property_type' => 'text',
    ),
  );
}

/**
 * Implements hook_field_widget_info().
 */
function amb_image_field_widget_info() {
  return array(
    'amb_image_default' => array(
      'label' => t('Default'),
      'field types' => array('amb_image'),
      'settings' => array(),
      'behaviors' => array(
        'multiple values' => FIELD_BEHAVIOR_DEFAULT,
        'default value' => FIELD_BEHAVIOR_NONE,
      ),
    ),
  );
}

/**
 * Implements hook_field_settings_form().
 */
function amb_image_field_settings_form($field, $instance, $has_data) {
  return amb_asset_field_settings_form($field, $instance, $has_data);
}

/**
 * Implements hook_field_instance_settings_form().
 */
function amb_image_field_instance_settings_form($field, $instance) {
  $settings = $instance['settings'];

  $options = amb_ambar_derivatives_options($field['settings']['process_template']);
  $form['thumbnail_derivative'] = array(
    '#title' => t('Thumbnail Derivative'),
    '#description' => t('Choose the AMB asset derivative to display while editing this field.'),
    '#type' => 'select',
    '#default_value' => !empty($settings['thumbnail_derivative']) ? $settings['thumbnail_derivative'] : '120/thumbnail/default.jpg',
    '#options' => $options,
    '#weight' => 8,
  );

  $form['preview_derivative'] = array(
    '#title' => t('Large Preview Derivative'),
    '#description' => t('Choose the AMB asset derivative to display when the thumbnail is clicked.'),
    '#type' => 'select',
    '#default_value' => !empty($settings['preview_derivative']) ? $settings['preview_derivative'] : '600/large_preview/default.jpg',
    '#options' => $options,
    '#weight' => 9,
  );

  $form['alt_field'] = array(
    '#type' => 'checkbox',
    '#title' => t('Enable <em>Alt</em> field'),
    '#default_value' => $settings['alt_field'],
    '#description' => t('The alt attribute may be used by search engines, screen readers, and when the image cannot be loaded.'),
    '#weight' => 10,
  );

  $form['title_field'] = array(
    '#type' => 'checkbox',
    '#title' => t('Enable <em>Title</em> field'),
    '#default_value' => $settings['title_field'],
    '#description' => t('The title attribute is used as a tooltip when the mouse hovers over the image.'),
    '#weight' => 11,
  );

  $form['caption_field'] = array(
    '#type' => 'checkbox',
    '#title' => t('Enable <em>Caption</em> field'),
    '#default_value' => $settings['caption_field'],
    '#description' => t('Allow a caption for the image.'),
    '#weight' => 12,
  );

  $form['caption_field_element'] = array(
    '#title' => t('Element type for <em>Caption</em> field'),
    '#type' => 'select',
    '#default_value' => $settings['caption_field_element'] ? $settings['caption_field_element'] : 'textfield',
    '#options' => array(
      'textfield' => 'textfield',
      'textarea' => 'textarea',
      'text_format' => 'text_format',
    ),
    '#weight' => 12.5,
  );

  $form['photo_credit_field'] = array(
    '#type' => 'checkbox',
    '#title' => t('Enable <em>Photo Credit</em> field'),
    '#default_value' => $settings['photo_credit_field'],
    '#description' => t('Allow a photo credit for the image.'),
    '#weight' => 13,
  );

  return $form;
}

/**
 * Implements hook_field_widget_form().
 */
function amb_image_field_widget_form(&$form, &$form_state, $field, $instance, $langcode, $items, $delta, $element) {
  $element_info = element_info('amb_image');
  $element += array(
    '#type' => 'amb_image',
    '#process' => array_merge($element_info['#process'], array('amb_image_field_widget_process')),
    '#element_validate' => array('amb_util_element_validate_text_format'),
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
function amb_image_field_widget_process($element, &$form_state, $form) {
  $field = field_widget_field($element, $form_state);
  $instance = field_widget_instance($element, $form_state);
  $settings = $instance['settings'];

  $element = amb_asset_field_widget_process($element, $form_state, $form);

  $item = $element['#value'];

  if (!empty($item['aid'])) {
    $element['amb_image_derivative']['#process_template'] = $field['settings']['process_template'];
    $element['amb_image_derivative']['#derivative'] = !empty($settings['thumbnail_derivative']) ? $settings['thumbnail_derivative'] : '120/thumbnail/default.jpg';
    $element['amb_image_derivative']['#preview_derivative'] = !empty($settings['preview_derivative']) ? $settings['preview_derivative'] : '600/large_preview/default.jpg';
    $element['amb_image_derivative']['#lazy'] = TRUE;

    $element['alt']['#access'] = $settings['alt_field'];

    $element['title']['#access'] = $settings['title_field'];

    $element['caption']['#access'] = $settings['caption_field'];
    $element['caption']['#type'] = $settings['caption_field_element'] ? $settings['caption_field_element'] : 'textfield';

    $element['photo_credit']['#access'] = $settings['photo_credit_field'];

    _amb_image_field_add_js();
  }

  return $element;
}

/**
 * Helper function loads javascript required by amb_image field widget.
 */
function _amb_image_field_add_js() {
  static $drupal_static_fast;
  if (!isset($drupal_static_fast)) {
    $drupal_static_fast['perm'] = &drupal_static(__FUNCTION__);
  }
  $perm = &$drupal_static_fast['perm'];

  if (!isset($perm['js'])) {
    $perm['js'] = libraries_load('jquery.imgtry.js');
  }
}

/**
 * Implements hook_field_formatter_info().
 */
function amb_image_field_formatter_info() {
  $formatters = array(
    'amb_image' => array(
      'label' => t('AMB Image Default'),
      'field types' => array('amb_image'),
      'settings' => array('derivative' => '400/small_preview/default.jpg', 'show_caption' => 0),
    ),
  );

  return $formatters;
}

/**
 * Implements hook_field_formatter_settings_form().
 */
function amb_image_field_formatter_settings_form($field, $instance, $view_mode, $form, &$form_state) {
  $display = $instance['display'][$view_mode];
  $settings = $display['settings'];

  $options = amb_ambar_derivatives_options($field['settings']['process_template']);
  $element['derivative'] = array(
    '#title' => t('Derivative'),
    '#type' => 'select',
    '#default_value' => $settings['derivative'],
    '#empty_option' => t('None (original image)'),
    '#options' => $options,
  );

  $element['show_caption'] = array(
    '#type' => 'checkbox',
    '#title' => t('Show the Caption field'),
    '#default_value' => $settings['show_caption'],
  );

  return $element;
}

/**
 * Implements hook_field_formatter_settings_summary().
 */
function amb_image_field_formatter_settings_summary($field, $instance, $view_mode) {
  $display = $instance['display'][$view_mode];
  $settings = $display['settings'];

  $options = amb_ambar_derivatives_options($field['settings']['process_template']);

  $derivative = !empty($settings['derivative']) ? $options[$settings['derivative']] : t('None (original image)');
  $caption = $settings['show_caption'] ? t('Show caption') : t('Do not show caption');

  $summary = array(
    $derivative,
    $caption,
  );

  return implode('<br />', $summary);
}

/**
 * Implements hook_field_formatter_view().
 */
function amb_image_field_formatter_view($entity_type, $entity, $field, $instance, $langcode, $items, $display) {
  $element = array();

  $settings = $display['settings'];

  foreach ($items as $delta => $item) {
    $element[$delta] = array(
      '#theme' => 'amb_image_derivative',
      '#aid' => $item['aid'],
      '#process_template' => $field['settings']['process_template'],
      '#derivative' => $settings['derivative'],
    );
  }

  return $element;
}

/**
 * Implements hook_field_is_empty().
 */
function amb_image_field_is_empty($item, $field) {
  return (amb_asset_field_is_empty($item, $field));
}
