<?php
    /**
    * Parent class both for Basic and Digest approaches of Persona
    */
    abstract class PersonaAuthenticator {
        const HTTP_OK = 200;

        /**
        * contains type of authentication, must be 'basic' or 'digest'
        */
        protected $_authentication = '';

        /**
        * config values for all other operations
        */
        protected $_config = array(
            'baseUrl' => 'http://dev.persona.amb-api.com/v1/identity/apps/',
            'authenticateEndPoint' => '/authenticate',
            'usersEndPoint' => '/users/create',
            'usersEndPointForDeletion' => '/users/delete',
            'usersEndPointForUpdate' => '/users/update',
            'usersEndPointForRetrieving' => '/user',
            'usersEndPointForPasswordChange' => '/users/change_password',
            'usersEndPointForRoleAdd' => '/users/roles/add',
            'usersEndPointForRoleDrop' => '/users/roles/drop',
            'usersEndPointForSlideSession' => '/users/user_session/slide',
            'application' => '',
            'apiId' => '',
            'apiPrivateKey' => '',
            'debugMode' => false,
        );

        protected $_errors = array();
        protected $_debugInfo = array();

        protected $_response = '';

        public function __construct($config = array()) {
            $this->_config = array_merge($this->_config, $config);
        }

        protected function addError($error) {
            $this->_errors[] = $error;
        }

        /**
        * Gets error from Persona response, either in JSON or plain-text
        * 
        * @param string $response
        * @return string Error text
        */
        protected function parseErrorFromPersonaResponse($response) {
            $responseArray = json_decode($response, true);
            if ($responseArray === null) {
                return $response;
            } else {
                return $responseArray['message'];
            }
        }

        /**
        * clear all error data stored
        */
        protected function resetErrors() {
            $this->_errors = array();
        }

        /** 
        * clear all stored data for operation
        */
        protected function resetAll() {
            $this->_errors = array();
            $this->_debugInfo = array();
            $this->_response = '';
        }

        public function getErrors() {
            return $this->_errors;
        }
        
        /**
        * get all errors data as 1 string
        */
        public function getErrorString() {
            return implode(', ', $this->_errors);
        }

        public function getDebugInfo() {
            return $this->_debugInfo;
        }

        public function getResponse() {
            return $this->_response;
        }

        /**
        * parse Persona response for access token
        */
        public function getAccessToken() {
            $responseArray = json_decode($this->_response, true);
            if (is_array($responseArray) && array_key_exists("access_token", $responseArray)) {
                return $responseArray['access_token'];
            } else {
                $this->addError("No access token in Persona response");
                return false;
            }
        }

        public function __get($name) {
            if(isset($this->_config[$name]))
                return $this->_config[$name];
        }

        public function __set($name,$value) {
            $this->_config[$name] = $value;
        }

        /**
        * Main function - utilizing CURL php module to make requets to Persona server, checks response and store results
        * 
        * @param mixed $url 
        * @param mixed $data data to send
        * @param mixed $accessToken leave empty for operations which dont require access token
        * @param mixed $type POST or GET
        * @return bool result of operation
        */
        protected function request($url, $data, $accessToken = '', $type = 'POST') {
            if( $curl = curl_init() ) {
                curl_setopt($curl, CURLOPT_URL, $url);
                curl_setopt($curl, CURLOPT_RETURNTRANSFER,true);
                if ($type == 'POST') {
                    curl_setopt($curl, CURLOPT_POST, true);   
                    curl_setopt($curl, CURLOPT_POSTFIELDS, $data); 
                    if ($this->_config['debugMode']) {
                    $this->_debugInfo['data'] = $data;
                }
                }
                if ($this->_config['debugMode']) {
                    $this->_debugInfo['url'] = $url;
                } 
                $this->addHeaders($curl, $data, $accessToken);
                $this->_response = curl_exec($curl);
                $httpStatus = curl_getinfo($curl, CURLINFO_HTTP_CODE);
                curl_close($curl);
                if ($httpStatus == self::HTTP_OK) {
                    return true;
                } else {
                    $this->addError($this->parseErrorFromPersonaResponse($this->_response));
                    return false;
                }
            } else {
                $this->addError('CURL failed to initialize');
                return false;                
            }    
        }

        /**
        * Add needed headers  for curl request (type)
        *  
        * @param mixed $curl CURL module
        * @param mixed $data
        * @param mixed $accessToken
        */
        protected function addHeaders($curl, $data, $accessToken) {
            $headers = array(
                'Content-Type: application/json'
            );
            curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
            if ($this->_config['debugMode']) {
                $this->_debugInfo['headers'] = $headers;
            }
        }

        /**
        * Runs authentication with given credential
        * 
        * @param Credential $credential
        * @param string $role role to acquire
        * @return bool result of authentication
        */
        public function authenticate(Credential $credential, $role = "") {
            $this->resetAll();
            $dataToSend = array(
                "authentication" => $this->_authentication,
                "value" => $credential->getHash(),
            );
            !empty($role) && $dataToSend['as'] = $role;
            return $this->request(
                $this->_config['baseUrl'].$this->_config['application'].$this->_config['authenticateEndPoint'], 
                json_encode($dataToSend)
            );
        }

        /**
        * Creates user in Persona server
        * 
        * @param array $userData email, name, display_name, password(base64), do_authentication(true or false), status('enabled' or 'disabled') 
        * @return bool
        */
        public function createUser($userData) {
            $this->resetAll();
            return $this->request(
                $this->_config['baseUrl'].$this->_config['application'].$this->_config['usersEndPoint'], 
                json_encode($userData)
            ); 
        }

    }


