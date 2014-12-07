<?php

/**
 * @file
 * Admin menu callbacks for AMB Migrate.
 */

/**
 * Status form callback.
 */
function amb_migrate_status_form($form, &$form_state) {
  $result = db_query_range('SELECT * FROM {amb_migrate_log} ORDER BY timestamp DESC, lid DESC', 0, 200);

  foreach ($result as $row) {
    drupal_set_message(check_plain(date('m/d/Y H:i:s', $row->timestamp) . ': ' . $row->message));
  }

  return $form;
}

/**
 * Content form callback.
 */
function amb_migrate_migrate_content_form($form, &$form_state) {
  $form['nid'] = array(
    '#type' => 'textfield',
    '#title' => 'Content ID to Process',
    '#length' => 20,
  );

  $form['force'] = array(
    '#type' => 'checkbox',
    '#title' => 'Force',
    '#description' => 'Force resources to be re-created.',
  );

  $form['ignore_missing_files'] = array(
    '#type' => 'checkbox',
    '#title' => 'Ignore Missing Files',
    '#description' => 'Use with caution: no field data will be populated for files that do not exist on disk.',
  );

  $form['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Process'),
  );

  return $form;
}

/**
 * Submit callback for content migrate.
 */
function amb_migrate_migrate_content_form_submit($form, &$form_state) {
  if (!empty($form_state['values']['nid'])) {
    $node = node_load($form_state['values']['nid']);

    $force = $form_state['values']['force'] == 1 ? TRUE : FALSE;
    $ignore_missing_files = $form_state['values']['ignore_missing_files'] == 1 ? TRUE : FALSE;

    // TODO: admin settings for field mapping - these are Flex specific.
    $field_mapping = array(
      'field_gallery_photos' => array(
        'field_name_amb' => 'field_amb_gallery_images',
        'migration_process_template' => 'flex_slideshow_migration',
        'access_gate' => 'flex_amb_asset_default',
        'ignore_missing' => $ignore_missing_files,
        'force' => $force,
      ),
      'field_default_photo' => array(
        'field_name_amb' => 'field_amb_rotator_image',
        'migration_process_template' => 'flex_rotator',
        'access_gate' => 'flex_amb_asset_default',
        'ignore_missing' => $ignore_missing_files,
        'force' => $force,
      ),
    );

    $options = array(
      'field_mapping' => $field_mapping,
      'force' => $force,
    );

    amb_migrate_amb_migrate_node($node, $options);

    drupal_set_message(check_plain('Done.  Inspect migration log for results.'));
  }
}
