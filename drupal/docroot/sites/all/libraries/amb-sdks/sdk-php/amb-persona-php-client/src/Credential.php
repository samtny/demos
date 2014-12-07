<?php
    /**
    * Help class for storing account auth info
    */
    class Credential {
        public $email;
        public $password;

        public function __construct($email, $password) {
            $this->email = $email;
            $this->password = $password;
        }

        public function getHash() {
            return base64_encode($this->email.':'.$this->password);    
        }
    }
