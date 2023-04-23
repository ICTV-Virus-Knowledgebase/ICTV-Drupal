<?php

namespace Drupal\ictv_proposal_service\Plugin\rest\resource;

class Utils {

    // Is this string null or empty?
    public static function IsNullOrEmpty($str){
        return ($str === null || trim($str) === '');
    }

}

