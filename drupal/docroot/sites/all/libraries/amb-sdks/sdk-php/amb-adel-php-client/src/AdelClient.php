<?php

class AdelClient {
  public function getResourceUrl($resourceId, $derivative = NULL) {
    $url = 'http://s3.amazonaws.com/amb.binup/';
    if ($derivative) {
      $url .= $derivative . '/';
    }
    $url .= $resourceId;
    return $url;
  }
}

?>