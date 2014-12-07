<?php
    /**
    * Class for Digest approach Persona calls.
    */
    class DigestAuthenticator extends PersonaAuthenticator {
        protected $_authentication = 'digest';

      /**
        * Slide user session token to extend ttl
        */
        public function slideUserSession($userPersonaId, $accessToken) {
          $this->resetAll();

          return $this->request(
            $this->_config['baseUrl'].$this->_config['application'].$this->_config['usersEndPointForSlideSession'],
            json_encode(array(
              'user_id' => $userPersonaId,
              'access_token' => $accessToken
            )),
            $accessToken
          );
        }

      /**
        * Set new account password - useful for restoring lost passwords
        * 
        * @param string $email
        * @param string $newPassword
        * @return bool
        */
        public function changePassword($email, $newPassword) {
            $this->resetAll();
            return $this->request(
                $this->_config['baseUrl'].$this->_config['application'].$this->_config['usersEndPointForPasswordChange'], 
                json_encode(array(
                    'email' => $email,
                    'new_password' => base64_encode($newPassword),
                ))
            ); 
        }

        /**
        * Delete user account (soft deletion)
        * 
        * @param string $userPersonaId
        * @param string $accessToken user or admin access token
        * @return bool
        */
        public function deleteUser($userPersonaId, $accessToken) {
            $this->resetAll();
            return $this->request(
                $this->_config['baseUrl'].$this->_config['application'].$this->_config['usersEndPointForDeletion'],
                json_encode(array('user_id' => $userPersonaId)),
                $accessToken
            );
        }

        /**
        * Change account details
        * 
        * @param string $userData array with updated fields (to change password you need two fields - old_password and new_password)
        * @param string $accessToken user or admin access token
        * @return bool
        */
        public function updateUser($userData, $accessToken) {
            $this->resetAll();
            return $this->request(
                $this->_config['baseUrl'].$this->_config['application'].$this->_config['usersEndPointForUpdate'],
                json_encode($userData),
                $accessToken
            );
        }

        /**
        * Get user �����������
        * 
        * @param string $userPersonaId
        * @param string $accessToken user or admin access token
        * @return bool
        */
        public function retrieveUser($userPersonaId, $accessToken) {
            $this->resetAll();
            return $this->request(
                $this->_config['baseUrl'].$this->_config['application'].$this->_config['usersEndPointForRetrieving'].'/'.$userPersonaId,
                $userPersonaId,
                $accessToken,
                "GET"
            );
        }
        
        /**
        * Add new role to account
        * 
        * @param string $userPersonaId
        * @param array $newRoles array of new account roles to add
        * @param string $accessToken user or admin access token
        * @return bool
        */
        public function addRoles($userPersonaId, $newRoles, $accessToken) {
            $this->resetAll();
            $userData = array(
                "user_id" => $userPersonaId,
                "roles" => $newRoles
            );
            return $this->request(
                $this->_config['baseUrl'].$this->_config['application'].$this->_config['usersEndPointForRoleAdd'],
                json_encode($userData),
                $accessToken
            );
        }
        
        /**
        * Drop some roles from account
        * 
        * @param mixed $userPersonaId
        * @param mixed $removedRoles array of roles to drop
        * @param mixed $accessToken user or admin access token
        * @return bool
        */
        public function dropRoles($userPersonaId, $removedRoles, $accessToken) {
            $this->resetAll();
            $userData = array(
                "user_id" => $userPersonaId,
                "roles" => $removedRoles
            );
            return $this->request(
                $this->_config['baseUrl'].$this->_config['application'].$this->_config['usersEndPointForRoleDrop'],
                json_encode($userData),
                $accessToken
            );
        }

        /**
        * Add needed headers  for curl request (type, signature, access token)
        *  
        * @param mixed $curl CURL module
        * @param mixed $data
        * @param mixed $accessToken
        */
        protected function addHeaders($curl, $data, $accessToken) {
            $time = time();
            $headers = array(                                                                          
                'Content-Type: application/json',                                                                                
                'x-persona-digest: HMAC-SHA-256',                                                                                
                'x-persona-date: '.$this->getDataInPersonaFormat($time),                                                                                
                $this->produceSignedHeader($time, $data, $accessToken),                                                                                
            );
            if ($this->_config['debugMode']) {
                $this->_debugInfo['headers'] = $headers;
            }
            curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
        }

        /**
        * cross-platform version of com_create_guid() which is Windows-only
        * curly braces are trimmed
        */
        private function createGUID() {
            mt_srand((double)microtime()*10000);
            $charid = strtolower(md5(uniqid(rand(), true)));
            $hyphen = chr(45);// �-�
            $uuid = substr($charid, 0, 8).$hyphen
            .substr($charid, 8, 4).$hyphen
            .substr($charid,12, 4).$hyphen
            .substr($charid,16, 4).$hyphen
            .substr($charid,20,12);

            return $uuid;
        }

        /**
        * Produce signature header needed for Digest operations
        * 
        * @param mixed $time
        * @param mixed $data
        * @param mixed $accessToken
        */
        public function produceSignedHeader($time, $data, $accessToken='') {
            $algorithm = "HMAC-SHA-256";
            $personaId = implode("/", array(
                $this->_config['apiId'],
                gmdate("Ymd",$time),
                $this->createGUID(),
                "personaRequest",
            ));
            $stringToSign = implode("\n", array(
                $algorithm,
                $this->getDataInPersonaFormat($time),
                $personaId,
                $this->_config['apiId'],
                $data
            ));
            $secret = $this->_config['apiId'].$this->_config['apiPrivateKey'];
            if ($this->_config['debugMode']) { 
                $this->_debugInfo['persona sign info'] = array(
                    'string to sign' => $stringToSign,
                    'sign key' => $secret,
                );
            }
            $personaSignature = base64_encode(hash_hmac('sha256', $stringToSign, $secret, true));

            $header = 'Authorization: Persona personaid="'.$personaId.'",personasignature="'.$personaSignature.'"';
            if ($accessToken) { 
                $header .= ',accesstoken='.$accessToken;
            }
            return $header;
        }

        /**
        * Generate data in format used for creation Persona signature
        * 
        * @param int $time
        */
        private function getDataInPersonaFormat($time) {
            return gmdate("Ymd",$time).'T'.gmdate("His",$time).'Z';
        }
    }
