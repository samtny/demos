<?php

/**
 * @file
 * AMB Migrate Drush API hooks.
 */

/**
 * Implements hook_drush_command().
 */
function amb_migrate_drush_command() {
  $items['amb-migrate-node'] = array(
    'description' => 'Migrates a Node to AMB.',
    'arguments' => array(
      'nid' => 'The Node id',
    ),
    'options' => array(
      'force' => array(
        'description' => 'Force re-creation of AMB resource.',
      ),
      'ignore-missing-files' => array(
        'description' => 'Ignore missing files.',
      ),
    ),
    'examples' => array(
      'drush amb-migrate-node 18484' => 'Migrate Node 18484 to AMB',
      'drush amb-migrate-node 18484 --ignore-missing-files' => 'Migrate Node 18484 to AMB.  Missing files are not included in migrated content.',
    ),
  );

  return $items;
}

/**
 * Migrate Node command callback.
 */
function drush_amb_migrate_node($nid = FALSE) {
  if ($nid) {
    $node = node_load($nid);
    if ($node) {
      $force = drush_get_option('force', FALSE);
      $ignore_missing_files = drush_get_option('ignore-missing-files', FALSE);

      // TODO: factor up/out.  below is FlexOnline.com-specific for now.
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

      $output = array();
      $success = amb_migrate_amb_migrate_node($node, $options, $output);

      if ($success) {
        $message = t('Node !nid migrated successfully.', array('!nid' => $nid));
        drush_log($message, 'ok');
      }
      else {
        $message = !empty($output['message']) ? $output['message'] : 'unspecified exception';
        drush_log($message, 'error');

        $message = t('Unrecoverable error migrating Node !nid.  Aborting.', array('!nid' => $nid));
        drush_log($message, 'error');
      }
    }
    else {
      $message = t('Failed to load node !nid', array('!nid' => $nid));
      drush_log($message, 'error');
    }
  }
  else {
    $message = t('Argument nid is required.  Aborting.');
    drush_log($message, 'warning');
  }
}
