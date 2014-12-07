<?php

/**
 * @file
 * Admin callbacks for amb_resource.
 */

/**
 * Entity mapping menu callback.
 */
function amb_resource_entity_types_admin_form($form, &$form_state) {
  $types = variable_get('amb_resource_entity_types', array());

  $form['amb_resource_entity_types'] = array(
    '#tree' => TRUE,
  );

  $entity_info = entity_get_info();

  foreach ($entity_info as $entity_type => $info) {
    $form['amb_resource_entity_types'][$entity_type] = array(
      '#type' => 'fieldset',
      '#title' => check_plain($info['label']),
      '#collapsible' => TRUE,
      '#collapsed' => TRUE,
    );

    foreach ($info['bundles'] as $bundle => $binfo) {
      $form['amb_resource_entity_types'][$entity_type]['bundles'][$bundle] = array(
        '#type' => 'fieldset',
        '#title' => check_plain($binfo['label']),
        '#collapsible' => TRUE,
        '#collapsed' => TRUE,
      );

      $form['amb_resource_entity_types'][$entity_type]['bundles'][$bundle]['resource_type'] = array(
        '#type' => 'select',
        '#title' => t('Resource Type'),
        '#options' => _amb_resource_types_options(),
        '#empty_option' => '- Select -',
        '#default_value' => isset($types[$entity_type]['bundles'][$bundle]['resource_type']) ? $types[$entity_type]['bundles'][$bundle]['resource_type'] : '',
      );

      $form['amb_resource_entity_types'][$entity_type]['bundles'][$bundle]['process_template'] = array(
        '#type' => 'select',
        '#title' => t('Process Template'),
        '#options' => amb_ambar_process_template_options(),
        '#empty_option' => '- Select -',
        '#default_value' => isset($types[$entity_type]['bundles'][$bundle]['process_template']) ? $types[$entity_type]['bundles'][$bundle]['process_template'] : '',
      );

      $form['amb_resource_entity_types'][$entity_type]['bundles'][$bundle]['access_gate'] = array(
        '#type' => 'select',
        '#title' => t('Access Gate'),
        '#options' => _amb_access_gates_options(),
        '#empty_option' => '- Select -',
        '#default_value' => isset($types[$entity_type]['bundles'][$bundle]['access_gate']) ? $types[$entity_type]['bundles'][$bundle]['access_gate'] : '',
      );
    }
  }

  return system_settings_form($form);
}
