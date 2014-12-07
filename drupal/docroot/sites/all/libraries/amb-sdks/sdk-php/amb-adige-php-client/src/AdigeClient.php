<?php

class AdigeClient {
  private $result = array();
  
  private $settings = array(
    'binary_endpoint' => '',
    'binary_port' => '80',
    'binary_bucket' => 'binup',
    'binary_bucket_id' => '555',
    'resource_endpoint' => '',
    'resource_port' => '80',
    'resource_source_name' => '',
    'process_template' => '',
    'token' => '',
    'folder' => '/',
    'chunk_size_max' => 30000000,
    'debug' => FALSE,
  );
  
  public function __construct($options = array()) {
    $this->settings = array_merge($this->settings, $options);
  }
  
  public function getResult() {
    return $this->result;
  }
  
  public function getSuccess() {
    if (is_array($this->result)) {
      foreach ($this->result as $result) {
        if (!isset($result['success']) || !$result['success']) {
          return FALSE;
        }
      }
    }
    else {
      return FALSE;
    }
    return TRUE;
  }

  public function getResourceId() {
    return isset($this->result['resource']['id']) ? $this->result['resource']['id'] : FALSE;
  }
  
  public function getResourcePath() {
    return isset($this->result['resource']['path']) ? $this->result['resource']['path'] : FALSE;
  }

  public function createResource($resource_type, $properties = array(), $related = array(), $file = array(), $gate = array()) {
    $this->resetResult();

    $data = array(
      'resource' => array(
        'resource_type' => $resource_type,
        'title' => isset($properties['title']) ? $properties['title'] : 'none',
        'name' => isset($properties['name']) ? $properties['name'] : 'none',
        'description' => isset($properties['description']) ? $properties['description'] : 'none',
        'related' => $related,
        'properties' => $properties,
      ),
    );

    if (!empty($this->settings['process_template'])) {
      $data['process'] = array(
        'with' => $this->settings['process_template'],
        'source' => array(
          'name' => $this->settings['resource_source_name'],
        ),
      );

      if (!empty($file)) {
        $data['resource']['type'] = $file['mimetype'];
        $data['resource']['name'] = !empty($file['filename']) ? $file['filename'] : '';

        $this->uploadBinary($file['path'], $file['mimetype'], isset($file['filename']) ? $file['filename'] : FALSE);

        if ($this->getSuccess()) {
          $binfo = json_decode($this->result['binup']['response'], TRUE);

          $originals = array(
            array('file' => $binfo['path']),
          );

          $data['process']['originals'] = $originals;
        } 
      }
    }

    if (!empty($gate)) {
      $data['gate'] = $gate;
    }

    $json = json_encode($data);

    $headers = array(
      'Content-Type: application/json',
    );

    $result = $this->request($this->settings['resource_endpoint'], $this->settings['resource_port'], $json, 'POST', $headers);

    if ($response = json_decode($result['response'])) {
      if (isset($response->response_results)) {
        $resid = $response->response_results->results->resource->amb_id;
        $respath = $response->response_results->results->resource->amb_path;

        $result['id'] = $resid;
        $result['path'] = $respath;
      }
    } else {
      $result['success'] = 0;
      $result['message'] = 'Could not parse response JSON.';
    }

    $this->result['resource'] = $result;
  }

  public function updateResource($resource_id, $properties = array(), $related = array(), $gate = array()) {
    $this->resetResult();

    $data = array(
      'resource' => array(
        'amb_id' => $resource_id,
        'related' => $related,
        'properties' => $properties,
      ),
    );

    if (!empty($this->settings['process_template'])) {
      $data['process'] = array(
        'with' => $this->settings['process_template'],
        'source' => array(
          'name' => $this->settings['resource_source_name'],
        ),
      );
    }

    if (!empty($gate)) {
      $data['gate'] = $gate;
    }

    $json = json_encode($data);

    $headers = array(
      'Content-Type: application/json',
    );

    $result = $this->request($this->settings['resource_endpoint'] . '/' . $resource_id, $this->settings['resource_port'], $json, 'POST', $headers);

    if ($response = json_decode($result['response'])) {
      if (isset($response->response_results)) {
        $resid = $response->response_results->results->resource->amb_id;
        $respath = $response->response_results->results->resource->amb_path;

        $result['id'] = $resid;
        $result['path'] = $respath;
      }
    } else {
      $result['success'] = 0;
      $result['message'] = 'Could not parse response JSON.';
    }

    $this->result['resource'] = $result;
  }

  public function uploadBinary($filepath, $mimetype = NULL, $filename = FALSE) {
    $size_total = filesize($filepath);
    $checksum = md5_file($filepath);
    $data = array(
      'resumableChunkNumber' => 1,
      'resumableRelativePath' => $this->settings['folder'],
      'resumableFilename' => $filename ? $filename : basename($filepath),
      'resumableTotalSize' => $size_total,
      'resumableChunkSize' => $size_total,
      'file' => '@' . $filepath . ($mimetype ? ';type=' . $mimetype : ''),
      'resumableTotalChunks' => '1',
      'resumableIdentifier' => uniqid('ADClient'),
      'keyAmbCheckSum' => $checksum,
      'resumableType' => $mimetype ? $mimetype : '',
    );
    
    $this->result['binup'] = $this->request($this->settings['binary_endpoint'], $this->settings['binary_port'], $data, 'POST');
  }
    
  private function request($url, $port, $data = array(), $method = 'GET', $headers = array()) {
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, $url);
    
    if ($port != '80') {
      curl_setopt($ch, CURLOPT_PORT, $port);
    }
    
    $headers = array_merge(array('Authorization: ' . $this->settings['token']), $headers);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    switch($method) {
      case 'GET':
        $url .= '?' . urlencode(implode('&', $data));
        break;
      
      case 'POST':
        curl_setopt($ch, CURLOPT_POST, TRUE);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        break;
      
      default:
        die('unsupported method');
        break;
    }
    
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
    
    $response = curl_exec($ch);
    
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    $result['code'] = $code;
    $result['success'] = in_array($code, array('200', '201')) ? 1 : 0;
    $result['response'] = $response;
    
    if ($this->settings['debug'] === TRUE) {
      $result['debug']['request'] = array(
        'url' => $url,
        'port' => $port,
        'data' => $data,
        'method' => $method,
        'headers' => $headers,
      );
      $result['debug']['error'] = curl_error($ch);
      $result['debug']['data'] = $data;
      $result['debug']['post_info'] = curl_getinfo($ch);
      $result['debug']['peak_mem'] = memory_get_peak_usage();
    }
    
    curl_close($ch);
    
    return $result;
  }
  
  private function resetResult() {
    $this->result = array();
  }
  
}

?>